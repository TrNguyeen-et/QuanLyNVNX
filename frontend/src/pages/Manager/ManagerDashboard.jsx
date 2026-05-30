import React, { useState, useEffect } from 'react';

const GROUPS = ['Nhóm Cổng Chính', 'Nhóm Hầm Xe', 'Nhóm Lưu Động'];

const ManagerDashboard = ({ user, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [vehicleStats, setVehicleStats] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [hrReport, setHrReport] = useState([]);
  const [salaryReport, setSalaryReport] = useState([]);
  
  // States for Assign Shift
  const [staffList, setStaffList] = useState([]);
  const [assignForm, setAssignForm] = useState({ userId: '', shiftId: '1', workDate: '', position: '' });
  const [selectedGroup, setSelectedGroup] = useState('');
  const [msg, setMsg] = useState('');
  
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchVehicleStats();
    fetchIncidents();
    fetchHrReport();
    fetchSalaryReport();
    fetchStaffList();
  }, []);

  const fetchVehicleStats = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/vehicles/stats');
      const data = await res.json();
      setVehicleStats(data);
    } catch (e) {}
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/manager/incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (e) {}
  };

  const fetchHrReport = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/manager/hr-report');
      const data = await res.json();
      setHrReport(data);
    } catch (e) {}
  };

  const fetchSalaryReport = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/manager/calculate-salaries');
      const data = await res.json();
      setSalaryReport(data);
    } catch (e) {}
  };

  const fetchStaffList = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/manager/staff-list');
      const data = await res.json();
      setStaffList(data.filter(s => s.role === 'STAFF'));
    } catch (e) {}
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/manager/assign-shift', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      if(res.ok) { setMsg('Phân ca thành công!'); setAssignForm({...assignForm, position: '', workDate: ''}); }
      else setMsg(data.message || 'Lỗi');
    } catch(e) { setMsg('Lỗi kết nối'); }
  };

  const reviewIncident = async (id, status, note) => {
    try {
      await fetch(`http://localhost:8080/api/manager/incidents/${id}/review`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, managerNote: note })
      });
      fetchIncidents();
    } catch(e) {}
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMsg('❌ Mật khẩu xác nhận không khớp!');
    }
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/auth/change-password/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg('✅ ' + data.message);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg('❌ ' + data.message);
      }
    } catch (err) { setPasswordMsg('❌ Lỗi kết nối!'); }
    finally { setIsLoading(false); }
  };

  const exportToCSV = (data, filename) => {
    if(!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csvContent = 
      keys.join(',') + '\n' +
      data.map(row => keys.map(k => `"${row[k]}"`).join(',')).join('\n');
      
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabStyle = (tabName) => ({
    padding: '0.75rem 1.5rem', borderRadius: '100px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
    backgroundColor: activeTab === tabName ? 'var(--primary)' : '#f1f5f9',
    color: activeTab === tabName ? 'white' : '#64748b'
  });

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

        <button onClick={handleLogout} className="btn" style={{ marginTop: 'auto', textAlign: 'left', background: 'transparent', color: '#fca5a5', border: 'none', paddingLeft: '1rem' }}>🚪 Đăng xuất</button>
      </aside>

      <main className="main-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <h2>Bảng điều khiển Quản Lý</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button style={tabStyle('vehicles')} onClick={() => setActiveTab('vehicles')}>🚗 Giám sát xe</button>
        <button style={tabStyle('assign')} onClick={() => setActiveTab('assign')}>📅 Phân ca & Vị trí</button>
        <button style={tabStyle('incidents')} onClick={() => setActiveTab('incidents')}>🚨 Duyệt sự cố</button>
        <button style={tabStyle('hr')} onClick={() => setActiveTab('hr')}>👥 Nhân sự & Lương</button>
        <button style={tabStyle('password')} onClick={() => setActiveTab('password')}>🔐 Đổi mật khẩu</button>
      </div>

      {activeTab === 'vehicles' && (
        <div className="card">
          <h3>Giám sát lượng xe trong các khu vực (Cập nhật tự động qua quẹt thẻ)</h3>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
            {vehicleStats.length === 0 ? <p>Chưa có dữ liệu xe.</p> : vehicleStats.map(s => (
              <div key={s.zone} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', minWidth: '150px' }}>
                <p style={{ color: '#64748b' }}>{s.zone}</p>
                <h2 style={{ color: 'var(--primary)', margin: 0 }}>{s.count} xe</h2>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="card">
          <h3>Phân ca và Vị trí làm việc</h3>
          <form onSubmit={handleAssignShift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setAssignForm({...assignForm, userId: ''}); }} className="form-input">
              <option value="">-- Tất cả các nhóm --</option>
              {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            
            <select value={assignForm.userId} onChange={e => setAssignForm({...assignForm, userId: e.target.value})} className="form-input" required>
              <option value="">-- Chọn nhân viên --</option>
              {(selectedGroup ? staffList.filter(s => s.groupName === selectedGroup) : staffList).map(s => (
                <option key={s.id} value={s.id}>{s.fullName || s.username} - {s.groupName || 'Chưa xếp nhóm'}</option>
              ))}
            </select>
            <select value={assignForm.shiftId} onChange={e => setAssignForm({...assignForm, shiftId: e.target.value})} className="form-input" required>
              <option value="1">Ca Sáng (06:00 - 14:00)</option>
              <option value="2">Ca Chiều (14:00 - 22:00)</option>
              <option value="3">Ca Đêm (22:00 - 06:00)</option>
            </select>
            <input type="date" value={assignForm.workDate} onChange={e => setAssignForm({...assignForm, workDate: e.target.value})} className="form-input" required />
            <input type="text" placeholder="Vị trí (VD: Cổng chính, Khu A...)" value={assignForm.position} onChange={e => setAssignForm({...assignForm, position: e.target.value})} className="form-input" required />
            <button type="submit" className="btn btn-primary">Lưu phân ca</button>
          </form>
          {msg && <p style={{ marginTop: '1rem', color: 'green' }}>{msg}</p>}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="card">
          <h3>Báo cáo sự cố từ nhân viên</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th>Ngày giờ</th><th>Nội dung</th><th>Trạng thái</th><th>Ghi chú QL</th><th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td>{new Date(inc.reportTime).toLocaleString()}</td>
                  <td>{inc.content}</td>
                  <td><b>{inc.status}</b></td>
                  <td>{inc.managerNote}</td>
                  <td>
                    {inc.status === 'PENDING' && (
                      <button onClick={() => {
                        const note = prompt("Ghi chú của quản lý:");
                        if(note !== null) reviewIncident(inc.id, 'REVIEWED', note);
                      }} className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'var(--primary)', color: 'white' }}>Duyệt</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'hr' && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Báo Cáo Lương Theo Tháng</h3>
              <button onClick={() => exportToCSV(salaryReport, "Bao_Cao_Luong")} className="btn" style={{ background: '#10b981', color: 'white' }}>📥 Xuất CSV Lương</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}><th>Nhân viên</th><th>Số ca HT</th><th>Lương cơ bản</th><th>Phạt</th><th>Thực nhận</th></tr></thead>
              <tbody>
                {salaryReport.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td>{s.name}</td><td>{s.completedShifts}</td>
                    <td>{s.totalShiftPay?.toLocaleString()}</td><td style={{color: 'red'}}>-{s.totalPenalty?.toLocaleString()}</td>
                    <td style={{fontWeight: 'bold', color: 'var(--primary)'}}>{s.finalSalary?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Báo Cáo Tổng Quan Nhân Sự (Đi trễ, Nghỉ phép)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}><th>ID</th><th>Nhân viên</th><th>Số lần đi trễ</th><th>Số ngày nghỉ phép</th></tr></thead>
              <tbody>
                {hrReport.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td>{h.userId}</td><td>{h.name}</td>
                    <td style={{color: h.lateCount > 0 ? 'red' : 'green'}}>{h.lateCount} lần</td>
                    <td>{h.leaveDays} ngày</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🔐 ĐỔI MẬT KHẨU</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
            <input type="password" placeholder="Mật khẩu cũ" required className="form-input" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} />
            <input type="password" placeholder="Mật khẩu mới" required className="form-input" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
            <input type="password" placeholder="Xác nhận mật khẩu mới" required className="form-input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
            <button type="submit" disabled={isLoading} className="btn" style={{ padding: '1rem', borderRadius: '100px', background: '#3b82f6', color: 'white', fontWeight: 'bold' }}>Cập Nhật Mật Khẩu</button>
          </form>
          {passwordMsg && <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', backgroundColor: passwordMsg.includes('❌') ? '#fef2f2' : '#f0fdf4', color: passwordMsg.includes('❌') ? '#991b1b' : '#166534', fontWeight: '500', maxWidth: '500px' }}>{passwordMsg}</div>}
        </div>
      )}
    </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
