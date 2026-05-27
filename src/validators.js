function normalizeStatus(value) {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
}

function normalizeDateTimeLocal(value) {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return "invalid";
  return `${raw.replace("T", " ")}:00`;
}

function validateTaskPayload(input, isCreate = true) {
  const errors = [];
  const allowedStatuses = new Set(["new", "in_progress", "done"]);
  const allowedRepeatTypes = new Set(["none", "daily"]);
  const payload = {};

  if (isCreate || input.title !== undefined) {
    const title = String(input.title || "").trim();
    if (!title) {
      errors.push("Title is required");
    } else {
      payload.title = title;
    }
  }

  if (input.description !== undefined) {
    payload.description = String(input.description);
  }

  if (isCreate || input.status !== undefined) {
    const status = normalizeStatus(input.status) || "new";
    if (!allowedStatuses.has(status)) {
      errors.push("Invalid status");
    } else {
      payload.status = status;
    }
  }

  if (isCreate || input.repeat_type !== undefined) {
    const repeatType = normalizeStatus(input.repeat_type) || "none";
    if (!allowedRepeatTypes.has(repeatType)) {
      errors.push("Invalid repeat_type");
    } else {
      payload.repeat_type = repeatType;
    }
  }

  if (input.reminder_time !== undefined) {
    const reminderTime = String(input.reminder_time || "").trim();
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(reminderTime)) {
      errors.push("Invalid reminder_time format, expected HH:MM");
    } else {
      payload.reminder_time = `${reminderTime}:00`;
    }
  }

  if (input.due_at !== undefined) {
    const dueAt = normalizeDateTimeLocal(input.due_at);
    if (dueAt === "invalid") {
      errors.push("Invalid due_at format, expected YYYY-MM-DDTHH:MM");
    } else {
      payload.due_at = dueAt;
    }
  }

  const effectiveRepeatType = payload.repeat_type ?? normalizeStatus(input.repeat_type) ?? "none";
  if (effectiveRepeatType === "daily" && isCreate && payload.reminder_time === undefined) {
    errors.push("reminder_time is required for daily reminders");
  }

  return { ok: errors.length === 0, errors, payload };
}

function parseTaskQuery(query) {
  const status = normalizeStatus(query.status);
  const search = String(query.search || "").trim();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

  if (status && !["new", "in_progress", "done"].includes(status)) {
    return { ok: false, error: "Invalid status filter" };
  }

  return {
    ok: true,
    data: {
      status,
      search,
      page,
      limit,
      offset: (page - 1) * limit
    }
  };
}

module.exports = {
  validateTaskPayload,
  parseTaskQuery
};
