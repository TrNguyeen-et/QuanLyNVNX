import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at top left, #f0f4ff 0%, #ffffff 100%)',
      color: 'var(--text-main)',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(79, 70, 229, 0.05)',
        padding: '0.5rem 1rem',
        borderRadius: '100px',
        color: 'var(--primary)',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        marginBottom: '1.5rem'
      }}>
        🏍️ Hệ thống quản lý bãi xe thông minh
      </div>
      
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
        Quản Lý Bãi Xe <span style={{ color: 'var(--primary)' }}>Sinh Viên & Giảng Viên</span>
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', marginBottom: '3rem', lineHeight: '1.6' }}>
        Giải pháp hiện đại giúp tối ưu hóa quy trình gửi xe, đảm bảo an ninh và 
        tiết kiệm thời gian cho toàn bộ thành viên trong trường.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/login')} 
          className="btn btn-primary" 
          style={{ padding: '1.25rem 3rem', fontSize: '1.1rem', boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)' }}
        >
          Đăng Nhập Quản Lý
        </button>
        <button 
          className="btn" 
          style={{ padding: '1.25rem 3rem', fontSize: '1.1rem', background: 'white', border: '1px solid var(--border)', color: 'var(--text-main)' }}
        >
          Kiểm Tra Chỗ Trống
        </button>
      </div>

      <div className="stats-grid" style={{ marginTop: '5rem', maxWidth: '800px', width: '100%' }}>
        <div className="card">
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>1.2k</h2>
          <p className="text-muted">Lượt xe mỗi ngày</p>
        </div>
        <div className="card">
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>500+</h2>
          <p className="text-muted">Chỗ để xe máy</p>
        </div>
        <div className="card">
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>99.9%</h2>
          <p className="text-muted">Đảm bảo an ninh</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
