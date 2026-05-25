import React, { useState, useEffect } from 'react';

const StaffDashboard = ({ user }) => {
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

  useEffect(() => {
    if (user && user.id) {
      fetchScheduleAndTodayAssignment();
      fetchSalary();
    }
  }, [user]);

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

  const tabStyle = (tabName) => ({
    padding: '0.75rem 1.5rem', borderRadius: '100px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
    backgroundColor: activeTab === tabName ? 'var(--primary)' : '#f1f5f9',
    color: activeTab === tabName ? 'white' : '#64748b',
    boxShadow: activeTab === tabName ? '0 4px 6px rgba(79, 70, 229, 0.2)' : 'none'
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>👋 Chào ngày mới, {user.fullName || user.username}!</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '100px', flexWrap: 'wrap' }}>
        <button style={tabStyle('checkin')} onClick={() => setActiveTab('checkin')}>⚡ Chấm công</button>
        <button style={tabStyle('schedule')} onClick={() => setActiveTab('schedule')}>📅 Xem lịch</button>
        <button style={tabStyle('salary')} onClick={() => setActiveTab('salary')}>💰 Xem lương</button>
        <button style={tabStyle('incident')} onClick={() => setActiveTab('incident')}>🚨 Sự cố</button>
      </div>

      {activeTab === 'checkin' && (
        <>
          <div className="card" style={{ marginBottom: '2rem', borderRadius: '24px', padding: '2rem', background: 'linear-gradient(145deg, #ffffff, #f0f4f8)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Ca trực hôm nay</h3>
            {todayAssignment ? (
              <>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', margin: '0.5rem 0' }}>{todayAssignment.shift?.shiftName} ({todayAssignment.shift?.startTime} - {todayAssignment.shift?.endTime})</p>
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
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}><th style={{ padding: '0.75rem', color: '#64748b' }}>Ngày làm</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Tên ca</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Thời gian</th><th style={{ padding: '0.75rem', color: '#64748b' }}>Trạng thái</th></tr></thead>
              <tbody>{schedule.map((item, index) => (<tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '1rem 0.75rem' }}>{item.workDate}</td><td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>{item.shift?.shiftName}</td><td style={{ padding: '1rem 0.75rem' }}>{item.shift?.startTime} - {item.shift?.endTime}</td><td style={{ padding: '1rem 0.75rem' }}><span style={{ background: item.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: item.status === 'COMPLETED' ? '#166534' : '#854d0e', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.85rem' }}>{item.status}</span></td></tr>))}</tbody>
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
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Nhân viên lập biên bản ghi nhận sự cố phát sinh trong ca làm việc (Mất thẻ, va quẹt xe, hệ thống lỗi...).</p>
          
          <textarea 
            className="form-input"
            style={{ width: '100%', minHeight: '150px', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', fontSize: '1rem', resize: 'vertical', marginBottom: '1.5rem' }}
            placeholder="Mô tả chi tiết sự cố xảy ra..."
            value={incidentContent}
            onChange={(e) => setIncidentContent(e.target.value)}
          />
          
          <button 
            onClick={handleReportIncident} 
            disabled={isLoading}
            className="btn" 
            style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '100px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)' }}
          >
            📨 Gửi Biên Bản Cho Quản Lý
          </button>

          {incidentMsg && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', backgroundColor: incidentMsg.includes('Thành công') || incidentMsg.includes('thành công') ? '#f0fdf4' : '#fef2f2', color: incidentMsg.includes('Thành công') || incidentMsg.includes('thành công') ? '#166534' : '#991b1b', fontWeight: '500' }}>
              {incidentMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;