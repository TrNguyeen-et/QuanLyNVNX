import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import StaffDashboard from './pages/Staff/StaffDashboard';

const Dashboard = ({ user, handleLogout }) => {
  if (!user) return <Navigate to="/login" />;

  const renderContent = () => {
    switch (user.role) {
      case 'admin': return <AdminDashboard />;
      case 'manager': return <ManagerDashboard />;
      case 'staff': return <StaffDashboard user={user} />; // Đã thêm user={user} vào đây
      default: return <Navigate to="/login" />;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>P</div>
          <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Smart Parking</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</p>
            <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{user.username}</p>
          </div>
          
          <button className="btn" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none' }}>📊 Tổng quan</button>
          <button className="btn" style={{ textAlign: 'left', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none' }}>🏍️ Quản lý xe</button>
          <button className="btn" style={{ textAlign: 'left', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none' }}>🎫 Vé gửi xe</button>
          <button className="btn" style={{ textAlign: 'left', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none' }}>📈 Báo cáo</button>
        </div>

        <button 
          onClick={handleLogout}
          className="btn" 
          style={{ marginTop: 'auto', textAlign: 'left', background: 'transparent', color: '#fca5a5', border: 'none', paddingLeft: '1rem' }}
        >
          🚪 Đăng xuất
        </button>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={<Dashboard user={user} handleLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;