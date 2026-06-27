// src/App.jsx
// NOTE: Import paths dùng đúng tên folder - phân biệt chữ HOA/thường
import { useState, useEffect } from "react";
import LoginPage        from "./pages/auth/LoginPage";       // auth - chữ thường
import StaffDashboard   from "./pages/Staff/StaffDashboard"; // Staff - chữ HOA
import ManagerDashboard from "./pages/Manager/ManagerDashboard"; // Manager - chữ HOA
import AdminDashboard   from "./pages/Admin/AdminDashboard"; // Admin - chữ HOA
import AccountantDashboard from "./pages/Accountant/AccountantDashboard";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { localStorage.removeItem("currentUser"); }
    }
  }, []);

  const handleLogin  = (u) => { localStorage.setItem("currentUser", JSON.stringify(u)); setUser(u); };
  const handleLogout = () => { localStorage.removeItem("currentUser"); setUser(null); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  switch (user.role) {
    case "STAFF":   return <StaffDashboard   user={user} onLogout={handleLogout} />;
    case "MANAGER": return <ManagerDashboard user={user} onLogout={handleLogout} />;
    case "ADMIN":   return <AdminDashboard   user={user} onLogout={handleLogout} />;
    case "ACCOUNTANT": return <AccountantDashboard user={user} onLogout={handleLogout} />;
    default:
      return (
        <div style={{ color:"#ef4444", padding:32 }}>
          Role không hợp lệ: {user.role}
          <button onClick={handleLogout} style={{ marginLeft:12 }}>Đăng xuất</button>
        </div>
      );
  }
}
