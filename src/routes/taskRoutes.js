const express = require("express");
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply auth middleware to all task routes
router.use(authMiddleware);

// Specific paths must precede generic parameter paths
router.get("/reminders/today", taskController.getRemindersToday);

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

// Notes paths
router.get("/:id/notes", taskController.getNotes);
router.post("/:id/notes", taskController.createNote);
router.delete("/:id/notes/:noteId", taskController.deleteNote);

module.exports = router;
