import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../context/AppContext";

export function PremiumCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const sId = searchParams.get("session_id");
    if (sId) {
      setSuccess(true);
      setSessionId(sId);
      // Persist premium state locally
      localStorage.setItem("premium", "true");
      showToast("Передплата Premium активована успішно!", "success");
    }
  }, [searchParams]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/payment/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api.getToken()}`
        }
      });
      const data = await response.json();
      if (data.url) {
        // Redirect to Stripe checkout screen (mock or live)
        window.location.href = data.url;
      } else {
        throw new Error("Не вдалося отримати сесію оплати");
      }
    } catch (err) {
      showToast("Помилка підключення платіжної системи: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container glass-panel" style={{ maxWidth: "500px" }}>
        <h1 style={{ color: "var(--success)" }}>Premium активовано! 🎉</h1>
        <p className="lead" style={{ marginTop: "12px" }}>
          Дякуємо за покупку! Ваш акаунт оновлено до тарифу <strong>Premium</strong>.
        </p>
        <div style={{
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          margin: "24px 0",
          fontSize: "0.85rem",
          color: "var(--success)",
          textAlign: "left"
        }}>
          <div><strong>ID транзакції:</strong></div>
          <div style={{ wordBreak: "break-all", fontFamily: "monospace", marginTop: "4px" }}>
            {sessionId}
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate("/")}>
          Повернутися до завдань
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container glass-panel" style={{ maxWidth: "520px" }}>
      <h1>Task Manager Premium 💎</h1>
      <p className="lead" style={{ marginTop: "8px" }}>
        Отримайте розширений функціонал для ведення ваших проектів
      </p>

      <div style={{ textAlign: "left", margin: "24px 0" }}>
        <div style={{ marginBottom: "14px", display: "flex", gap: "12px" }}>
          <span>🚀</span>
          <div>
            <strong>Миттєві сповіщення (WebSockets)</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Миттєве синхронізування та сповіщення про зміну задач між усіма пристроями.
            </div>
          </div>
        </div>
        <div style={{ marginBottom: "14px", display: "flex", gap: "12px" }}>
          <span>📈</span>
          <div>
            <strong>Концентричні кільця активності</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Аналіз продуктивності у реальному часі та візуалізація прогресу.
            </div>
          </div>
        </div>
        <div style={{ marginBottom: "14px", display: "flex", gap: "12px" }}>
          <span>📜</span>
          <div>
            <strong>Журнал подій у NoSQL (MongoDB)</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Логування змін для повної історії ваших завдань.
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "1.4rem", fontWeight: "800", margin: "24px 0", fontFamily: "var(--font-title)" }}>
        $4.99 <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--text-secondary)" }}>/ одноразово</span>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        style={{ width: "100%", padding: "14px" }}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? "Підключення до платіжного шлюзу..." : "Купити Premium"}
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        style={{ width: "100%", marginTop: "12px" }}
        onClick={() => navigate("/")}
      >
        Назад до безкоштовної версії
      </button>
    </div>
  );
}
export default PremiumCheckout;
