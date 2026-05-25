import React from 'react';

const ManagerDashboard = () => {
  return (
    <div className="dashboard-page">
      <h1>Quản Lý Khu Vực Gửi Xe</h1>
      <p className="text-muted">Theo dõi lưu lượng và điều phối vị trí đỗ xe.</p>
      
      <div className="stats-grid">
        <div className="card">
          <p className="text-muted">Số xe đang gửi</p>
          <h2 style={{ fontSize: '2.5rem' }}>412 / 500</h2>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '1rem' }}>
            <div style={{ width: '82%', height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
          </div>
        </div>
        <div className="card">
          <p className="text-muted">Số xe Giảng viên</p>
          <h2 style={{ fontSize: '2.5rem' }}>45</h2>
        </div>
        <div className="card">
          <p className="text-muted">Số xe Sinh viên</p>
          <h2 style={{ fontSize: '2.5rem' }}>367</h2>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '2.5rem' }}>
        <h3>Hoạt Động Gần Đây</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span>59-G1 123.45 (Sinh viên) - Vào bãi</span>
            <span className="text-muted">14:20</span>
          </li>
          <li style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span>59-A1 555.66 (Giảng viên) - Ra bãi</span>
            <span className="text-muted">14:15</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ManagerDashboard;
