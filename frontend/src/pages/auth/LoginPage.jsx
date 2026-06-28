// src/pages/auth/LoginPage.jsx
import { useState } from "react";
import "./LoginPage.css";

const API = "http://localhost:8080/api";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      setError("Vui lòng nhập tài khoản và mật khẩu!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sai tài khoản hoặc mật khẩu");
      // Lưu user vào localStorage để giữ session
      localStorage.setItem("currentUser", JSON.stringify(data));
      onLogin(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <img src="/ptit-logo.png" alt="PTIT Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <h1 className="login-title">Quản Lý Nhân Viên Nhà Xe</h1>
        <p className="login-sub">Đăng nhập vào hệ thống</p>

        {error && <div className="login-error">{error}</div>}

        <div className="login-field">
          <label>Tài khoản</label>
          <input
            type="text"
            placeholder="Nhập tên đăng nhập..."
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div className="login-field">
          <label>Mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu..."
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập →"}
        </button>

      </div>
    </div>
  );
}
