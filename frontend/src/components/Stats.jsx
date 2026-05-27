import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";

export function Stats() {
  const { tasksUpdatedKey } = useApp();
  const [stats, setStats] = useState({ total: 0, new: 0, progress: 0, done: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      try {
        const [allData, newData, progressData, doneData] = await Promise.all([
          api.getTasks({ limit: 1 }),
          api.getTasks({ limit: 1, status: "new" }),
          api.getTasks({ limit: 1, status: "in_progress" }),
          api.getTasks({ limit: 1, status: "done" })
        ]);

        if (active) {
          setStats({
            total: allData?.pagination?.total || 0,
            new: newData?.pagination?.total || 0,
            progress: progressData?.pagination?.total || 0,
            done: doneData?.pagination?.total || 0
          });
        }
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [tasksUpdatedKey]);

  const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  // Concentric rings calculation
  const getOffset = (value, total, radius) => {
    const circumference = 2 * Math.PI * radius;
    if (total === 0) return circumference;
    const fraction = value / total;
    return circumference * (1 - fraction);
  };

  const circDone = 2 * Math.PI * 40;
  const circProgress = 2 * Math.PI * 30;
  const circNew = 2 * Math.PI * 20;

  return (
    <div className="card glass-panel">
      <h2>Статистика</h2>
      <p className="card-subtitle">Загальна картина по всіх твоїх задачах</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div className="stat-card total" style={{ padding: "10px 14px" }}>
            <div className="stat-label">Всього</div>
            <div className="stat-value" style={{ fontSize: "1.3rem" }}>{stats.total}</div>
          </div>
          <div className="stat-card new" style={{ padding: "10px 14px" }}>
            <div className="stat-label">Нові</div>
            <div className="stat-value" style={{ fontSize: "1.3rem" }}>{stats.new}</div>
          </div>
          <div className="stat-card progress" style={{ padding: "10px 14px" }}>
            <div className="stat-label">В роботі</div>
            <div className="stat-value" style={{ fontSize: "1.3rem" }}>{stats.progress}</div>
          </div>
          <div className="stat-card done" style={{ padding: "10px 14px" }}>
            <div className="stat-label">Виконано</div>
            <div className="stat-value" style={{ fontSize: "1.3rem" }}>{stats.done}</div>
          </div>
        </div>

        <div style={{ position: "relative", width: "100px", height: "100px" }}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" />
            <circle cx="50" cy="50" r="30" fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" />
            <circle cx="50" cy="50" r="20" fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" />
            
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="6"
              strokeDasharray={circDone}
              strokeDashoffset={getOffset(stats.done, stats.total, 40)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
            
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="transparent"
              stroke="#fbbf24"
              strokeWidth="6"
              strokeDasharray={circProgress}
              strokeDashoffset={getOffset(stats.progress, stats.total, 30)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
            
            <circle
              cx="50"
              cy="50"
              r="20"
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeDasharray={circNew}
              strokeDashoffset={getOffset(stats.new, stats.total, 20)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </svg>
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            fontSize: "0.85rem",
            fontWeight: "700",
            fontFamily: "var(--font-title)"
          }}>
            <span>{percent}%</span>
          </div>
        </div>

      </div>

      <div className="progress-wrap">
        <div className="progress-label">
          <span>Виконання</span>
          <strong>{percent}%</strong>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
export default Stats;
