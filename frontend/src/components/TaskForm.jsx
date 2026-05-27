import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";

export function TaskForm({ editingTask, onCancelEdit, onTaskSaved }) {
  const { showToast } = useApp();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("new");
  const [repeatType, setRepeatType] = useState("none");
  const [reminderTime, setReminderTime] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Use Ref to focus input field (Topic 4)
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setStatus(editingTask.status || "new");
      setRepeatType(editingTask.repeat_type || "none");
      setReminderTime(editingTask.reminder_time || "");
      setDueAt(editingTask.due_at || "");
      setDescription(editingTask.description || "");
    } else {
      setTitle("");
      setStatus("new");
      setRepeatType("none");
      setReminderTime("");
      setDueAt("");
      setDescription("");
    }
    setError("");

    // Auto focus on title input using Ref
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTask]);

  const isDaily = repeatType === "daily";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Назва завдання обов'язкова");
      return;
    }

    if (isDaily && !reminderTime) {
      setError("Час нагадування обов'язковий для щоденного повтору");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        status,
        repeat_type: repeatType,
        reminder_time: isDaily ? reminderTime : null,
        due_at: dueAt ? dueAt : null,
      };

      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
        onTaskSaved("Завдання успішно оновлено");
      } else {
        await api.createTask(payload);
        setTitle("");
        setStatus("new");
        setRepeatType("none");
        setReminderTime("");
        setDueAt("");
        setDescription("");
        onTaskSaved("Завдання успішно створено");
      }
    } catch (err) {
      setError(err.message || "Не вдалося зберегти завдання");
      showToast(err.message || "Не вдалося зберегти завдання", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-stack">
      <h2 style={{ fontFamily: "var(--font-title)", marginBottom: "8px" }}>
        {editingTask ? "Редагувати завдання" : "Нове завдання"}
      </h2>
      <p className="card-subtitle" style={{ marginBottom: "20px" }}>
        {editingTask ? "Змініть потрібні поля" : "Додайте детальну інформацію про завдання"}
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="task-title">Назва</label>
        <input
          ref={titleInputRef}
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Назва завдання..."
        />

        <label htmlFor="task-status">Статус</label>
        <select
          id="task-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="new">Нове</option>
          <option value="in_progress">В роботі</option>
          <option value="done">Виконано</option>
        </select>

        <label htmlFor="task-repeat">Повтор</label>
        <select
          id="task-repeat"
          value={repeatType}
          onChange={(e) => {
            setRepeatType(e.target.value);
            if (e.target.value !== "daily") setReminderTime("");
          }}
        >
          <option value="none">Без повтору</option>
          <option value="daily">Щодня</option>
        </select>

        {isDaily && (
          <>
            <label htmlFor="task-reminder">Час нагадування</label>
            <input
              id="task-reminder"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              required={isDaily}
            />
          </>
        )}

        <label htmlFor="task-due">Дедлайн</label>
        <input
          id="task-due"
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />

        <label htmlFor="task-desc">Опис</label>
        <textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Детальний опис завдання..."
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
            {loading ? "Збереження..." : editingTask ? "Зберегти" : "Додати"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelEdit}
            disabled={loading}
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}
export default TaskForm;
