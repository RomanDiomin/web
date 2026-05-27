const { Op, fn, col } = require("sequelize");
const Task = require("../models/Task");
const Note = require("../models/Note");
const { logTaskAction } = require("../models/AuditLog");
const { validateTaskPayload, parseTaskQuery } = require("../validators");

// Helper to broadcast socket events safely
function broadcastUpdate(req, event, data) {
  const io = req.app.get("io");
  if (io) {
    io.emit(event, data);
  }
}

const taskController = {
  async getTasks(req, res) {
    const parsed = parseTaskQuery(req.query);
    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.error });
    }

    const { status, search, page, limit, offset } = parsed.data;

    const where = { user_id: req.user.userId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const { count, rows } = await Task.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit,
        offset
      });

      // Format times to match legacy output
      const formattedRows = rows.map((task) => {
        const val = task.toJSON();
        // format Time string to HH:MM if it exists
        if (val.reminder_time) {
          val.reminder_time = val.reminder_time.substring(0, 5);
        }
        if (val.due_at) {
          // Format date to ISO date-time string matching custom select
          val.due_at = new Date(val.due_at).toISOString().substring(0, 16);
        }
        return val;
      });

      res.json({
        items: formattedRows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error("Fetch tasks error:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  },

  async createTask(req, res) {
    const validated = validateTaskPayload(req.body, true);
    if (!validated.ok) {
      return res.status(400).json({ message: validated.errors.join(", ") });
    }

    try {
      const { title, description = "", status, repeat_type = "none" } = validated.payload;
      const reminderTime = validated.payload.reminder_time || null;
      const dueAt = validated.payload.due_at || null;

      const task = await Task.create({
        user_id: req.user.userId,
        title,
        description,
        status,
        repeat_type,
        reminder_time: reminderTime,
        due_at: dueAt
      });

      // NoSQL logging
      await logTaskAction("create", task.id, req.user.userId, task.toJSON());

      // Realtime websocket update
      broadcastUpdate(req, "task_changed", { action: "create", taskId: task.id, userId: req.user.userId });

      const output = task.toJSON();
      if (output.reminder_time) output.reminder_time = output.reminder_time.substring(0, 5);
      if (output.due_at) output.due_at = new Date(output.due_at).toISOString().substring(0, 16);

      res.status(201).json(output);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  },

  async updateTask(req, res) {
    const id = Number(req.params.id);
    const validated = validateTaskPayload(req.body, false);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    if (!validated.ok) {
      return res.status(400).json({ message: validated.errors.join(", ") });
    }

    try {
      const task = await Task.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const nextTitle = validated.payload.title !== undefined ? validated.payload.title : task.title;
      const nextDescription = validated.payload.description !== undefined ? validated.payload.description : task.description;
      const nextStatus = validated.payload.status !== undefined ? validated.payload.status : task.status;
      const nextRepeatType = validated.payload.repeat_type !== undefined ? validated.payload.repeat_type : task.repeat_type;
      
      let nextReminderTime = task.reminder_time;
      if (validated.payload.reminder_time !== undefined) {
        nextReminderTime = validated.payload.reminder_time;
      }
      
      let nextDueAt = task.due_at;
      if (validated.payload.due_at !== undefined) {
        nextDueAt = validated.payload.due_at;
      }

      let nextDeadlineNotifiedAt = task.deadline_notified_at;
      if (validated.payload.due_at !== undefined) {
        nextDeadlineNotifiedAt = null;
      }

      if (!nextTitle) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      if (nextRepeatType === "daily" && !nextReminderTime) {
        return res.status(400).json({ message: "reminder_time is required for daily reminders" });
      }

      // Update fields
      task.title = nextTitle;
      task.description = nextDescription;
      task.status = nextStatus;
      task.repeat_type = nextRepeatType;
      task.reminder_time = nextRepeatType === "daily" ? nextReminderTime : null;
      task.due_at = nextDueAt;
      task.deadline_notified_at = nextDeadlineNotifiedAt;

      await task.save();

      // NoSQL logging
      await logTaskAction("update", task.id, req.user.userId, {
        title: nextTitle,
        status: nextStatus,
        repeat_type: nextRepeatType
      });

      // Realtime websocket update
      broadcastUpdate(req, "task_changed", { action: "update", taskId: task.id, userId: req.user.userId });

      const output = task.toJSON();
      if (output.reminder_time) output.reminder_time = output.reminder_time.substring(0, 5);
      if (output.due_at) output.due_at = new Date(output.due_at).toISOString().substring(0, 16);

      res.json(output);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  },

  async deleteTask(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    try {
      const deletedRows = await Task.destroy({
        where: { id, user_id: req.user.userId }
      });

      if (deletedRows === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      // NoSQL logging
      await logTaskAction("delete", id, req.user.userId, {});

      // Realtime websocket update
      broadcastUpdate(req, "task_changed", { action: "delete", taskId: id, userId: req.user.userId });

      res.status(204).send();
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  },

  async getRemindersToday(req, res) {
    try {
      // Find daily repeat tasks belonging to current user
      const rows = await Task.findAll({
        where: {
          user_id: req.user.userId,
          repeat_type: "daily"
        },
        order: [
          [col("reminder_time"), "ASC"],
          ["created_at", "DESC"]
        ]
      });

      const formatted = rows.map((task) => {
        const val = task.toJSON();
        
        let isDueNow = 0;
        if (val.reminder_time) {
          val.reminder_time = val.reminder_time.substring(0, 5);
          // Calculate is_due_now based on current server time
          const nowStr = new Date().toTimeString().substring(0, 5); // "HH:MM"
          isDueNow = nowStr >= val.reminder_time ? 1 : 0;
        }

        return {
          ...val,
          is_due_now: isDueNow
        };
      });

      res.json(formatted);
    } catch (error) {
      console.error("Fetch reminders error:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  },

  async getNotes(req, res) {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    try {
      const task = await Task.findOne({ where: { id: taskId, user_id: req.user.userId } });
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const notes = await Note.findAll({
        where: { task_id: taskId },
        order: [["created_at", "DESC"]]
      });

      res.json(notes);
    } catch (error) {
      console.error("Fetch notes error:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  },

  async createNote(req, res) {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const body = String(req.body.body || "").trim();
    if (!body) {
      return res.status(400).json({ message: "Note text is required" });
    }

    try {
      const task = await Task.findOne({ where: { id: taskId, user_id: req.user.userId } });
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const note = await Note.create({
        task_id: taskId,
        body
      });

      res.status(201).json(note);
    } catch (error) {
      console.error("Create note error:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  },

  async deleteNote(req, res) {
    const taskId = Number(req.params.id);
    const noteId = Number(req.params.noteId);
    if (!Number.isInteger(taskId) || taskId <= 0 || !Number.isInteger(noteId) || noteId <= 0) {
      return res.status(400).json({ message: "Invalid id" });
    }

    try {
      const note = await Note.findOne({
        where: { id: noteId, task_id: taskId },
        include: [{
          model: Task,
          where: { user_id: req.user.userId },
          required: true
        }]
      });

      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      await note.destroy();
      res.status(204).send();
    } catch (error) {
      console.error("Delete note error:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  }
};

module.exports = taskController;
