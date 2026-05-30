import React, { useState, useEffect } from 'react';

const StaffDashboard = ({ user, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('checkin');
  
  // Dữ liệu Check-in
  const [todayAssignment, setTodayAssignment] = useState(null);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [penaltyInfo, setPenaltyInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dữ liệu Lịch & Lương
  const [schedule, setSchedule] = useState([]);
  const [salary, setSalary] = useState(null);

  // Dữ liệu Sự cố
  const [incidentContent, setIncidentContent] = useState('');
  const [incidentMsg, setIncidentMsg] = useState('');

  // Các chức năng mới
  const [staffList, setStaffList] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ requestType: 'LEAVE', targetDate: '', reason: '', substituteUserId: '' });
  const [leaveMsg, setLeaveMsg] = useState('');
  const [handoverForm, setHandoverForm] = useState({ toUserId: '', notes: '' });
  const [handoverMsg, setHandoverMsg] = useState('');

  // Đổi mật khẩu
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (user && user.id) {
      fetchScheduleAndTodayAssignment();
      fetchSalary();
      fetchStaffList();
    }
  }, [user]);

  const fetchStaffList = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/manager/staff-list');
      const data = await res.json();
      setStaffList(data.filter(s => s.role === 'STAFF' && s.id !== user.id));
    } catch(e) {}
  };

  const fetchScheduleAndTodayAssignment = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/staff/${user.id}/schedule`);
      if (!res.ok) throw new Error('Lỗi lấy lịch');
      const data = await res.json();
      setSchedule(data);
      const todayStr = new Date().toISOString().split('T')[0];
      const today = data.find(item => item.workDate && item.workDate.startsWith(todayStr));
      setTodayAssignment(today || null);
    } catch (error) { console.error(error); }
  };

  const fetchSalary = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/staff/${user.id}/my-salary`);
      if (!res.ok) throw new Error('Chưa có lương');
      const data = await res.json();
      setSalary(data);
    } catch (error) { setSalary(null); }
  };

  const handleCheckIn = async () => {
    if (!todayAssignment) return setMessage('❌ Hôm nay bạn chưa được phân ca trực.');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/staff/check-in', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: todayAssignment.id })
      });
      const data = await response.json();
      if (response.ok) {
        setStatus('checked-in'); setMessage(`✅ ${data.message}`);
        setPenaltyInfo(data.penaltyFee > 0 ? `⚠️ Bạn đi trễ ${data.minutesLate} phút. Phạt: ${data.penaltyFee.toLocaleString('vi-VN')} VNĐ` : '✨ Tuyệt vời! Bạn đã đi làm đúng giờ.');
      } else { setMessage(`❌ Thất bại: ${data.message || 'Không thể check-in'}`); }
    } catch (error) { setMessage('❌ Lỗi kết nối đến máy chủ!'); }
    finally { setIsLoading(false); }
  };

  const handleCheckOut = async () => {
    if (!todayAssignment) return setMessage('❌ Hôm nay bạn chưa được phân ca trực.');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/staff/check-out', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: todayAssignment.id })
      });
      const data = await response.json();
      if (response.ok) { setStatus('checked-out'); setMessage(`👋 ${data.message}`); setPenaltyInfo(null); }
      else { setMessage(`❌ Thất bại: ${data.message || 'Không thể check-out'}`); }
    } catch (error) { setMessage('❌ Lỗi kết nối đến máy chủ!'); }
    finally { setIsLoading(false); }
  };

  const handleReportIncident = async () => {
    if (!incidentContent.trim()) return setIncidentMsg('❌ Vui lòng nhập nội dung sự cố.');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/staff/report-incident', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content: incidentContent })
      });
      const data = await response.json();
      if (response.ok) { setIncidentMsg('✅ Đã gửi biên bản ghi nhận sự cố thành công!'); setIncidentContent(''); }
      else { setIncidentMsg(`❌ Thất bại: ${data.message}`); }
    } catch (error) { setIncidentMsg('❌ Lỗi kết nối đến máy chủ!'); }
    finally { setIsLoading(false); }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { userId: user.id, ...leaveForm };
      const res = await fetch('http://localhost:8080/api/staff/leave-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        setLeaveMsg('✅ Đã gửi yêu cầu thành công!');
        setLeaveForm({ requestType: 'LEAVE', targetDate: '', reason: '', substituteUserId: '' });
      } else { setLeaveMsg('❌ Có lỗi xảy ra'); }
    } catch(err) { setLeaveMsg('❌ Lỗi kết nối'); }
  };

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    if (!todayAssignment) return setHandoverMsg('❌ Bạn không có ca trực hôm nay để bàn giao.');
    try {
      const payload = { assignmentId: todayAssignment.id, toUserId: handoverForm.toUserId, notes: handoverForm.notes };
      const res = await fetch('http://localhost:8080/api/staff/handover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        setHandoverMsg('✅ Đã bàn giao ca trực thành công!');
        setHandoverForm({ toUserId: '', notes: '' });
      } else { setHandoverMsg('❌ Có lỗi xảy ra'); }
    } catch(err) { setHandoverMsg('❌ Lỗi kết nối'); }
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

  const sidebarTabStyle = (tabName) => ({
    textAlign: 'left', 
    background: activeTab === tabName ? 'rgba(255,255,255,0.1)' : 'transparent', 
    color: activeTab === tabName ? 'white' : 'rgba(255,255,255,0.6)', 
    border: 'none',
    display: 'block',
    width: '100%',
    marginBottom: '0.25rem'
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
          <button className="btn" style={sidebarTabStyle('checkin')} onClick={() => setActiveTab('checkin')}>⚡ Chấm công</button>
          <button className="btn" style={sidebarTabStyle('schedule')} onClick={() => setActiveTab('schedule')}>📅 Xem lịch</button>
          <button className="btn" style={sidebarTabStyle('salary')} onClick={() => setActiveTab('salary')}>💰 Xem lương</button>
          <button className="btn" style={sidebarTabStyle('incident')} onClick={() => setActiveTab('incident')}>🚨 Sự cố</button>
          <button className="btn" style={sidebarTabStyle('leave')} onClick={() => setActiveTab('leave')}>📝 Nghỉ/Đổi ca</button>
          <button className="btn" style={sidebarTabStyle('handover')} onClick={() => setActiveTab('handover')}>🤝 Bàn giao</button>
          <button className="btn" style={sidebarTabStyle('password')} onClick={() => setActiveTab('password')}>🔐 Đổi mật khẩu</button>
        </div>

        <button onClick={handleLogout} className="btn" style={{ marginTop: 'auto', textAlign: 'left', background: 'transparent', color: '#fca5a5', border: 'none', paddingLeft: '1rem' }}>🚪 Đăng xuất</button>
      </aside>

      <main className="main-content">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>👋 Chào ngày mới, {user.fullName || user.username}!</h2>



      {activeTab === 'checkin' && (
        <>
          <div className="card" style={{ marginBottom: '2rem', borderRadius: '24px', padding: '2rem', background: 'linear-gradient(145deg, #ffffff, #f0f4f8)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Ca trực hôm nay</h3>
            {todayAssignment ? (
              <>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', margin: '0.5rem 0' }}>{todayAssignment.shift?.shiftName} ({todayAssignment.shift?.startTime} - {todayAssignment.shift?.endTime})</p>
                <p style={{ color: 'var(--text-main)' }}>Vị trí: <b>{todayAssignment.position || 'Chưa phân định'}</b></p>
                <p style={{ color: 'var(--text-main)' }}>Trạng thái: {todayAssignment.status}</p>
              </>
            ) : (<p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Bạn không có ca trực nào hôm nay.</p>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={handleCheckIn} disabled={!todayAssignment || status === 'checked-in' || status === 'checked-out' || isLoading} className="btn" style={{ padding: '1.5rem', fontSize: '1.2rem', borderRadius: '100px', backgroundColor: (status === 'checked-in' || status === 'checked-out' || !todayAssignment) ? '#e2e8f0' : 'var(--primary)', color: (status === 'checked-in' || status === 'checked-out' || !todayAssignment) ? '#94a3b8' : 'white', boxShadow: (!todayAssignment || status !== '') ? 'none' : '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}>
              {isLoading && status === '' ? '⏳ ĐANG XỬ LÝ...' : '📍 CHECK-IN NHẬN CA'}
            </button>
            <button onClick={handleCheckOut} disabled={status !== 'checked-in' || isLoading} className="btn" style={{ padding: '1.5rem', fontSize: '1.2rem', borderRadius: '100px', backgroundColor: status === 'checked-in' ? '#ef4444' : '#fee2e2', color: status === 'checked-in' ? 'white' : '#fca5a5' }}>
              {isLoading && status === 'checked-in' ? '⏳ ĐANG XỬ LÝ...' : '🏁 CHECK-OUT KẾT THÚC'}
            </button>
          </div>
          {message && (
            <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '16px', backgroundColor: status === 'checked-in' ? '#f0fdf4' : '#f8fafc', color: status === 'checked-in' ? '#166534' : '#334155', textAlign: 'center', fontWeight: '500' }}>
              <div>{message}</div>
              {penaltyInfo && <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '12px', backgroundColor: penaltyInfo.includes('Phạt') ? '#fef2f2' : '#ecfdf5', color: penaltyInfo.includes('Phạt') ? '#991b1b' : '#065f46', fontSize: '0.95rem' }}>{penaltyInfo}</div>}
            </div>
          )}
        </>
      )}

      {activeTab === 'schedule' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>📅 Lịch làm việc của tôi</h3>
          {schedule.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}><th style={{ padding: '0.75rem', color: '#64748b' }}>Ngày làm</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Tên ca</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Vị trí</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Trạng thái</th></tr></thead>
              <tbody>{schedule.map((item, index) => (<tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '1rem 0.75rem' }}>{item.workDate}</td><td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>{item.shift?.shiftName} <br/><small>{item.shift?.startTime} - {item.shift?.endTime}</small></td><td style={{ padding: '1rem 0.75rem' }}>{item.position || '-'}</td><td style={{ padding: '1rem 0.75rem' }}><span style={{ background: item.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: item.status === 'COMPLETED' ? '#166534' : '#854d0e', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.85rem' }}>{item.status}</span></td></tr>))}</tbody>
            </table>
          ) : <p style={{ color: '#94a3b8' }}>Chưa có lịch làm việc nào được giao.</p>}
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>💰 Bảng lương của tôi</h3>
          {salary ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Số ca làm</p><h2 style={{ color: 'var(--primary)', margin: 0 }}>{salary.completedShifts}</h2></div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Lương ca</p><h2 style={{ color: '#10b981', margin: 0 }}>{salary.totalShiftPay?.toLocaleString('vi-VN')}đ</h2></div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Tiền phạt</p><h2 style={{ color: '#ef4444', margin: 0 }}>-{salary.totalPenalty?.toLocaleString('vi-VN')}đ</h2></div>
              <div style={{ background: 'var(--primary)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', color: 'white', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}><p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.8 }}>THỰC NHẬN</p><h2 style={{ margin: 0 }}>{salary.finalSalary?.toLocaleString('vi-VN')}đ</h2></div>
            </div>
          ) : <p style={{ color: '#94a3b8' }}>Chưa có dữ liệu lương. Hoàn thành ca trực để hệ thống tính lương.</p>}
        </div>
      )}

      {activeTab === 'incident' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🚨 BIÊN BẢN GHI NHẬN SỰ CỐ CA TRỰC</h3>
          <textarea 
            className="form-input" style={{ width: '100%', minHeight: '150px', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', fontSize: '1rem', resize: 'vertical', marginBottom: '1.5rem' }}
            placeholder="Mô tả chi tiết sự cố xảy ra..." value={incidentContent} onChange={(e) => setIncidentContent(e.target.value)}
          />
          <button onClick={handleReportIncident} disabled={isLoading} className="btn" style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '100px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold' }}>
            📨 Gửi Biên Bản Cho Quản Lý
          </button>
          {incidentMsg && <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: '500' }}>{incidentMsg}</div>}
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>📝 YÊU CẦU NGHỈ PHÉP / ĐỔI CA</h3>
          <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <select className="form-input" value={leaveForm.requestType} onChange={e => setLeaveForm({...leaveForm, requestType: e.target.value})}>
              <option value="LEAVE">Xin nghỉ phép</option>
              <option value="SHIFT_SWAP">Yêu cầu đổi ca</option>
            </select>
            <input type="date" className="form-input" required value={leaveForm.targetDate} onChange={e => setLeaveForm({...leaveForm, targetDate: e.target.value})} />
            
            {leaveForm.requestType === 'SHIFT_SWAP' && (
              <select className="form-input" required value={leaveForm.substituteUserId} onChange={e => setLeaveForm({...leaveForm, substituteUserId: e.target.value})}>
                <option value="">-- Chọn người trực thay --</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName || s.username}</option>)}
              </select>
            )}
            
            <textarea className="form-input" placeholder="Lý do chi tiết..." required value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2rem', borderRadius: '100px' }}>Gửi Yêu Cầu</button>
          </form>
          {leaveMsg && <div style={{ marginTop: '1rem', color: 'green', fontWeight: 'bold' }}>{leaveMsg}</div>}
        </div>
      )}

      {activeTab === 'handover' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🤝 BÀN GIAO CA TRỰC</h3>
          {todayAssignment ? (
            <form onSubmit={handleHandoverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>Ca đang trực: <b>{todayAssignment.shift?.shiftName} ({todayAssignment.shift?.startTime} - {todayAssignment.shift?.endTime})</b></p>
              <select className="form-input" required value={handoverForm.toUserId} onChange={e => setHandoverForm({...handoverForm, toUserId: e.target.value})}>
                <option value="">-- Chọn người nhận bàn giao --</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName || s.username}</option>)}
              </select>
              <textarea className="form-input" placeholder="Ghi chú bàn giao (tiền mặt, chìa khóa, sự việc tồn đọng...)" required value={handoverForm.notes} onChange={e => setHandoverForm({...handoverForm, notes: e.target.value})} />
              <button type="submit" className="btn" style={{ padding: '1rem 2rem', borderRadius: '100px', background: '#3b82f6', color: 'white' }}>Xác Nhận Bàn Giao</button>
            </form>
          ) : (
            <p>Không có ca trực để bàn giao.</p>
          )}
          {handoverMsg && <div style={{ marginTop: '1rem', color: 'green', fontWeight: 'bold' }}>{handoverMsg}</div>}
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🔐 ĐỔI MẬT KHẨU</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="password" placeholder="Mật khẩu cũ" required className="form-input" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} />
            <input type="password" placeholder="Mật khẩu mới" required className="form-input" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
            <input type="password" placeholder="Xác nhận mật khẩu mới" required className="form-input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
            <button type="submit" disabled={isLoading} className="btn" style={{ padding: '1rem', borderRadius: '100px', background: '#3b82f6', color: 'white', fontWeight: 'bold' }}>Cập Nhật Mật Khẩu</button>
          </form>
          {passwordMsg && <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', backgroundColor: passwordMsg.includes('❌') ? '#fef2f2' : '#f0fdf4', color: passwordMsg.includes('❌') ? '#991b1b' : '#166534', fontWeight: '500' }}>{passwordMsg}</div>}
        </div>
      )}

    </div>
      </main>
    </div>
  );
};

export default StaffDashboard;