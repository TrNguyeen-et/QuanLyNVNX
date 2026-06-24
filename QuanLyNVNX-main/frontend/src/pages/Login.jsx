import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Đăng nhập thành công, lưu thông tin thật từ DB
        setUser(data); 
        navigate('/dashboard');
      } else {
        setError(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ. Hãy đảm bảo Backend đang chạy.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '1.5rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '3rem', border: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '15px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>B</div>
          <h2 style={{ fontSize: '1.75rem' }}>Chào mừng trở lại</h2>
          <p className="text-muted">Đăng nhập bằng tài khoản trong Database</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Tên đăng nhập</label>
            <input type="text" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nhập tài khoản..." required disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Mật khẩu</label>
            <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />
          </div>

          {error && (<div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>)}
          
          <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }} disabled={isLoading}>
            {isLoading ? '⏳ ĐANG ĐĂNG NHẬP...' : 'Đăng nhập ngay'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Tài khoản mẫu trong DB (nv001 / 123):</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <span>Nhân viên: nv001 / 123</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;