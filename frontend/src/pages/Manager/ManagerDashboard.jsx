import React, { useState, useEffect } from 'react';

const ManagerDashboard = ({ user, activeTab }) => {
  const [pendingRequests, setPendingRequests] = useState([]); 
  const [incidents, setIncidents] = useState([]); 
  const [alertMsg, setAlertMsg] = useState('');
  const [staffs, setStaffs] = useState([]); 
  const [shifts, setShifts] = useState([]); 
  const [reports, setReports] = useState([]); 
  const [lateReports, setLateReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  // Form state
  const [assignUserId, setAssignUserId] = useState(''); 
  const [assignShiftId, setAssignShiftId] = useState(''); 
  const [assignDate, setAssignDate] = useState('');
  const [assignPosition, setAssignPosition] = useState('Cổng chính Học viện');

  useEffect(() => { 
    fetchPendingRequests(); 
    fetchIncidents(); 
    fetchStaffsAndShifts(); 
    fetchReports(); 
    fetchAttendance(); 
  }, []);

  const fetchPendingRequests = async () => { try { const r = await fetch('http://localhost:8080/api/manager/leave-requests'); if(r.ok) setPendingRequests(await r.json()); } catch(e){} };
  const fetchIncidents = async () => { try { const r = await fetch('http://localhost:8080/api/manager/incidents'); if(r.ok) setIncidents(await r.json()); } catch(e){} };
  const fetchStaffsAndShifts = async () => { try { const s = await fetch('http://localhost:8080/api/manager/staff-list'); const sh = await fetch('http://localhost:8080/api/manager/shifts'); if(s.ok) setStaffs(await s.json()); if(sh.ok) setShifts(await sh.json()); } catch(e){} };
  const fetchReports = async () => { try { const r = await fetch('http://localhost:8080/api/manager/calculate-salaries'); const l = await fetch('http://localhost:8080/api/manager/reports/late'); if(r.ok) setReports(await r.json()); if(l.ok) setLateReports(await l.json()); } catch(e){} };
  const fetchAttendance = async () => { try { const r = await fetch('http://localhost:8080/api/manager/attendance'); if(r.ok) setAttendance(await r.json()); } catch(e){} };

  const handleApproveRequest = async (id, isApproved) => { try { const r = await fetch(`http://localhost:8080/api/manager/leave-requests/${id}/approve?isApproved=${isApproved}`, { method: 'PUT' }); if (r.ok) { setAlertMsg(isApproved ? '✅ Đã duyệt!' : '❌ Đã từ chối!'); setPendingRequests(pendingRequests.filter(req => req.id !== id)); setTimeout(() => setAlertMsg(''), 3000); } } catch (error) { setAlertMsg('❌ Lỗi'); } };
  const handleResolveIncident = async (id) => { try { const r = await fetch(`http://localhost:8080/api/manager/incidents/${id}/resolve`, { method: 'PUT' }); if (r.ok) { setAlertMsg('✅ Đã xử lý sự cố!'); setIncidents(incidents.filter(inc => inc.id !== id)); setTimeout(() => setAlertMsg(''), 3000); } } catch (error) { setAlertMsg('❌ Lỗi'); } };

  const handleAssign = async (e) => { 
    e.preventDefault(); 
    try { 
      const r = await fetch('http://localhost:8080/api/manager/assign-shift', { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ userId: assignUserId, shiftId: assignShiftId, workDate: assignDate }) 
      }); 
      if(r.ok) { 
        setAlertMsg(`✅ Đã xếp ca và phân công vị trí: "${assignPosition}" thành công!`); 
        setAssignUserId(''); setAssignShiftId(''); setAssignDate(''); setAssignPosition('Cổng chính'); 
        setTimeout(() => setAlertMsg(''), 3000); 
      } else setAlertMsg('❌ Lỗi xếp ca'); 
    } catch(e) { setAlertMsg('❌ Lỗi kết nối'); }
  };

  const thStyle = { padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'left' };
  const thStyleH = { ...thStyle, backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#64748b', fontSize: '0.85rem' };

  return (<div style={{ padding: '2rem' }}><h1 style={{margin:0}}>Trang Quản Lý Nhà Xe</h1><p style={{color:'#64748b', margin:'5px 0 1.5rem'}}>Xin chào, {user.fullName}</p>
  {alertMsg && <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '12px', backgroundColor: alertMsg.includes('thành công') || alertMsg.includes('Đã') || alertMsg.includes('đã') ? '#dcfce7' : '#fee2e2', color: alertMsg.includes('thành công') || alertMsg.includes('Đã') || alertMsg.includes('đã') ? '#166534' : '#991b1b', fontWeight: 'bold' }}>{alertMsg}</div>}

  {/* 1. PHÊ DUYỆT ĐƠN */}
  {activeTab === 'requests' && (<div className="card" style={{ borderRadius: '24px', padding: '2rem' }}><h2 style={{ marginTop: 0 }}>📝 PHÊ DUYỆT ĐƠN XIN NGHỈ / ĐỔI CA</h2>{pendingRequests.length === 0 ? (<div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '16px' }}><p>Không có đơn nào chờ xử lý.</p></div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{pendingRequests.map((req) => (<div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><span style={{ background: req.requestType === 'LEAVE' ? '#dbeafe' : '#fef3c7', color: req.requestType === 'LEAVE' ? '#1e40af' : '#92400e', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 'bold' }}>{req.requestType === 'LEAVE' ? '📩 XIN NGHỈ' : '🔄 XIN ĐỔI CA'}</span><p style={{ margin: 0, color: '#64748b' }}>Ngày áp dụng: {req.targetDate}</p></div><p style={{ margin: '0 0 0.5rem' }}><b>Người gửi:</b> {req.user?.fullName} {req.requestType === 'SHIFT_SWAP' && <span style={{ color: '#16a34a' }}>(Đổi với: {req.substituteUser?.fullName})</span>}</p><p style={{ margin: '0 0 1.5rem 0' }}><b>Lý do:</b> {req.reason}</p><div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}><button onClick={() => handleApproveRequest(req.id, false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: '#fff', color: '#dc2626', cursor: 'pointer' }}>❌ Từ chối</button><button onClick={() => handleApproveRequest(req.id, true)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>✅ Đồng ý duyệt</button></div></div>))}</div>)}</div>)}

  {/* 2. DUYỆT SỰ CỐ */}
  {activeTab === 'incidents' && (<div className="card" style={{ borderRadius: '24px', padding: '2rem' }}><h2 style={{ marginTop: 0, color: '#ef4444' }}>🚨 DUYỆT BÁO CÁO SỰ CỐ (Mất thẻ, Không đủ chỗ...)</h2>{incidents.length === 0 ? (<div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '16px' }}><p>Không có sự cố nào chờ xử lý.</p></div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{incidents.map((inc) => (<div key={inc.id} style={{ border: '1px solid #fecaca', borderRadius: '16px', padding: '1.5rem', backgroundColor: '#fff5f5' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h3 style={{ margin: 0, color: '#991b1b' }}>Nhân viên ID: {inc.userId}</h3><p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Thời gian: {new Date(inc.reportTime).toLocaleString('vi-VN')}</p></div><p style={{ margin: '0 0 1.5rem 0', fontStyle: 'italic' }}>"{inc.content}"</p><div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => handleResolveIncident(inc.id)} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>✅ Đã xử lý sự cố</button></div></div>))}</div>)}</div>)}

  {/* 3. XẾP CA & PHÂN CÔNG VỊ TRÍ */}
  {activeTab === 'assign' && (<div className="card" style={{ borderRadius: '24px', padding: '2rem' }}><h2 style={{ marginTop: 0 }}>📅 XẾP CA & PHÂN CÔNG VỊ TRÍ NHÂN VIÊN</h2><form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}><div><label style={{ display:'block', fontWeight:'bold', marginBottom:'0.5rem' }}>Nhân viên (ID)</label><select className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={assignUserId} onChange={e => setAssignUserId(e.target.value)} required><option value="">-- Chọn nhân viên --</option>{staffs.filter(s => s.role === 'STAFF').map(s => <option key={s.id} value={s.id}>{s.fullName} (ID: {s.id})</option>)}</select></div><div><label style={{ display:'block', fontWeight:'bold', marginBottom:'0.5rem' }}>Ca làm việc</label><select className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={assignShiftId} onChange={e => setAssignShiftId(e.target.value)} required><option value="">-- Chọn ca --</option>{shifts.map(s => <option key={s.id} value={s.id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>)}</select></div><div><label style={{ display:'block', fontWeight:'bold', marginBottom:'0.5rem' }}>Ngày làm việc</label><input type="date" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={assignDate} onChange={e => setAssignDate(e.target.value)} required /></div><div><label style={{ display:'block', fontWeight:'bold', marginBottom:'0.5rem' }}>Phân công vị trí trực</label><select className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={assignPosition} onChange={e => setAssignPosition(e.target.value)}><option value="Cổng chính Học viện">Cổng chính Học viện</option><option value="Khu vực B (Sau thư viện)">Khu vực B (Sau thư viện)</option><option value="Bãi xe đường vòng">Bãi xe đường vòng</option></select></div><div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}><button type="submit" className="btn" style={{ padding: '0.75rem 2rem', borderRadius: '100px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', width: '300px' }}>Xác nhận xếp ca & phân vị trí</button></div></form></div>)}

  {/* 4. THEO DÕI GIỜ LÀM */}
  {activeTab === 'tracking' && (<div className="card" style={{ borderRadius: '24px', padding: '2rem' }}><h2 style={{ marginTop: 0 }}>⏱️ THEO DÕI GIỜ LÀM CỦA NHÂN VIÊN</h2><p style={{color:'#64748b', marginBottom:'1rem'}}>Lịch sử Check-in / Check-out thực tế.</p>{attendance.length === 0 ? <p style={{color:'#94a3b8'}}>Chưa có dữ liệu chấm công.</p> : (<table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={thStyleH}>Nhân viên</th><th style={thStyleH}>Ngày làm</th><th style={thStyleH}>Giờ vào (Thực tế)</th><th style={thStyleH}>Giờ ra (Thực tế)</th><th style={thStyleH}>Trạng thái</th></tr></thead><tbody>{attendance.map((att, i) => (<tr key={i}><td style={thStyle}>{att.shiftAssignment?.user?.fullName || 'N/A'}</td><td style={thStyle}>{att.checkInTime ? new Date(att.checkInTime).toLocaleDateString('vi-VN') : 'N/A'}</td><td style={{thStyle, color:'#16a34a'}}>{att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('vi-VN') : 'Chưa vào'}</td><td style={{thStyle, color:'#dc2626'}}>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('vi-VN') : 'Chưa ra'}</td><td style={thStyle}><span style={{ background: att.status === 'ON_TIME' ? '#dcfce7' : '#fef3c7', color: att.status === 'ON_TIME' ? '#166534' : '#92400e', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.85rem' }}>{att.status === 'ON_TIME' ? 'Đúng giờ' : 'Đi trễ'}</span></td></tr>))}</tbody></table>)}</div>)}

  {/* 5. BÁO CÁO NHÂN SỰ (ĐI TRỄ, NGHỈ) */}
  {activeTab === 'hr-reports' && (<div className="card" style={{ borderRadius: '24px', padding: '2rem' }}><h2 style={{ marginTop: 0, color: '#ef4444' }}>⚠️ BÁO CÁO NHÂN SỰ: ĐI TRỄ & NGHỈ PHÉP</h2>{lateReports.length === 0 ? <p style={{color:'#94a3b8'}}>Chúc mừng, không có nhân viên nào vi phạm!</p> : (<table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={thStyleH}>Nhân viên vi phạm</th><th style={thStyleH}>Ngày vi phạm</th><th style={thStyleH}>Loại vi phạm</th><th style={thStyleH}>Mức phạt</th></tr></thead><tbody>{lateReports.map((r, i) => (<tr key={i}><td style={{...thStyle, fontWeight:'bold'}}>{r.name}</td><td style={thStyle}>{r.date}</td><td style={thStyle}>{r.status}</td><td style={{...thStyle, color:'#dc2626', fontWeight:'bold'}}>{r.penalty?.toLocaleString()} VNĐ</td></tr>))}</tbody></table>)}</div>)}

  {/* 6. BẢNG LƯƠNG TỔNG HỢP */}
  {activeTab === 'salary' && (<div className="card" style={{ borderRadius: '24px', padding: '2rem' }}><h2 style={{ marginTop: 0 }}>💰 BẢNG TÍNH LƯƠNG TỔNG HỢP</h2><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={thStyleH}>Nhân viên</th><th style={thStyleH}>Số ca làm</th><th style={thStyleH}>Tổng lương ca</th><th style={thStyleH}>Trừ phạt</th><th style={thStyleH}>Thực nhận</th></tr></thead><tbody>{reports.map((r, i) => (<tr key={i}><td style={thStyle}>{r.name}</td><td style={{...thStyle, textAlign:'center'}}>{r.shifts}</td><td style={thStyle}>{r.pay?.toLocaleString()}đ</td><td style={{...thStyle, color:'#dc2626'}}>-{r.penalty?.toLocaleString()}đ</td><td style={{...thStyle, fontWeight:'bold', color:'#16a34a', fontSize:'1.1rem'}}>{r.final?.toLocaleString()}đ</td></tr>))}</tbody></table></div>)}

  </div>);
};
export default ManagerDashboard;