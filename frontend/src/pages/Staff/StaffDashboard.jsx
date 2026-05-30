import React, { useState, useEffect } from 'react';

const StaffDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('checkin');
  const [todayAssignment, setTodayAssignment] = useState(null);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [penaltyInfo, setPenaltyInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [salary, setSalary] = useState(null);
  
  // Form state
  const [incidentContent, setIncidentContent] = useState('');
  const [incidentMsg, setIncidentMsg] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveMsg, setLeaveMsg] = useState('');
  const [swapDate, setSwapDate] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [swapUserId, setSwapUserId] = useState('');
  const [swapMsg, setSwapMsg] = useState('');

  // Lịch sử phản hồi state
  const [myRequests, setMyRequests] = useState([]);
  const [myIncidents, setMyIncidents] = useState([]);

  useEffect(() => {
    if (user && user.id) { 
      fetchScheduleAndTodayAssignment(); 
      fetchSalary();
      fetchMyRequests();
      fetchMyIncidents();
    }
  }, [user]);

  const fetchScheduleAndTodayAssignment = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/staff/${user.id}/schedule`);
      if (!res.ok) throw new Error('Lỗi lấy lịch');
      const data = await res.json(); setSchedule(data);
      const todayStr = new Date().toISOString().split('T')[0];
      setTodayAssignment(data.find(item => item.workDate && item.workDate.startsWith(todayStr)) || null);
    } catch (error) { console.error(error); }
  };

  const fetchSalary = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/staff/${user.id}/my-salary`);
      if (!res.ok) throw new Error('Chưa có lương');
      setSalary(await res.json());
    } catch (error) { setSalary(null); }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/staff/${user.id}/my-requests`);
      if (res.ok) setMyRequests(await res.json());
    } catch (error) { console.error(error); }
  };

  const fetchMyIncidents = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/staff/${user.id}/my-incidents`);
      if (res.ok) setMyIncidents(await res.json());
    } catch (error) { console.error(error); }
  };

  const handleCheckIn = async () => {
    if (!todayAssignment) return setMessage('❌ Hôm nay bạn chưa được phân ca trực.');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/staff/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId: todayAssignment.id }) });
      const data = await res.json();
      if (res.ok) { setStatus('checked-in'); setMessage(`✅ ${data.message}`); setPenaltyInfo(data.penaltyFee > 0 ? `⚠️ Bạn đi trễ ${data.minutesLate} phút. Phạt: ${data.penaltyFee.toLocaleString('vi-VN')} VNĐ` : '✨ Tuyệt vời! Bạn đã đi làm đúng giờ.'); }
      else { setMessage(`❌ Thất bại: ${data.message || 'Không thể check-in'}`); }
    } catch (error) { setMessage('❌ Lỗi kết nối đến máy chủ!'); } finally { setIsLoading(false); }
  };

  const handleCheckOut = async () => {
    if (!todayAssignment) return setMessage('❌ Hôm nay bạn chưa được phân ca trực.');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/staff/check-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId: todayAssignment.id }) });
      const data = await res.json();
      if (res.ok) { setStatus('checked-out'); setMessage(`👋 ${data.message}`); setPenaltyInfo(null); }
      else { setMessage(`❌ Thất bại: ${data.message || 'Không thể check-out'}`); }
    } catch (error) { setMessage('❌ Lỗi kết nối đến máy chủ!'); } finally { setIsLoading(false); }
  };

  const handleReportIncident = async () => {
    if (!incidentContent.trim()) return setIncidentMsg('❌ Vui lòng nhập nội dung sự cố.');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/staff/report-incident', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, content: incidentContent }) });
      const data = await res.json();
      if (res.ok) { setIncidentMsg('✅ Đã gửi biên bản thành công!'); setIncidentContent(''); fetchMyIncidents(); }
      else { setIncidentMsg(`❌ Thất bại: ${data.message}`); }
    } catch (error) { setIncidentMsg('❌ Lỗi kết nối đến máy chủ!'); } finally { setIsLoading(false); }
  };

  const handleRequestLeave = async () => {
    if (!leaveDate || !leaveReason) return setLeaveMsg('❌ Vui lòng nhập đủ ngày và lý do.');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/staff/request-leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, targetDate: leaveDate, reason: leaveReason }) });
      const data = await res.json();
      if (res.ok) { setLeaveMsg('✅ Gửi đơn thành công!'); setLeaveDate(''); setLeaveReason(''); fetchMyRequests(); }
      else setLeaveMsg(`❌ Thất bại: ${data.message}`);
    } catch (error) { setLeaveMsg('❌ Lỗi kết nối máy chủ.'); } finally { setIsLoading(false); }
  };

  const handleRequestSwap = async () => {
    if (!swapDate || !swapReason || !swapUserId) return setSwapMsg('❌ Vui lòng nhập đủ thông tin.');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/staff/request-swap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, substituteUserId: swapUserId, targetDate: swapDate, reason: swapReason }) });
      const data = await res.json();
      if (res.ok) { setSwapMsg('✅ Gửi yêu cầu thành công!'); setSwapDate(''); setSwapReason(''); setSwapUserId(''); fetchMyRequests(); }
      else setSwapMsg(`❌ Thất bại: ${data.message}`);
    } catch (error) { setSwapMsg('❌ Lỗi kết nối máy chủ.'); } finally { setIsLoading(false); }
  };

  const tabStyle = (tabName) => ({ padding: '0.6rem 1rem', borderRadius: '100px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', backgroundColor: activeTab === tabName ? 'var(--primary)' : '#f1f5f9', color: activeTab === tabName ? 'white' : '#64748b', fontSize: '0.9rem' });

  // Helper để hiển thị trạng thái đẹp mắt
  const renderStatus = (status) => {
    if (status === 'PENDING') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem' }}>⏳ Chờ duyệt</span>;
    if (status === 'APPROVED' || status === 'RESOLVED') return <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem' }}>✅ Đã duyệt</span>;
    if (status === 'REJECTED') return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem' }}>❌ Bị từ chối</span>;
    return status;
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>👋 Chào ngày mới, {user.fullName || user.username}!</h2>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '100px', flexWrap: 'wrap' }}>
        {['checkin', 'schedule', 'salary', 'incident', 'leave', 'swap'].map(tab => (
          <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'checkin' && '⚡ Chấm công'} {tab === 'schedule' && '📅 Lịch'} {tab === 'salary' && '💰 Lương'} {tab === 'incident' && '🚨 Sự cố'} {tab === 'leave' && '📩 Xin nghỉ'} {tab === 'swap' && '🔄 Đổi ca'}
          </button>
        ))}
      </div>

      {activeTab === 'checkin' && (
        <>
          <div className="card" style={{ marginBottom: '2rem', borderRadius: '24px', padding: '2rem', background: 'linear-gradient(145deg, #ffffff, #f0f4f8)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Ca trực hôm nay</h3>
            {todayAssignment ? (<><p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', margin: '0.5rem 0' }}>{todayAssignment.shift?.shiftName} ({todayAssignment.shift?.startTime} - {todayAssignment.shift?.endTime})</p><p style={{ color: 'var(--text-main)' }}>Trạng thái: {todayAssignment.status}</p></>) : (<p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Bạn không có ca trực nào hôm nay.</p>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={handleCheckIn} disabled={!todayAssignment || status === 'checked-in' || status === 'checked-out' || isLoading} className="btn" style={{ padding: '1.5rem', fontSize: '1.2rem', borderRadius: '100px', backgroundColor: (status === 'checked-in' || status === 'checked-out' || !todayAssignment) ? '#e2e8f0' : 'var(--primary)', color: (status === 'checked-in' || status === 'checked-out' || !todayAssignment) ? '#94a3b8' : 'white' }}>{isLoading && status === '' ? '⏳ ĐANG XỬ LÝ...' : '📍 CHECK-IN NHẬN CA'}</button>
            <button onClick={handleCheckOut} disabled={status !== 'checked-in' || isLoading} className="btn" style={{ padding: '1.5rem', fontSize: '1.2rem', borderRadius: '100px', backgroundColor: status === 'checked-in' ? '#ef4444' : '#fee2e2', color: status === 'checked-in' ? 'white' : '#fca5a5' }}>{isLoading && status === 'checked-in' ? '⏳ ĐANG XỬ LÝ...' : '🏁 CHECK-OUT KẾT THÚC'}</button>
          </div>
          {message && (<div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '16px', backgroundColor: status === 'checked-in' ? '#f0fdf4' : '#f8fafc', color: status === 'checked-in' ? '#166534' : '#334155', textAlign: 'center', fontWeight: '500' }}><div>{message}</div>{penaltyInfo && <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '12px', backgroundColor: penaltyInfo.includes('Phạt') ? '#fef2f2' : '#ecfdf5', color: penaltyInfo.includes('Phạt') ? '#991b1b' : '#065f46', fontSize: '0.95rem' }}>{penaltyInfo}</div>}</div>)}
        </>
      )}

      {activeTab === 'schedule' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>📅 Lịch làm việc của tôi</h3>
          {schedule.length > 0 ? (<table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}><th style={{ padding: '0.75rem', color: '#64748b' }}>Ngày</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Ca</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Thời gian</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Trạng thái</th></tr></thead><tbody>{schedule.map((item, i) => (<tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '1rem 0.75rem' }}>{item.workDate}</td><td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>{item.shift?.shiftName}</td><td style={{ padding: '1rem 0.75rem' }}>{item.shift?.startTime} - {item.shift?.endTime}</td><td style={{ padding: '1rem 0.75rem' }}>{renderStatus(item.status)}</td></tr>))}</tbody></table>) : <p style={{ color: '#94a3b8' }}>Chưa có lịch.</p>}
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>💰 Bảng lương</h3>
          {salary ? (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}><div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Số ca</p><h2 style={{ color: 'var(--primary)', margin: 0 }}>{salary.completedShifts}</h2></div><div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Lương ca</p><h2 style={{ color: '#10b981', margin: 0 }}>{salary.totalShiftPay?.toLocaleString('vi-VN')}đ</h2></div><div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}><p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Phạt</p><h2 style={{ color: '#ef4444', margin: 0 }}>-{salary.totalPenalty?.toLocaleString('vi-VN')}đ</h2></div><div style={{ background: 'var(--primary)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', color: 'white' }}><p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.8 }}>THỰC NHẬN</p><h2 style={{ margin: 0 }}>{salary.finalSalary?.toLocaleString('vi-VN')}đ</h2></div></div>) : <p style={{ color: '#94a3b8' }}>Chưa có dữ liệu.</p>}
        </div>
      )}

      {activeTab === 'incident' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🚨 GHI NHẬN SỰ CỐ</h3>
          <textarea className="form-input" style={{ width: '100%', minHeight: '100px', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', marginBottom: '1rem' }} placeholder="Mô tả sự cố..." value={incidentContent} onChange={(e) => setIncidentContent(e.target.value)} />
          <button onClick={handleReportIncident} disabled={isLoading} className="btn" style={{ padding: '1rem 2rem', borderRadius: '100px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold' }}>📨 Gửi Biên Bản</button>
          {incidentMsg && <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', backgroundColor: incidentMsg.includes('thành công') ? '#f0fdf4' : '#fef2f2', color: incidentMsg.includes('thành công') ? '#166534' : '#991b1b' }}>{incidentMsg}</div>}
          
          {/* PHẦN LỊCH SỬ TRẠNG THÁI */}
          <div style={{ marginTop: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <h4 style={{ color: '#64748b', marginBottom: '1rem' }}>LỊCH SỬ SỰ CỐ ĐÃ GỬI</h4>
            {myIncidents.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Bạn chưa gửi sự cố nào.</p> : (
              myIncidents.map(inc => (
                <div key={inc.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><p style={{ margin: 0 }}>{inc.content}</p><p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(inc.reportTime).toLocaleString('vi-VN')}</p></div>
                  {renderStatus(inc.status)}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>📩 GỬI ĐƠN XIN NGHỈ PHÉP</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Ngày muốn nghỉ</label><input type="date" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} /></div>
            <div><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Lý do</label><textarea className="form-input" style={{ width: '100%', minHeight: '60px', borderRadius: '8px', border: '1px solid #ccc', padding: '0.75rem' }} placeholder="Lý do..." value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} /></div>
            <button onClick={handleRequestLeave} disabled={isLoading} className="btn" style={{ padding: '1rem', borderRadius: '100px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold' }}>Gửi Đơn</button>
          </div>
          {leaveMsg && <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', backgroundColor: leaveMsg.includes('thành công') ? '#f0fdf4' : '#fef2f2', color: leaveMsg.includes('thành công') ? '#166534' : '#991b1b' }}>{leaveMsg}</div>}
          
          {/* PHẦN LỊCH SỬ TRẠNG THÁI */}
          <div style={{ marginTop: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <h4 style={{ color: '#64748b', marginBottom: '1rem' }}>TRẠNG THÁI ĐƠN XIN NGHỈ</h4>
            {myRequests.filter(r => r.requestType === 'LEAVE').length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chưa có đơn nào.</p> : (
              myRequests.filter(r => r.requestType === 'LEAVE').map(req => (
                <div key={req.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><p style={{ margin: 0 }}>Nghỉ ngày: {req.targetDate} - Lý do: {req.reason}</p></div>
                  {renderStatus(req.status)}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'swap' && (
        <div className="card" style={{ borderRadius: '24px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🔄 GỬI ĐƠN XIN ĐỔI CA</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Ngày cần đổi ca</label><input type="date" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={swapDate} onChange={(e) => setSwapDate(e.target.value)} /></div>
            <div><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>ID Nhân viên thay thế</label><input type="number" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="Nhập ID..." value={swapUserId} onChange={(e) => setSwapUserId(e.target.value)} /></div>
            <div><label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Lý do</label><textarea className="form-input" style={{ width: '100%', minHeight: '60px', borderRadius: '8px', border: '1px solid #ccc', padding: '0.75rem' }} placeholder="Lý do..." value={swapReason} onChange={(e) => setSwapReason(e.target.value)} /></div>
            <button onClick={handleRequestSwap} disabled={isLoading} className="btn" style={{ padding: '1rem', borderRadius: '100px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', fontWeight: 'bold' }}>Gửi Yêu Cầu</button>
          </div>
          {swapMsg && <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', backgroundColor: swapMsg.includes('thành công') ? '#f0fdf4' : '#fef2f2', color: swapMsg.includes('thành công') ? '#166534' : '#991b1b' }}>{swapMsg}</div>}
          
          {/* PHẦN LỊCH SỬ TRẠNG THÁI */}
          <div style={{ marginTop: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <h4 style={{ color: '#64748b', marginBottom: '1rem' }}>TRẠNG THÁI ĐƠN XIN ĐỔI CA</h4>
            {myRequests.filter(r => r.requestType === 'SHIFT_SWAP').length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chưa có đơn nào.</p> : (
              myRequests.filter(r => r.requestType === 'SHIFT_SWAP').map(req => (
                <div key={req.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><p style={{ margin: 0 }}>Đổi ca ngày: {req.targetDate} - Nhân viên thay thế: {req.substituteUser?.fullName}</p></div>
                  {renderStatus(req.status)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffDashboard;