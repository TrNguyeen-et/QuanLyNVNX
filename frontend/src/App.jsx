import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import StaffDashboard from './pages/Staff/StaffDashboard';

const Dashboard = ({ user, handleLogout }) => {
  if (!user) return <Navigate to="/login" />;
  const [activeTab, setActiveTab] = useState('overview');

  const sidebarBtn = (tab) => ({
    textAlign: 'left', background: activeTab === tab ? 'rgba(255,255,255,0.15)' : 'transparent', 
    color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.6)', border: 'none', padding: '1rem',
    borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem', fontSize: '0.95rem', width: '100%'
  });

  const renderSidebar = () => {
    if (user.role === 'ADMIN') return (
      <>
        <button style={sidebarBtn('overview')} onClick={() => setActiveTab('overview')}>📊 Tổng quan</button>
        <button style={sidebarBtn('users')} onClick={() => setActiveTab('users')}>👥 Quản lý Tài khoản</button>
        <button style={sidebarBtn('logs')} onClick={() => setActiveTab('logs')}>📜 Nhật ký hệ thống</button>
      </>
    );
    if (user.role === 'MANAGER') return (
      <>
        <button style={sidebarBtn('requests')} onClick={() => setActiveTab('requests')}>📝 Duyệt đơn</button>
        <button style={sidebarBtn('incidents')} onClick={() => setActiveTab('incidents')}>🚨 Sự cố</button>
        <button style={sidebarBtn('assign')} onClick={() => setActiveTab('assign')}>📅 Xếp ca trực</button>
        <button style={sidebarBtn('salary')} onClick={() => setActiveTab('salary')}>💰 Báo cáo & Lương</button>
      </>
    );
    return ( // STAFF
      <>
        <button style={sidebarBtn('checkin')} onClick={() => setActiveTab('checkin')}>⚡ Chấm công</button>
        <button style={sidebarBtn('schedule')} onClick={() => setActiveTab('schedule')}>📅 Xem lịch</button>
        <button style={sidebarBtn('salary')} onClick={() => setActiveTab('salary')}>💰 Xem lương</button>
        <button style={sidebarBtn('incident')} onClick={() => setActiveTab('incident')}>🚨 Ghi nhận sự cố</button>
        <button style={sidebarBtn('leave')} onClick={() => setActiveTab('leave')}>📩 Xin nghỉ / Đổi ca</button>
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>P</div>
          <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Smart Parking</h2>
        </div>
        <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{user.role}</p>
          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{user.fullName}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>{renderSidebar()}</div>
        <button onClick={handleLogout} className="btn" style={{ marginTop: 'auto', textAlign: 'left', background: 'transparent', color: '#fca5a5', border: 'none', paddingLeft: '1rem', paddingTop: '1rem' }}>🚪 Đăng xuất</button>
      </aside>
      <main className="main-content">
        {user.role === 'ADMIN' && <AdminDashboard activeTab={activeTab} />}
        {user.role === 'MANAGER' && <ManagerDashboard user={user} activeTab={activeTab} />}
        {user.role === 'STAFF' && <StaffDashboard user={user} activeTab={activeTab} />}
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  return (<Router><Routes><Route path="/" element={<Home />} /><Route path="/login" element={<Login setUser={setUser} />} /><Route path="/dashboard" element={<Dashboard user={user} handleLogout={() => setUser(null)} />} /><Route path="*" element={<Navigate to="/" />} /></Routes></Router>);
}
export default App;