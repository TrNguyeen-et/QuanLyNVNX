import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ activeTab }) => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', role: 'STAFF', status: 'ACTIVE' });

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if(activeTab === 'logs') fetchLogs(); }, [activeTab]);

  const fetchUsers = async () => { try { const r = await fetch('http://localhost:8080/api/admin/users'); if(r.ok) setUsers(await r.json()); } catch(e){} };
  const fetchLogs = async () => { try { const r = await fetch('http://localhost:8080/api/admin/logs'); if(r.ok) setLogs(await r.json()); } catch(e){} };

  const resetForm = () => { setFormData({ username: '', password: '', fullName: '', role: 'STAFF', status: 'ACTIVE' }); setEditingUser(null); setShowForm(false); };
  
  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingUser ? `http://localhost:8080/api/admin/users/${editingUser.id}` : 'http://localhost:8080/api/admin/create-account';
    const method = editingUser ? 'PUT' : 'POST';
    const body = { ...formData }; if (editingUser && !body.password) delete body.password;
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if(r.ok) { setAlertMsg(editingUser ? '✅ Cập nhật thành công!' : '✅ Thêm thành công!'); fetchUsers(); resetForm(); }
      else { const err = await r.json(); setAlertMsg(`❌ ${err.message || 'Lỗi'}`); }
    } catch(e) { setAlertMsg('❌ Lỗi kết nối'); }
    setTimeout(() => setAlertMsg(''), 3000);
  };

  const handleEdit = (u) => { setFormData({ username: u.username, password: '', fullName: u.fullName, role: u.role, status: u.status }); setEditingUser(u); setShowForm(true); };
  const handleDelete = async (id) => { if(!window.confirm('Xóa tài khoản này?')) return; try { const r = await fetch(`http://localhost:8080/api/admin/users/${id}`, {method:'DELETE'}); if(r.ok){ setAlertMsg('✅ Đã xóa!'); fetchUsers(); setTimeout(()=>setAlertMsg(''), 3000); } } catch(e){} };

  const styleTh = { padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 'bold' };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Hệ Thống Quản Trị</h1>
      {alertMsg && <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '12px', backgroundColor: alertMsg.includes('thành công') ? '#dcfce7' : '#fee2e2', color: alertMsg.includes('thành công') ? '#166534' : '#991b1b', fontWeight: 'bold' }}>{alertMsg}</div>}

      {activeTab === 'overview' && (
        <div className="card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><h3 style={{color:'#64748b', margin:'0 0 0.5rem'}}>Tổng tài khoản</h3><h2 style={{color:'var(--primary)', margin:0}}>{users.length}</h2></div>
          <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><h3 style={{color:'#166534', margin:'0 0 0.5rem'}}>Đang hoạt động</h3><h2 style={{color:'#16a34a', margin:0}}>{users.filter(u => u.status === 'ACTIVE').length}</h2></div>
          <div style={{ background: '#fef2f2', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><h3 style={{color:'#991b1b', margin:'0 0 0.5rem'}}>Đã khóa/Nghỉ</h3><h2 style={{color:'#dc2626', margin:0}}>{users.filter(u => u.status === 'RESIGNED').length}</h2></div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Quản lý Tài khoản & Phân quyền</h2>
            <button onClick={resetForm} className="btn" style={{ padding: '0.75rem 1.5rem', borderRadius: '100px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold' }}>+ Thêm tài khoản</button>
          </div>
          {showForm && (<div style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '16px', backgroundColor: '#f8fafc' }}><h4 style={{ marginTop: 0 }}>{editingUser ? '✏️ Chỉnh sửa' : '➕ Thêm mới'}</h4><form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.3rem' }}>Username</label><input className="form-input" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required /></div><div><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.3rem' }}>Mật khẩu {editingUser && '(Để trống nếu không đổi)'}</label><input type="password" className="form-input" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingUser} /></div><div><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.3rem' }}>Họ và tên</label><input className="form-input" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required /></div><div style={{ display: 'flex', gap: '1rem' }}><div style={{ flex: 1 }}><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.3rem' }}>Vai trò</label><select className="form-input" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="ADMIN">Admin</option><option value="MANAGER">Quản lý</option><option value="STAFF">Nhân viên</option></select></div><div style={{ flex: 1 }}><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.3rem' }}>Trạng thái</label><select className="form-input" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="ACTIVE">Hoạt động</option><option value="RESIGNED">Khóa/Nghỉ</option></select></div></div><div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}><button type="button" onClick={resetForm} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}>Hủy</button><button type="submit" className="btn" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold' }}>Lưu lại</button></div></form></div>)}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={styleTh}>ID</th><th style={styleTh}>Username</th><th style={styleTh}>Họ Tên</th><th style={styleTh}>Vai trò</th><th style={styleTh}>Trạng thái</th><th style={{...styleTh, textAlign:'center'}}>Hành động</th></tr></thead><tbody>{users.map(u => (<tr key={u.id}><td style={styleTh}>{u.id}</td><td style={{...styleTh, fontWeight:'bold'}}>{u.username}</td><td style={styleTh}>{u.fullName}</td><td style={styleTh}><span style={{ background: u.role === 'ADMIN' ? '#ede9fe' : u.role === 'MANAGER' ? '#dbeafe' : '#dcfce7', color: u.role === 'ADMIN' ? '#5b21b6' : u.role === 'MANAGER' ? '#1e40af' : '#166534', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 'bold' }}>{u.role}</span></td><td style={styleTh}><span style={{ color: u.status === 'ACTIVE' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{u.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa'}</span></td><td style={{...styleTh, textAlign:'center'}}><button onClick={() => handleEdit(u)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.85rem' }}>Sửa</button><button onClick={() => handleDelete(u.id)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>Xóa</button></td></tr>))}</tbody></table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>📜 Lịch sử Nhật ký hệ thống</h2>
          {logs.length === 0 ? <p style={{ color: '#94a3b8' }}>Chưa có hoạt động nào.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={styleTh}>Thời gian</th><th style={styleTh}>Người thực hiện</th><th style={styleTh}>Hành động</th></tr></thead><tbody>{logs.map(l => (<tr key={l.id}><td style={styleTh}>{new Date(l.timestamp).toLocaleString('vi-VN')}</td><td style={styleTh}>{l.actor}</td><td style={styleTh}>{l.action}</td></tr>))}</tbody></table>
          )}
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;