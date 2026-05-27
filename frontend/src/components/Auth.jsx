import React, { useState } from "react";
import { api } from "../api";

export function Auth({ onAuthSuccess, showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(email, password);
        onAuthSuccess(data.user);
      } else {
        if (password.length < 6) {
          throw new Error("Пароль має містити щонайменше 6 символів");
        }
        const data = await api.register(name, email, password);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container glass-panel">
      <h1>{isLogin ? "Вхід" : "Реєстрація"}</h1>
      <p className="lead">
        {isLogin
          ? "Увійди, щоб керувати своїми завданнями."
          : "Створи обліковий запис — пароль від 6 символів."}
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="form-stack">
        {!isLogin && (
          <>
            <label htmlFor="auth-name">Ім'я</label>
            <input
              id="auth-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Введіть ваше ім'я"
            />
          </>
        )}

        <label htmlFor="auth-email">Електронна пошта</label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="email@example.com"
        />

        <label htmlFor="auth-password">Пароль</label>
        <input
          id="auth-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder="••••••••"
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Завантаження..." : isLogin ? "Увійти" : "Створити акаунт"}
        </button>
      </form>

      <div className="auth-switch">
        {isLogin ? "Немає акаунта?" : "Вже є акаунт?"}
        <button
          type="button"
          className="btn-ghost"
          style={{ marginLeft: "8px", padding: "4px 8px", display: "inline-flex" }}
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setName("");
            setEmail("");
            setPassword("");
          }}
        >
          {isLogin ? "Зареєструватися" : "Увійти"}
        </button>
      </div>
    </div>
  );
}
