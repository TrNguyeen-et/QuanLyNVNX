import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import StaffDashboard from './pages/Staff/StaffDashboard';

const Dashboard = ({ user, handleLogout }) => {
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'admin': return <AdminDashboard user={user} handleLogout={handleLogout} />;
    case 'manager': return <ManagerDashboard user={user} handleLogout={handleLogout} />;
    case 'staff': return <StaffDashboard user={user} handleLogout={handleLogout} />;
    default: return <Navigate to="/login" />;
  }
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