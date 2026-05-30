import React, { useState, useEffect } from 'react';

const GROUPS = ['Nhóm Cổng Chính', 'Nhóm Hầm Xe', 'Nhóm Lưu Động'];

const AdminDashboard = ({ user, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [isEditingUser, setIsEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [logFilter, setLogFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ username: '', fullName: '', role: 'staff', password: '123', groupName: GROUPS[0] });

  useEffect(() => {
    fetchSystemStatus();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/admin/system-status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (error) { console.error("Lỗi lấy thông tin hệ thống:", error); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) { console.error("Lỗi lấy danh sách user:", error); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/admin/logs');
      const data = await res.json();
      setLogs(data);
    } catch (error) { console.error("Lỗi lấy danh sách logs:", error); }
  };

  const handleBackup = () => {
    window.location.href = 'http://localhost:8080/api/admin/backup';
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa tài khoản này?')) return;
    try {
      await fetch(`http://localhost:8080/api/admin/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) { alert("Lỗi khi vô hiệu hóa."); }
  };

  const handleSaveUser = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      setIsEditingUser(null);
      fetchUsers();
    } catch (error) { alert("Lỗi khi cập nhật."); }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.username || !newUserForm.fullName) {
      alert("Vui lòng nhập đủ thông tin."); return;
    }
    try {
      await fetch(`http://localhost:8080/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });
      setShowAddForm(false);
      setNewUserForm({ username: '', fullName: '', role: 'staff', password: '123', groupName: GROUPS[0] });
      fetchUsers();
    } catch (error) { alert("Lỗi khi thêm mới."); }
  };

  const filteredLogs = logFilter === 'ALL' ? logs : logs.filter(l => l.type === logFilter);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
          <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Admin Panel</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</p>
            <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{user.username}</p>
          </div>
          
          <button onClick={() => setActiveTab('overview')} className="btn" style={{ textAlign: 'left', background: activeTab === 'overview' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'overview' ? 'white' : 'rgba(255,255,255,0.6)', border: 'none' }}>📊 Hệ Thống</button>
          <button onClick={() => setActiveTab('users')} className="btn" style={{ textAlign: 'left', background: activeTab === 'users' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'users' ? 'white' : 'rgba(255,255,255,0.6)', border: 'none' }}>👥 Tài Khoản</button>
          <button onClick={() => setActiveTab('logs')} className="btn" style={{ textAlign: 'left', background: activeTab === 'logs' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'logs' ? 'white' : 'rgba(255,255,255,0.6)', border: 'none' }}>📋 Nhật Ký (Logs)</button>
        </div>

        <button onClick={handleLogout} className="btn" style={{ marginTop: 'auto', textAlign: 'left', background: 'transparent', color: '#fca5a5', border: 'none', paddingLeft: '1rem' }}>🚪 Đăng xuất</button>
      </aside>

      <main className="main-content">
        <div className="dashboard-page">
          
          {activeTab === 'overview' && (
            <>
              <h1>Giám Sát Hệ Thống</h1>
              <p className="text-muted">Trạng thái máy chủ và sao lưu dữ liệu.</p>
              
              <div className="stats-grid" style={{ marginTop: '2rem' }}>
                <div className="card">
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>CPU Cores</p>
                  <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{systemStatus.cpuCores || '-'}</h2>
                </div>
                <div className="card">
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>RAM Đang Dùng / Tổng</p>
                  <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{systemStatus.usedMemoryMB || 0} / {systemStatus.totalMemoryMB || 0} MB</h2>
                </div>
                <div className="card">
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>Uptime (Giây)</p>
                  <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{systemStatus.uptime ? Math.floor(systemStatus.uptime/1000) : '-'}</h2>
                </div>
              </div>

              <div className="card" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Sao Lưu (Backup) Cơ Sở Dữ Liệu</h3>
                  <p className="text-muted">Tải xuống toàn bộ CSDL hiện tại dưới dạng file .sql. Cần cài đặt lệnh mysqldump trên máy chủ.</p>
                </div>
                <button onClick={handleBackup} className="btn" style={{ background: 'var(--primary)', color: 'white' }}>⬇️ TẢI XUỐNG BẢN SAO LƯU</button>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1>Quản Lý Tài Khoản</h1>
                  <p className="text-muted">Thêm, sửa, vô hiệu hóa và cấp quyền (Role) cho tài khoản.</p>
                </div>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn" style={{ background: 'var(--primary)', color: 'white' }}>
                  {showAddForm ? 'ĐÓNG FORM' : '+ THÊM TÀI KHOẢN'}
                </button>
              </div>

              {showAddForm && (
                <div className="card" style={{ marginTop: '1rem', background: '#f8fafc' }}>
                  <h3>Thêm Tài Khoản Mới (Mật khẩu mặc định: 123)</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <input placeholder="Username (Tên đăng nhập)" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} style={{ padding: '0.5rem', flex: 1 }}/>
                    <input placeholder="Họ và Tên" value={newUserForm.fullName} onChange={e => setNewUserForm({...newUserForm, fullName: e.target.value})} style={{ padding: '0.5rem', flex: 1 }}/>
                    <select value={newUserForm.groupName} onChange={e => setNewUserForm({...newUserForm, groupName: e.target.value})} style={{ padding: '0.5rem' }}>
                      {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} style={{ padding: '0.5rem' }}>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                    <button onClick={handleCreateUser} className="btn" style={{ background: '#22c55e', color: 'white' }}>LƯU TÀI KHOẢN</button>
                  </div>
                </div>
              )}

              <div className="card" style={{ marginTop: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem' }}>ID</th>
                      <th style={{ padding: '1rem' }}>Username</th>
                      <th style={{ padding: '1rem' }}>Họ Tên</th>
                      <th style={{ padding: '1rem' }}>Nhóm</th>
                      <th style={{ padding: '1rem' }}>Quyền (Role)</th>
                      <th style={{ padding: '1rem' }}>Trạng thái</th>
                      <th style={{ padding: '1rem' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>{u.id}</td>
                        <td style={{ padding: '1rem' }}>{u.username}</td>
                        <td style={{ padding: '1rem' }}>
                          {isEditingUser === u.id ? 
                            <input value={editFormData.fullName || ''} onChange={e => setEditFormData({...editFormData, fullName: e.target.value})} style={{ padding: '0.5rem', width: '150px' }}/> 
                            : u.fullName}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isEditingUser === u.id ? 
                            <select value={editFormData.groupName || GROUPS[0]} onChange={e => setEditFormData({...editFormData, groupName: e.target.value})} style={{ padding: '0.5rem', width: '150px' }}>
                              {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select> 
                            : u.groupName || '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isEditingUser === u.id ? 
                            <select value={editFormData.role || 'staff'} onChange={e => setEditFormData({...editFormData, role: e.target.value})} style={{ padding: '0.5rem' }}>
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="staff">Staff</option>
                            </select> 
                            : <span style={{ fontWeight: 'bold', color: u.role === 'admin' ? '#ef4444' : (u.role === 'manager' ? '#f59e0b' : '#3b82f6') }}>{u.role.toUpperCase()}</span>}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', background: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: u.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isEditingUser === u.id ? (
                            <>
                              <button onClick={() => handleSaveUser(u.id)} className="btn" style={{ background: '#22c55e', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>LƯU</button>
                              <button onClick={() => setIsEditingUser(null)} className="btn" style={{ background: '#94a3b8', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>HỦY</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setIsEditingUser(u.id); setEditFormData(u); }} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>SỬA</button>
                              <button onClick={() => handleDeleteUser(u.id)} className="btn" style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }} disabled={u.status !== 'ACTIVE'}>XÓA</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'logs' && (
            <>
              <h1>Nhật Ký Hoạt Động (Logs)</h1>
              <p className="text-muted">Theo dõi thao tác người dùng và lỗi hệ thống.</p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setLogFilter('ALL')} className="btn" style={{ background: logFilter === 'ALL' ? 'var(--primary)' : '#e2e8f0', color: logFilter === 'ALL' ? 'white' : '#64748b' }}>TẤT CẢ</button>
                <button onClick={() => setLogFilter('SYSTEM')} className="btn" style={{ background: logFilter === 'SYSTEM' ? '#ef4444' : '#e2e8f0', color: logFilter === 'SYSTEM' ? 'white' : '#64748b' }}>LOG HỆ THỐNG</button>
                <button onClick={() => setLogFilter('BUSINESS')} className="btn" style={{ background: logFilter === 'BUSINESS' ? '#3b82f6' : '#e2e8f0', color: logFilter === 'BUSINESS' ? 'white' : '#64748b' }}>LOG NGHIỆP VỤ</button>
              </div>

              <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem' }}>Thời gian</th>
                      <th style={{ padding: '1rem' }}>Loại</th>
                      <th style={{ padding: '1rem' }}>Hành động</th>
                      <th style={{ padding: '1rem' }}>Chi tiết</th>
                      <th style={{ padding: '1rem' }}>User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: log.type === 'SYSTEM' ? '#fee2e2' : '#e0f2fe', color: log.type === 'SYSTEM' ? '#991b1b' : '#0369a1' }}>
                            {log.type}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>{log.action}</td>
                        <td style={{ padding: '1rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.description}>{log.description}</td>
                        <td style={{ padding: '1rem' }}>{log.userId === 0 ? 'Hệ thống' : log.userId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLogs.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Không có log nào để hiển thị.</p>}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
