// src/pages/manager/ManagerDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import "./ManagerDashboard.css";
import UserProfile from "../../components/UserProfile";
import { AlertTriangle, Banknote, BarChart2, BarChart3, CalendarDays, Car, Check, CheckCircle, ClipboardList, Edit, FileText, Home, Inbox, PartyPopper, PlusCircle, RefreshCw, Sun, Ticket, Users , Upload, Download, X} from "lucide-react";

const API = "http://localhost:8080/api";

import { formatDateTimeVN as fmt, formatDateVN as fmtDate, toInputDate, toBackendDate } from "../../utils/dateUtils";
import { REQUEST_TYPE_LABEL, REQUEST_STATUS_LABEL, INCIDENT_STATUS_LABEL, STATUS_LABEL, ROLE_LABEL, POSITION_LABEL, ASSIGNMENT_STATUS_LABEL } from "../../utils/constants";
function fmtMoney(v) { return (v || 0).toLocaleString("vi-VN") + " ₫"; }

function Alert({ msg, type }) {
  if (!msg) return null;
  return <div className={`alert ${type}`}>{msg}</div>;
}

// ── 1. TỔNG QUAN ───────────────────────────────────────────
function OverviewSection({ stats }) {
  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div><div className="stat-label">Tổng nhân viên</div><div className="stat-value">{stats.totalStaff ?? "—"}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><FileText size={24} /></div>
          <div><div className="stat-label">Đơn chờ duyệt</div><div className="stat-value">{stats.pendingRequests ?? "—"}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div><div className="stat-label">Sự cố chờ xử lý</div><div className="stat-value">{stats.pendingIncidents ?? "—"}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CalendarDays size={24} /></div>
          <div><div className="stat-label">Ca hôm nay</div><div className="stat-value">{stats.todayAssignments ?? "—"}</div></div>
        </div>
      </div>
    </div>
  );
}

// ── 2. PHÂN CA ─────────────────────────────────────────────
function ShiftSection() {
  const [staff, setStaff]       = useState([]);
  const [shifts, setShifts]     = useState([]);
  const [monthlyAssignments, setMonthlyAssignments] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  
  const [form, setForm]         = useState({ userId: "", shiftId: "", position: "XEP_XE" });
  const [msg, setMsg]           = useState({ text: "", type: "" });
  const [modalShift, setModalShift] = useState(null); 
  const [editingAssignId, setEditingAssignId] = useState(null);
  const [editForm, setEditForm] = useState({ userId: "", shiftId: "", position: "" });

  const load = useCallback(async () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth() + 1;
    const [staffRes, shiftRes, assignRes] = await Promise.all([
      fetch(`${API}/manager/staff-list`).then(r => r.json()).catch(() => []),
      fetch(`${API}/manager/shifts`).then(r => r.json()).catch(() => []),
      fetch(`${API}/manager/assignments?month=${m}&year=${y}`).then(r => r.json()).catch(() => []),
    ]);
    setStaff(Array.isArray(staffRes) ? staffRes.filter(u => u.role === "STAFF") : []);
    setShifts(Array.isArray(shiftRes) ? shiftRes : []);
    setMonthlyAssignments(Array.isArray(assignRes) ? assignRes.map(a => ({ ...a, workDate: a.workDate && a.workDate.includes('/') ? a.workDate.split('/').reverse().join('-') : a.workDate })) : []);
  }, [currentMonth]);

  useEffect(() => { load(); }, [load]);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const emptyDays = (firstDay + 6) % 7;
    
    const days = [];
    for (let i = 0; i < emptyDays; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      // Need to format YYYY-MM-DD reliably using local timezone
      const d = new Date(year, month, i);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 10);
      days.push(localISOTime);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const dailyAssignments = monthlyAssignments.filter(a => a.workDate === date);



  const handleAssign = async () => {
    if (!form.userId || !form.shiftId) {
      setMsg({ text: "Vui lòng chọn đủ nhân viên và ca!", type: "error" }); return;
    }
    try {
      const res = await fetch(`${API}/manager/assign-shift`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            userId: Number(form.userId), 
            shiftId: Number(form.shiftId), 
            workDate: date.split('-').reverse().join('/'), 
            position: form.position 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi phân ca");
      setMsg({ text: `${data.message}`, type: "success" });
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa phân công này?")) return;
    try {
      await fetch(`${API}/manager/assignments/${id}`, { method: "DELETE" });
      load();
    } catch { /* ignore */ }
  };

  const startEdit = (a) => {
      setEditingAssignId(a.id);
      setEditForm({ userId: a.user?.id || "", shiftId: a.shift?.id || "", position: a.position || "XEP_XE" });
  };

  const handleUpdate = async () => {
      try {
          const res = await fetch(`${API}/manager/assignments/${editingAssignId}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(editForm)
          });
          if (res.ok) {
              setEditingAssignId(null);
              load();
          } else {
              const data = await res.json();
              alert(data.message || "Lỗi cập nhật");
          }
      } catch (e) {
          alert("Lỗi mạng");
      }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} /> 
      
      <div className="card">
        <div className="calendar-header">
           <button onClick={handlePrevMonth}>&lt; Tháng trước</button>
           <h3>Tháng {currentMonth.getMonth() + 1} - {currentMonth.getFullYear()}</h3>
           <button onClick={handleNextMonth}>Tháng sau &gt;</button>
        </div>
        
        <div className="calendar-grid">
           {['T2','T3','T4','T5','T6','T7','CN'].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
           {calendarDays.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} className="calendar-day empty"></div>;
              const dayAssigns = monthlyAssignments.filter(a => a.workDate === d);
              const shiftMap = dayAssigns.reduce((acc, a) => {
                const sName = a.shift?.shiftName || 'Khác';
                if (!acc[sName]) acc[sName] = [];
                acc[sName].push(a);
                return acc;
              }, {});

              const dayTitle = Object.entries(shiftMap).map(([sName, assigns]) => {
                  return `${sName}:\n` + assigns.map(a => {
                      const pos = POSITION_LABEL[a.position] || a.position || '';
                      return `  - ${a.user?.fullName} (${pos})`;
                  }).join('\n');
              }).join('\n\n');

              return (
                 <div key={d} className={`calendar-day ${date === d ? 'selected' : ''}`} title={dayTitle} onClick={() => setDate(d)}>
                    <div className="day-num">{parseInt(d.slice(8))}</div>
                    <div className="day-shifts" style={{ fontSize: '11px', color: 'var(--accent)', marginTop: 'auto', fontWeight: '500' }}>
                       {Object.entries(shiftMap).map(([sName, assigns]) => (
                           <div key={sName} style={{ marginBottom: 4, cursor: 'pointer', textDecoration: 'underline' }} onClick={(e) => { e.stopPropagation(); setModalShift({ date: d, shiftName: sName }); }}>
                              {sName}: {assigns.length} NV
                           </div>
                       ))}
                    </div>
                 </div>
              );
           })}
        </div>
        
        <div className="assignment-form-inline">
           <h4>Phân ca ngày {date.split('-').reverse().join('/')}</h4>
           <div className="form-row">
             <div className="form-group">
               <label>Nhân viên</label>
               <select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}>
                 <option value="">-- Chọn nhân viên --</option>
                 {staff.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
               </select>
             </div>
             <div className="form-group">
               <label>Ca làm việc</label>
               <select value={form.shiftId} onChange={e => setForm({ ...form, shiftId: e.target.value })}>
                 <option value="">-- Chọn ca --</option>
                 {shifts.map(s => <option key={s.id} value={s.id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>)}
               </select>
             </div>
             <div className="form-group">
                 <label>Vị trí</label>
                 <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                   <option value="XEP_XE">Xếp xe</option>
                   <option value="KIEM_SOAT_VE">Kiểm soát vé</option>
                 </select>
               </div>
           </div>
            <button className="btn-primary" onClick={handleAssign}>Phân ca</button>
         </div>
      </div>

      {modalShift && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setModalShift(null); setEditingAssignId(null); }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 600, padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginBottom: 16 }}>Chi tiết {modalShift.shiftName} - {modalShift.date.split('-').reverse().join('/')}</h3>
            <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid #eee' }}><th style={{ padding: 8, textAlign: 'left' }}>Nhân viên</th><th style={{ padding: 8, textAlign: 'left' }}>Vị trí</th><th style={{ padding: 8, textAlign: 'right' }}>Hành động</th></tr></thead>
                <tbody>
                  {monthlyAssignments.filter(a => a.workDate === modalShift.date && (a.shift?.shiftName || 'Khác') === modalShift.shiftName).map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      {editingAssignId === a.id ? (
                        <>
                          <td style={{ padding: 8 }}>
                            <select value={editForm.userId} onChange={e => setEditForm({...editForm, userId: e.target.value})} style={{ width: '100%', padding: '4px' }}>
                               {staff.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: 8 }}>
                            <select value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} style={{ width: '100%', padding: '4px' }}>
                               <option value="XEP_XE">Xếp xe</option>
                               <option value="KIEM_SOAT_VE">Kiểm soát vé</option>
                            </select>
                          </td>
                          <td style={{ padding: 8, textAlign: 'right' }}>
                            <button className="btn-primary" style={{padding: '4px 8px', fontSize: 12}} onClick={handleUpdate}>Lưu</button>
                            <button className="btn-secondary" style={{padding: '4px 8px', fontSize: 12, marginLeft: 4}} onClick={() => setEditingAssignId(null)}>Hủy</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: 8 }}>{a.user?.fullName}</td>
                          <td style={{ padding: 8 }}>{POSITION_LABEL[a.position] || a.position || ''}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>
                            <button className="btn-icon" onClick={() => startEdit(a)}><Edit size={16} color="var(--accent)" /></button>
                            <button className="btn-icon" onClick={() => handleDelete(a.id)}><X size={16} color="var(--danger)" /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {monthlyAssignments.filter(a => a.workDate === modalShift.date && (a.shift?.shiftName || 'Khác') === modalShift.shiftName).length === 0 && (
                      <tr><td colSpan="3" style={{ padding: 16, textAlign: 'center', color: '#888' }}>Không còn nhân viên nào trong ca này.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
               <button className="btn-secondary" onClick={() => { setModalShift(null); setEditingAssignId(null); }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3. DUYỆT ĐƠN ───────────────────────────────────────────
function RequestSection({ onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [msg, setMsg]           = useState({ text: "", type: "" });

  const load = async () => {
    const data = await fetch(`${API}/manager/all-leave-requests`).then(r => r.json()).catch(() => []);
    if (Array.isArray(data)) {
      setRequests(data.filter(r => r.status === "PENDING"));
      setAllRequests(data.filter(r => r.status !== "PENDING"));
    } else {
      setRequests([]);
      setAllRequests([]);
    }
  };
  useEffect(() => { load(); }, []);

  const review = async (id, approved) => {
    try {
      const res = await fetch(`${API}/manager/leave-requests/${id}/approve?isApproved=${approved}`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi");
      setMsg({ text: `${data.message}${data.detail ? " " + data.detail : ""}`, type: "success" });
      load();
      if (onUpdate) onUpdate();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} /> <div className="card">
        <div className="card-title"><FileText size={18} color="var(--accent)" />Đơn chờ duyệt ({requests.length})</div>
        {requests.length === 0 ? (
          <div className="empty-state"><div className="emoji"><CheckCircle size={16} color="var(--accent)" /></div>Không có đơn nào đang chờ</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nhân viên</th><th>Loại</th><th>Ngày</th><th>Ca</th><th>Lý do</th><th>Người thay</th><th></th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.user?.fullName}</strong><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.user?.username}</div></td>
                    <td>{r.requestType === "LEAVE" ? <><Sun size={16} color="var(--accent)" />Nghỉ phép</> : <><RefreshCw size={16} color="var(--accent)" />Đổi ca</>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.targetDate)}</td>
                    <td>{r.shiftName || "—"}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason}</td>
                    <td>{r.substituteUser?.fullName || "—"}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn-approve" onClick={() => review(r.id, true)}><Check size={16} color="var(--accent)" />Duyệt</button>
                      <button className="btn-reject"  onClick={() => review(r.id, false)}><X size={16} color="var(--accent)" />Từ chối</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">Lịch sử đơn</div>
        <div className="table-wrap">
            <table>
                <thead><tr><th>Nhân viên</th><th>Loại</th><th>Trạng thái</th><th>Ngày</th><th>Kết quả</th></tr></thead>
                <tbody>{allRequests.map(r => <tr key={r.id}><td>{r.user?.fullName}</td><td>{REQUEST_TYPE_LABEL[r.requestType] || r.requestType}</td><td><span className={`badge ${r.status}`}>{REQUEST_STATUS_LABEL[r.status] || r.status}</span></td><td>{fmtDate(r.targetDate)}</td><td>{r.isApproved ? "Đã duyệt" : "Từ chối"}</td></tr>)}</tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// ── 4. SỰ CỐ ───────────────────────────────────────────────
function IncidentSection({ onUpdate }) {
  const [incidents, setIncidents] = useState([]);
  const [allIncidents, setAllIncidents] = useState([]);
  const [msg, setMsg]             = useState({ text: "", type: "" });

  const load = async () => {
    const data = await fetch(`${API}/manager/all-incidents`).then(r => r.json()).catch(() => []);
    if (Array.isArray(data)) {
      setIncidents(data.filter(i => i.status === "PENDING"));
      setAllIncidents(data.filter(i => i.status !== "PENDING"));
    } else {
      setIncidents([]);
      setAllIncidents([]);
    }
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id) => {
    try {
      const res = await fetch(`${API}/manager/incidents/${id}/resolve`, { method: "PUT" });
      if (!res.ok) throw new Error("Lỗi xử lý");
      setMsg({ text: "Đã đánh dấu xử lý xong!", type: "success" });
      load();
      if (onUpdate) onUpdate();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} /> <div className="card">
        <div className="card-title"><AlertTriangle size={18} color="var(--accent)" />Sự cố chờ xử lý ({incidents.length})</div>
        {incidents.length === 0 ? (
          <div className="empty-state"><div className="emoji"><CheckCircle size={16} color="var(--accent)" /></div>Không có sự cố nào</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Thời gian</th><th>Nhân viên ID</th><th>Nội dung</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(inc.reportTime)}</td>
                    <td>#{inc.userId}</td>
                    <td>{inc.content}</td>
                    <td><span className={`badge ${inc.status?.toLowerCase()}`}>{INCIDENT_STATUS_LABEL[inc.status] || inc.status}</span></td>
                    <td>
                      {inc.status === "PENDING" && (
                        <button className="btn-resolve" onClick={() => resolve(inc.id)}><Check size={16} color="var(--accent)" />Xử lý</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">Lịch sử sự cố</div>
        <div className="table-wrap">
            <table>
              <thead><tr><th>Thời gian</th><th>Nhân viên ID</th><th>Nội dung</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {allIncidents.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(inc.reportTime)}</td>
                    <td>#{inc.userId}</td>
                    <td>{inc.content}</td>
                    <td><span className={`badge ${inc.status?.toLowerCase()}`}>{INCIDENT_STATUS_LABEL[inc.status] || inc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// ── 5. BÁO CÁO VẬN HÀNH ───────────────────────────────────────
function ReportSection() {
  const [stats, setStats] = useState({});
  
  const load = useCallback(async () => {
    const s = await fetch(`${API}/manager/stats`).then(r => r.json()).catch(() => ({}));
    setStats(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="card-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ background: "var(--surface2)", border: "1px solid var(--accent)", borderRadius: 10 }}>
          <div className="card-title" style={{ color: "var(--accent)" }}><FileText size={18} />Đơn xin nghỉ chờ duyệt</div>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>{stats.pendingRequests || 0}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Nhân viên đang chờ phê duyệt đổi ca/xin phép</div>
        </div>
        <div className="card" style={{ background: "var(--surface2)", border: "1px solid var(--danger)", borderRadius: 10 }}>
          <div className="card-title" style={{ color: "var(--danger)" }}><AlertTriangle size={18} />Sự cố chưa giải quyết</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--danger)" }}>{stats.pendingIncidents || 0}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Báo cáo từ nhân viên cần xử lý ngay</div>
        </div>
      </div>
      
      <div className="card-row" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <div className="card" style={{ background: "var(--surface2)", border: "1px solid var(--success)", borderRadius: 10 }}>
          <div className="card-title" style={{ color: "var(--success)" }}><CalendarDays size={18} />Phân ca hôm nay</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--success)" }}>{stats.todayAssignments || 0}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Lượt nhân viên được phân công làm việc hôm nay</div>
        </div>
      </div>
    </div>
  );
}

// ── 6. DANH SÁCH NHÂN VIÊN ─────────────────────────────────
function StaffSection() {
  const [staff, setStaff] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Search and Sort
  const [searchName, setSearchName] = useState("");
  const [sortBy, setSortBy] = useState("NAME_ASC");

  // Schedule Modal
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState(null);
  const [scheduleMonth, setScheduleMonth] = useState(new Date());
  const [staffAssignments, setStaffAssignments] = useState([]);

  const EMPTY_DRAFT = { fullName: "", username: "", email: "", position: "", salary: "", workShift: "", workDays: "", role: "STAFF" };
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [draftMsg, setDraftMsg] = useState({ text: "", type: "" });
  const [drafting, setDrafting] = useState(false);

  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState({ text: "", type: "" });
  const [uploading, setUploading] = useState(false);
  const [importPreview, setImportPreview] = useState(null);

  const handleUpload = async (e) => {
      e.preventDefault();
      if (!file) { setUploadMsg({ text: "Vui lòng chọn file Excel!", type: "error" }); return; }
      setUploading(true); setUploadMsg({ text: "", type: "" });
      const formData = new FormData();
      formData.append('file', file);
      try {
          const res = await fetch('http://localhost:8080/api/manager/import-staff', { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Lỗi upload");
          setUploadMsg({ text: data.message || data.message, type: "success" });
          if (data.drafts && data.drafts.length > 0) {
              setImportPreview(data.drafts);
          }
          setFile(null);
          document.getElementById('fileInput').value = '';
      } catch (err) { setUploadMsg({ text: err.message, type: "error" }); }
      setUploading(false);
  };

  const handleConfirmImport = async () => {
      if (!importPreview || importPreview.length === 0) return;
      setUploading(true);
      try {
          const draftIds = importPreview.map(d => d.id);
          const res = await fetch(`${API}/manager/import-excel/confirm`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(draftIds)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Lỗi xác nhận");
          setUploadMsg({ text: data.message, type: "success" });
          setImportPreview(null);
          load();
      } catch (err) {
          setUploadMsg({ text: err.message, type: "error" });
      }
      setUploading(false);
  };

  const handleCancelImport = async () => {
      if (!importPreview || importPreview.length === 0) return;
      setUploading(true);
      try {
          const draftIds = importPreview.map(d => d.id);
          const res = await fetch(`${API}/manager/import-excel/cancel`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(draftIds)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Lỗi hủy thao tác");
          setUploadMsg({ text: data.message, type: "info" });
          setImportPreview(null);
      } catch (err) {
          setUploadMsg({ text: err.message, type: "error" });
      }
      setUploading(false);
  };


  const load = async () => {
    const data = await fetch(`${API}/manager/staff-list`).then(r => r.json()).catch(() => []);
    setStaff(Array.isArray(data) ? data.filter(u => u.role === "STAFF" || u.role === "ACCOUNTANT") : []);
  };
  useEffect(() => { load(); }, []);

  const loadSchedule = useCallback(async () => {
    if (!selectedStaffForSchedule) return;
    const m = scheduleMonth.getMonth() + 1;
    const y = scheduleMonth.getFullYear();
    try {
      const data = await fetch(`${API}/manager/assignments?month=${m}&year=${y}`).then(r => r.json());
      if (Array.isArray(data)) {
        setStaffAssignments(
          data.filter(a => (a.user?.id === selectedStaffForSchedule.id) || (a.userId === selectedStaffForSchedule.id))
        );
      } else {
        setStaffAssignments([]);
      }
    } catch (e) {
      setStaffAssignments([]);
    }
  }, [selectedStaffForSchedule, scheduleMonth]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

    const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (!draft.fullName) {
        setDraftMsg({ text: "Họ tên là bắt buộc!", type: "error" }); return;
    }
    setDrafting(true); setDraftMsg({ text: "", type: "" });
    try {
        const res = await fetch(`${API}/manager/add-staff-draft`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draft),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Lỗi tạo bản nháp");
        setDraftMsg({ text: data.message, type: "success" });
        setDraft(EMPTY_DRAFT);
    } catch(err) {
        setDraftMsg({ text: err.message, type: "error" });
    }
    setDrafting(false);
  };

  const save = async () => {
    try {
      const res = await fetch(`${API}/manager/update-staff/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      setMsg({ text: "Cập nhật thành công!", type: "success" });
      setEditing(null);
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  const parseDateForSort = (dateStr) => {
    if (!dateStr || !dateStr.includes("/")) return 0;
    const [d, m, y] = dateStr.split("/");
    return new Date(`${y}-${m}-${d}`).getTime();
  };

  const filteredAndSortedStaff = staff
    .filter(s => (s.fullName || "").toLowerCase().includes(searchName.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "NAME_ASC") return (a.fullName || "").localeCompare(b.fullName || "");
      if (sortBy === "DATE_DESC") return parseDateForSort(b.workDays) - parseDateForSort(a.workDays);
      if (sortBy === "DATE_ASC") return parseDateForSort(a.workDays) - parseDateForSort(b.workDays);
      if (sortBy === "SALARY_DESC") return (b.salary || 0) - (a.salary || 0);
      if (sortBy === "SALARY_ASC") return (a.salary || 0) - (b.salary || 0);
      return 0;
    });

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} /> <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><Upload size={18} color="var(--accent)" />Import nhân viên từ Excel</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Chọn file Excel (.xlsx hoặc .xls) có cấu trúc: <strong>Họ tên, Email, Vai trò, Lương cơ bản, Ngày bắt đầu</strong>
          </p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input id="fileInput" type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} disabled={uploading || importPreview} style={{background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px'}} />
              {!importPreview && (
                  <button type="submit" className="btn-primary" style={{ width: 'fit-content' }} disabled={uploading}>
                      {uploading ? "Đang tải lên..." : <><Upload size={18} />Upload file Excel</>}
                  </button>
              )}
              {uploadMsg.text && <div className={`alert ${uploadMsg.type}`}>{uploadMsg.text}</div>}
          </form>

          {importPreview && importPreview.length > 0 && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} color="var(--warning)" />
                      Thông tin nhân viên chuẩn bị import ({importPreview.length})
                  </h4>
                  <div className="table-wrap" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                      <table>
                          <thead>
                              <tr>
                                  <th>Mã NV (Tạm)</th>
                                  <th>Họ tên</th>
                                  <th>Vai trò</th>
                                  <th>Email</th>
                                  <th>Lương</th>
                              </tr>
                          </thead>
                          <tbody>
                              {importPreview.map(d => (
                                  <tr key={d.id}>
                                      <td><strong>{d.username}</strong></td>
                                      <td>{d.fullName}</td>
                                      <td>{d.role === 'ACCOUNTANT' ? 'Kế toán' : 'Nhân viên'}</td>
                                      <td>{d.email || "—"}</td>
                                      <td>{d.salary?.toLocaleString()}đ</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-primary" onClick={handleConfirmImport} disabled={uploading}>
                          <Check size={18} /> Xác nhận gửi cho Admin
                      </button>
                      <button className="btn-reject" onClick={handleCancelImport} disabled={uploading}>
                          <X size={18} /> Hủy thao tác
                      </button>
                  </div>
              </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><PlusCircle size={18} color="var(--accent)" />Thêm nhân viên thủ công (Chờ Admin duyệt)</div>
            <button className="btn-cancel-sm" onClick={() => setShowDraftForm(!showDraftForm)}>
                {showDraftForm ? "Ẩn form" : "Mở form"}
            </button>
          </div>
          {showDraftForm && (
            <form onSubmit={handleCreateDraft}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Họ tên *</label>
                        <input value={draft.fullName} onChange={e => setDraft({ ...draft, fullName: e.target.value })} placeholder="Nguyễn Văn Sáng" />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={draft.email || ""} onChange={e => setDraft({ ...draft, email: e.target.value })} placeholder="example@email.com" />
                    </div>
                    <div className="form-group">
                        <label>Vai trò</label>
                        <select value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value })}>
                            <option value="STAFF">Nhân viên</option>
                            <option value="ACCOUNTANT">Kế toán</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Lương cơ bản</label>
                        <input type="number" value={draft.salary} onChange={e => setDraft({ ...draft, salary: e.target.value })} placeholder="15000000" />
                    </div>

                    <div className="form-group">
                        <label>Ngày bắt đầu</label>
                        <input type="date" value={toInputDate(draft.workDays)} onChange={e => setDraft({ ...draft, workDays: toBackendDate(e.target.value) })} />
                    </div>
                </div>
                <button type="submit" className="btn-primary" disabled={drafting}>
                    {drafting ? "Đang gửi..." : <><CheckCircle size={16} />Gửi yêu cầu duyệt</>}
                </button>
                {draftMsg.text && <div className={`alert ${draftMsg.type}`} style={{marginTop: 10}}>{draftMsg.text}</div>}
            </form>
          )}
        </div>

      <div className="card">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><Users size={18} color="var(--accent)" />Danh sách nhân viên ({filteredAndSortedStaff.length})</span>
          <div style={{ display: "flex", gap: "10px", fontWeight: "normal", fontSize: "14px" }}>
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên..." 
              value={searchName} 
              onChange={e => setSearchName(e.target.value)} 
              style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "6px", width: "200px" }}
            />
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "6px" }}
            >
              <option value="NAME_ASC">Tên (A-Z)</option>
              <option value="DATE_DESC">Ngày bắt đầu (Gần nhất)</option>
              <option value="DATE_ASC">Ngày bắt đầu (Xa nhất)</option>
              <option value="SALARY_DESC">Lương (Cao đến thấp)</option>
              <option value="SALARY_ASC">Lương (Thấp đến cao)</option>
            </select>
          </div>
        </div>
        {editing && (
          <div className="card" style={{ background: "var(--surface2)", marginBottom: 16 }}>
            <div className="card-title"><Edit size={16} color="var(--accent)" />Chỉnh sửa: {editing.fullName}</div>
            <div className="form-row">
              <div className="form-group">
                <label>Họ tên</label>
                <input value={editing.fullName || ""} onChange={e => setEditing({ ...editing, fullName: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Lương cơ bản</label>
                <input type="number" value={editing.salary || ""} onChange={e => setEditing({ ...editing, salary: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={editing.status || "ACTIVE"} onChange={e => setEditing({ ...editing, status: e.target.value })}>
                  <option value="ACTIVE">Đang làm</option>
                  <option value="ON_LEAVE">Nghỉ phép</option>
                  <option value="RESIGNED">Đã nghỉ việc</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={save}>Lưu</button>
              <button className="btn-reject" onClick={() => setEditing(null)}>Hủy</button>
            </div>
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Ngày bắt đầu</th><th>Lương CB</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {filteredAndSortedStaff.map(s => (
                <tr key={s.id}>
                  <td>
                    <strong 
                      style={{ cursor: "pointer", color: "var(--accent)" }} 
                      onClick={() => setSelectedStaffForSchedule(s)}
                      title="Nhấn để xem lịch làm việc"
                    >
                      {s.fullName}
                    </strong>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{s.username}</td>

                  <td style={{ fontSize: 12 }}>{s.workDays || "—"}</td>
                  <td>{s.salary ? fmtMoney(s.salary) : "—"}</td>
                  <td><span className={`badge ${(s.status || "active").toLowerCase().replace("_", "-")}`}>
                    {STATUS_LABEL[s.status] || s.status || "—"}
                  </span></td>
                  <td><button className="btn-resolve" onClick={() => setEditing({ ...s })}><Edit size={16} color="var(--accent)" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStaffForSchedule && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Lịch làm việc: {selectedStaffForSchedule.fullName}</h3>
              <button className="btn-close" onClick={() => setSelectedStaffForSchedule(null)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <button className="btn-secondary" onClick={() => setScheduleMonth(new Date(scheduleMonth.getFullYear(), scheduleMonth.getMonth() - 1, 1))}>Tháng trước</button>
                <h4 style={{ margin: 0 }}>Tháng {scheduleMonth.getMonth() + 1}/{scheduleMonth.getFullYear()}</h4>
                <button className="btn-secondary" onClick={() => setScheduleMonth(new Date(scheduleMonth.getFullYear(), scheduleMonth.getMonth() + 1, 1))}>Tháng sau</button>
              </div>
              <div className="table-wrap" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Ca làm</th>
                      <th>Vị trí</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffAssignments.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>Không có ca làm việc nào trong tháng này</td></tr>
                    ) : (
                      staffAssignments.map(a => (
                        <tr key={a.id}>
                          <td>{a.workDate || "—"}</td>
                          <td>{a.shift?.shiftName || "—"}</td>
                          <td>{POSITION_LABEL[a.position] || a.position || "—"}</td>
                          <td><span className={`badge ${(a.status || "").toLowerCase().replace("_", "-")}`}>{ASSIGNMENT_STATUS_LABEL[a.status] || STATUS_LABEL[a.status] || a.status || "—"}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ROOT DASHBOARD ──────────────────────────────────────────
export default function ManagerDashboard({ user, onLogout }) {
  const [tab, setTab]     = useState("overview");
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);

  const loadStats = useCallback(async () => {
    const data = await fetch(`${API}/manager/stats`).then(r => r.json()).catch(() => ({}));
    setStats(data);
  }, []);

  const loadAlerts = useCallback(async () => {
    const data = await fetch(`${API}/manager/alerts/missing-staff`).then(r => r.json()).catch(() => []);
    setAlerts(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadStats();
    loadAlerts();
    // Poll cảnh báo mỗi 30s
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [loadStats, loadAlerts]);

  const navItems = [
    { id: "overview",  icon: <Home size={18} />, label: "Tổng quan" },
    { id: "staff",     icon: <Users size={18} />, label: "Nhân viên" },
    { id: "shifts",    icon: <CalendarDays size={18} />, label: "Phân ca" },
    { id: "requests",  icon: <FileText size={18} />, label: "Duyệt đơn", count: stats.pendingRequests },
    { id: "incidents", icon: <AlertTriangle size={18} />, label: "Sự cố",     count: stats.pendingIncidents },
    { id: "report",    icon: <BarChart3 size={18} />, label: "Báo cáo" },
  ];

  const pageTitles = {
    overview:  { title: "Tổng quan",       sub: "Chào mừng trở lại, " + user.fullName },
    shifts:    { title: "Phân ca làm việc", sub: "Xếp lịch và quản lý ca trực" },
    requests:  { title: "Duyệt đơn",       sub: "Đơn xin nghỉ và đổi ca chờ phê duyệt" },
    incidents: { title: "Báo cáo sự cố",   sub: "Xử lý sự cố từ nhân viên" },
    report:    { title: "Báo cáo vận hành", sub: "Thống kê ca trực, vắng mặt, sự cố" },
    staff:     { title: "Quản lý nhân viên", sub: "Xem và chỉnh sửa thông tương tự nhân viên" },
  };

  return (
    <div className="mgr-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', padding: '0 16px 24px' }}>
          <UserProfile user={user} onLogout={onLogout} />
          <h2 style={{ marginLeft: 8 }}>Quản Lý</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.count > 0 && <span className="badge-count">{item.count}</span>}
            </button>
          ))}
        </nav>
        <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>{pageTitles[tab].title}</h1>
          <p>{pageTitles[tab].sub}</p>
        </div>

        {tab === "overview"  && <OverviewSection stats={stats} alerts={alerts} onRefreshAlerts={loadAlerts} />}
        { tab === "shifts"    && <ShiftSection />}
        { tab === "requests"  && <RequestSection onUpdate={loadStats} />}
        { tab === "incidents" && <IncidentSection onUpdate={loadStats} />}
        { tab === "report"    && <ReportSection />}
        { tab === "staff"     && <StaffSection />}
      </main>
    </div>
  );
}
