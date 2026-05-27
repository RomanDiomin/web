import React, { useState, useEffect } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useDebounce } from "../hooks/useDebounce";
import { TaskCard } from "./TaskCard";

export function TaskList({ onEditTask }) {
  const { tasksUpdatedKey, refreshTasks, showToast } = useApp();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Use Custom Hook for debouncing query strings (Topic 7)
  const debouncedQuery = useDebounce(searchQuery, 400);

  // When debounced query changes, reset page to 1
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  // Load tasks when any pagination/filter state changes
  useEffect(() => {
    loadTasks();
  }, [tasksUpdatedKey, statusFilter, page, limit, debouncedQuery]);

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getTasks({
        status: statusFilter,
        search: debouncedQuery,
        page,
        limit
      });
      setTasks(data.items || []);
      if (data.pagination) {
        setPagination({
          page: data.pagination.page,
          pages: data.pagination.pages,
          total: data.pagination.total
        });
      }
    } catch (err) {
      setError(err.message || "Не вдалося завантажити завдання");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (taskId, nextStatus) => {
    try {
      await api.updateTask(taskId, { status: nextStatus });
      refreshTasks(); // Refresh global tasks state
    } catch (err) {
      showToast("Помилка при оновленні статусу: " + err.message, "error");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Ви дійсно хочете видалити це завдання?")) return;

    try {
      await api.deleteTask(taskId);
      refreshTasks(); // Refresh global tasks state
    } catch (err) {
      showToast("Помилка при видаленні завдання: " + err.message, "error");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div>
      <div className="card glass-panel" style={{ marginBottom: "24px" }}>
        <h2>Фільтри</h2>
        <div className="form-stack filters-grid">
          <div>
            <label htmlFor="filter-status">Статус</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Усі</option>
              <option value="new">Нове</option>
              <option value="in_progress">В роботі</option>
              <option value="done">Виконано</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-page">Сторінка</label>
            <input
              id="filter-page"
              type="number"
              min="1"
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div className="full">
            <label htmlFor="filter-limit">Завдань на сторінці</label>
            <input
              id="filter-limit"
              type="number"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value))))}
            />
          </div>

          <div className="full" style={{ position: "relative" }}>
            <label htmlFor="filter-search">Пошук за назвою або описом (автоматичний)</label>
            <div style={{ position: "relative" }}>
              <input
                id="filter-search"
                type="text"
                placeholder="Почніть вводити назву або опис..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingRight: "40px", marginBottom: 0 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    padding: "4px"
                  }}
                  title="Очистити пошук"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card glass-panel">
        <h2>Мої завдання</h2>
        <p className="card-subtitle">Список із фільтрами, статусами та записами</p>

        {error && <div className="error-banner">{error}</div>}

        {loading && tasks.length === 0 ? (
          <p className="text-center text-muted">Завантаження завдань...</p>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            Поки немає задач. Додайте першу за допомогою форми ліворуч або змініть фільтри.
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}

            <div className="pagination-controls">
              <div>
                Сторінка {pagination.page} з {Math.max(1, pagination.pages)} · Всього {pagination.total}
              </div>
              <div className="pagination-buttons">
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1 || loading}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page >= pagination.pages || loading}
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default TaskList;
