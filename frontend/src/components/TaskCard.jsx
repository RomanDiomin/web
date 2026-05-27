import React from "react";
import { TaskNotes } from "./TaskNotes";

const STATUS_UK = {
  new: "Нове",
  in_progress: "В роботі",
  done: "Виконано"
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const formattedCreated = new Date(task.created_at).toLocaleString("uk-UA", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const formattedDue = task.due_at
    ? new Date(task.due_at).toLocaleString("uk-UA", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;

  const isCompleted = task.status === "done";

  const handleToggleComplete = () => {
    onStatusChange(task.id, isCompleted ? "new" : "done");
  };

  return (
    <div className={`task-item ${isCompleted ? "completed" : ""}`} style={{ opacity: isCompleted ? 0.75 : 1 }}>
      <div className="task-header" style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%", marginBottom: "10px" }}>
        
        {/* Interactive Checkbox Ring */}
        <button
          type="button"
          onClick={handleToggleComplete}
          className="task-checkbox-btn"
          style={{
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "24px",
            height: "24px",
            borderRadius: "50%",
            border: isCompleted ? "2px solid #10b981" : "2px solid var(--text-secondary)",
            backgroundColor: isCompleted ? "rgba(16, 185, 129, 0.15)" : "transparent",
            color: isCompleted ? "#10b981" : "transparent",
            fontSize: "0.85rem",
            fontWeight: "bold",
            transition: "all 0.2s ease"
          }}
          title={isCompleted ? "Відмітити як невиконане" : "Позначити як виконане"}
        >
          ✓
        </button>

        {/* Task Title */}
        <h3 className="task-title" style={{ 
          margin: 0, 
          flex: 1, 
          textDecoration: isCompleted ? "line-through" : "none",
          color: isCompleted ? "var(--text-secondary)" : "var(--text-primary)",
          transition: "all 0.25s ease"
        }}>
          {task.title}
        </h3>

        {/* Status Badge */}
        <span className={`status-badge ${task.status}`}>
          {STATUS_UK[task.status] || task.status}
        </span>
      </div>

      <div className="text-muted" style={{ fontSize: "0.75rem", marginBottom: "12px", marginLeft: "38px" }}>
        Створено: {formattedCreated}
      </div>

      <div className="task-meta-row" style={{ marginLeft: "38px" }}>
        {task.repeat_type === "daily" && (
          <span className="meta-pill reminder">
            <span>🔄</span> Щодня {task.reminder_time ? `о ${task.reminder_time}` : ""}
          </span>
        )}
        {formattedDue && (
          <span className="meta-pill deadline">
            <span>📅</span> Дедлайн: {formattedDue}
          </span>
        )}
      </div>

      {task.description && (
        <p className="task-description" style={{ marginLeft: "38px", textDecoration: isCompleted ? "line-through" : "none" }}>
          {task.description}
        </p>
      )}

      <div className="task-footer" style={{ paddingLeft: "38px" }}>
        <div className="task-footer-actions">
          {task.status !== "in_progress" && task.status !== "done" && (
            <button
              type="button"
              className="task-btn-small"
              onClick={() => onStatusChange(task.id, "in_progress")}
            >
              В роботу
            </button>
          )}
          {task.status === "in_progress" && (
            <button
              type="button"
              className="task-btn-small"
              onClick={() => onStatusChange(task.id, "new")}
            >
              Призупинити
            </button>
          )}
        </div>
        
        <div className="task-footer-actions">
          <button
            type="button"
            className="task-btn-small edit"
            onClick={() => onEdit(task)}
          >
            Редагувати
          </button>
          <button
            type="button"
            className="task-btn-small delete"
            onClick={() => onDelete(task.id)}
          >
            Видалити
          </button>
        </div>
      </div>

      <div style={{ marginLeft: "38px" }}>
        <TaskNotes taskId={task.id} />
      </div>
    </div>
  );
}
