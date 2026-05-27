import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "./api";
import { AppProvider, useApp } from "./context/AppContext";
import { Auth } from "./components/Auth";
import { Stats } from "./components/Stats";
import { Reminders } from "./components/Reminders";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import { Modal } from "./components/Modal";
import { PremiumCheckout } from "./components/PremiumCheckout";

// Dashboard Component representing the main task manager grid
function Dashboard() {
  const { user, tasksUpdatedKey, refreshTasks, logoutUser, showToast } = useApp();
  const [editingTask, setEditingTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSaved = () => {
    setEditingTask(null);
    setIsModalOpen(false);
    refreshTasks();
  };

  const handleOpenReport = () => {
    const token = api.getToken();
    if (token) {
      window.open(`/report?token=${token}`, "_blank");
    } else {
      showToast("Помилка отримання сесії", "error");
    }
  };

  return (
    <>
      <div className="app-grid">
        {/* Left Column: Actions Sidebar */}
        <div>
          <div className="card glass-panel" style={{ padding: "16px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Швидкі дії</h2>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
            >
              ➕ Створити завдання
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              onClick={handleOpenReport}
            >
              📊 Згенерувати звіт (EJS)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", padding: "10px", border: "1px solid #fbbf24", color: "#fbbf24" }}
              onClick={() => navigate("/premium")}
            >
              💎 Отримати Premium
            </button>
          </div>

          <Stats tasksUpdatedKey={tasksUpdatedKey} />
        </div>

        {/* Right Column: Reminders & Tasks List */}
        <div>
          <Reminders tasksUpdatedKey={tasksUpdatedKey} />
          <TaskList
            tasksUpdatedKey={tasksUpdatedKey}
            onTasksChanged={refreshTasks}
            onEditTask={handleEditTask}
          />
        </div>
      </div>

      {/* Task Creation & Editing Portal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <TaskForm
          editingTask={editingTask}
          onCancelEdit={() => setIsModalOpen(false)}
          onTaskSaved={handleTaskSaved}
        />
      </Modal>
    </>
  );
}

// Auth page wrapper matching App layouts
function AuthWrapper() {
  const { loginUser, showToast } = useApp();
  return <Auth onAuthSuccess={loginUser} showToast={showToast} />;
}

// Router Coordinator consuming context states
function MainRoutes() {
  const { user, toasts, logoutUser, refreshTasks, showToast } = useApp();

  // Socket.io connection for real-time task sync notifications
  useEffect(() => {
    if (!user) return;

    // Connect socket connection to the server
    const socket = io();

    socket.on("connect", () => {
      console.log("[socket] Connected to server");
    });

    socket.on("task_changed", (data) => {
      // Trigger notifications only for actions belonging to current user
      if (data.userId === user.id) {
        refreshTasks();
        if (data.action === "create") {
          showToast("Створено нове завдання в реальному часі!", "info");
        } else if (data.action === "update") {
          showToast("Завдання оновлено в реальному часі!", "info");
        } else if (data.action === "delete") {
          showToast("Завдання видалено на іншому пристрої!", "info");
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Background floating orbs mouse follow effect
  useEffect(() => {
    const handleMouseMove = (event) => {
      const orbs = document.querySelectorAll(".water-orb");
      if (orbs.length === 0) return;
      const xRatio = event.clientX / window.innerWidth - 0.5;
      const yRatio = event.clientY / window.innerHeight - 0.5;
      orbs.forEach((orb, index) => {
        const factor = (index + 1) * 12;
        orb.style.transform = `translate3d(${-xRatio * factor}px, ${-yRatio * factor}px, 0)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Background Orbs */}
      <div className="water-bg" aria-hidden="true">
        <div className="water-orb orb-1"></div>
        <div className="water-orb orb-2"></div>
        <div className="water-orb orb-3"></div>
      </div>

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Top Header bar */}
      <header className="topbar">
        <div className="brand" style={{ cursor: "pointer" }}>Менеджер завдань</div>
        <div className="topbar-actions">
          {user ? (
            <>
              <span className="user-info">
                👤 {user.name} ({user.email})
              </span>
              <button type="button" className="btn-ghost" onClick={handleLogoutRedirect}>
                Вийти
              </button>
            </>
          ) : (
            <a
              href="/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#38bdf8", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
            >
              Документація API
            </a>
          )}
        </div>
      </header>

      {/* Router Switcher */}
      <main className="shell">
        <Routes>
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <AuthWrapper /> : <Navigate to="/" />} />
          <Route path="/premium" element={user ? <PremiumCheckout /> : <Navigate to="/login" />} />
          <Route path="/premium/success" element={user ? <PremiumCheckout /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );

  function handleLogoutRedirect() {
    logoutUser();
  }
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
