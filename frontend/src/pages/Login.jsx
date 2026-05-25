import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setUser({ id: 99, username: 'admin', fullName: 'Quản trị viên', role: 'admin' });
      navigate('/dashboard');
    } else if (username === 'manager' && password === 'manager123') {
      setUser({ id: 99, username: 'manager', fullName: 'Quản lý nhà xe', role: 'manager' });
      navigate('/dashboard');
    } else if (username === 'staff' && password === 'staff123') {
      // Đã gắn id: 1 tương ứng với nv001 trong Database để gọi API
      setUser({ id: 1, username: 'nv001', fullName: 'Nhân viên bãi xe', role: 'staff' });
      navigate('/dashboard');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f1f5f9',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '3rem', border: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '15px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>B</div>
          <h2 style={{ fontSize: '1.75rem' }}>Chào mừng trở lại</h2>
          <p className="text-muted">Vui lòng đăng nhập để tiếp tục</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Tên đăng nhập</label>
            <input 
              type="text" 
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tài khoản..."
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Mật khẩu</label>
            <input 
              type="password" 
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: 'var(--error)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }}>
            Đăng nhập ngay
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Tài khoản demo:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <span>Admin: admin / admin123</span>
            <span>Manager: manager / manager123</span>
            <span>Staff: staff / staff123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;