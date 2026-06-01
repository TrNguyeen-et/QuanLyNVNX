// src/App.jsx
// NOTE: Import paths dùng đúng tên folder - phân biệt chữ HOA/thường
import { useState, useEffect } from "react";
import LoginPage        from "./pages/auth/LoginPage";       // auth - chữ thường
import StaffDashboard   from "./pages/Staff/StaffDashboard"; // Staff - chữ HOA
import ManagerDashboard from "./pages/Manager/ManagerDashboard"; // Manager - chữ HOA
import AdminDashboard   from "./pages/Admin/AdminDashboard"; // Admin - chữ HOA

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
    case "HR":
      return (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
          minHeight:"100vh", background:"#0f1117", color:"#e8eaf6",
          fontFamily:"sans-serif", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:48 }}>📁</div>
          <h2>Trang Hành chính đang phát triển</h2>
          <p style={{ color:"#8b92b5" }}>Xin chào, {user.fullName}</p>
          <button onClick={handleLogout} style={{ marginTop:16, padding:"8px 20px",
            background:"#ef4444", color:"#fff", border:"none", borderRadius:8, cursor:"pointer" }}>
            Đăng xuất
          </button>
        </div>
      );
    default:
      return (
        <div style={{ color:"#ef4444", padding:32 }}>
          Role không hợp lệ: {user.role}
          <button onClick={handleLogout} style={{ marginLeft:12 }}>Đăng xuất</button>
        </div>
      );
  }
}
