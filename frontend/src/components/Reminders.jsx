import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";

const STATUS_UK = {
  new: "Нове",
  in_progress: "В роботі",
  done: "Виконано"
};

export function Reminders() {
  const { tasksUpdatedKey, showToast } = useApp();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReminders() {
      setLoading(true);
      setError("");
      try {
        const data = await api.getRemindersToday();
        if (active) {
          setReminders(data || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Не вдалося завантажити нагадування");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReminders();

    return () => {
      active = false;
    };
  }, [tasksUpdatedKey]);

  return (
    <div className="card glass-panel">
      <h2>Нагадування на сьогодні</h2>
      <p className="card-subtitle">Щоденні задачі, які мають нагадувати про себе</p>

      {error && <div className="error-banner">{error}</div>}
      
      {loading && reminders.length === 0 ? (
        <p className="text-center text-muted">Завантаження нагадувань...</p>
      ) : reminders.length === 0 ? (
        <div className="empty-state">Немає щоденних нагадувань.</div>
      ) : (
        <div className="reminder-list">
          {reminders.map((item) => (
            <div key={item.id} className="reminder-item">
              <div className="reminder-content">
                <strong>{item.title}</strong>
                <div className="reminder-meta">
                  {item.reminder_time ? `Час: {item.reminder_time} · ` : ""}
                  Статус: {STATUS_UK[item.status] || item.status}
                </div>
              </div>
              {Boolean(item.is_due_now) && (
                <span className="due-now-badge">Пора робити зараз</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Reminders;
