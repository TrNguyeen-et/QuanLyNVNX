import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="dashboard-page">
      <h1>Hệ Thống Quản Trị Bãi Xe</h1>
      <p className="text-muted">Quản lý tài khoản và giám sát toàn bộ bãi xe trường.</p>
      
      <div className="stats-grid">
        <div className="card">
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Tổng lượt xe tháng này</p>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>15,240</h2>
          <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 'bold' }}>↑ 12% so với tháng trước</span>
        </div>
        <div className="card">
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Doanh thu dự kiến (VND)</p>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>30.4M</h2>
          <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 'bold' }}>Thanh toán ổn định</span>
        </div>
        <div className="card">
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Nhân viên đang trực</p>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>08</h2>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Trên 3 cổng vào</span>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '2.5rem' }}>
        <h3>Danh Sách Quản Lý Khu Vực</h3>
        <table>
          <thead>
            <tr>
              <th>Tên Quản Lý</th>
              <th>Khu Vực Trách Nhiệm</th>
              <th>Sức Chứa</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nguyễn Văn A</td>
              <td>Khu A - Tòa Nhà Trung Tâm</td>
              <td>500 xe</td>
              <td><span style={{ color: 'var(--success)' }}>Đang mở</span></td>
            </tr>
            <tr>
              <td>Trần Thị B</td>
              <td>Khu B - Sau Thư Viện</td>
              <td>300 xe</td>
              <td><span style={{ color: 'var(--success)' }}>Đang mở</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
