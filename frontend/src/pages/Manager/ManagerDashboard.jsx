// src/pages/manager/ManagerDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import "./ManagerDashboard.css";
import { AlertTriangle, Banknote, BarChart2, BarChart3, CalendarDays, Car, Check, CheckCircle, ClipboardList, Edit, FileText, Home, Inbox, PartyPopper, PlusCircle, RefreshCw, Sun, Ticket, Users , Upload, Download, X} from "lucide-react";

const API = "http://localhost:8080/api";

function fmt(v) { if (!v) return "—"; return new Date(v).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
function fmtDate(v) { if (!v) return "—"; return new Date(v + "T00:00").toLocaleDateString("vi-VN"); }
function fmtMoney(v) { return (v || 0).toLocaleString("vi-VN") + " ₫"; }

function Alert({ msg, type }) {
  if (!msg) return null;
  return <div className={`alert ${type}`}>{msg}</div>;
}

// ── 1. TỔNG QUAN ───────────────────────────────────────────
function OverviewSection({ stats, alerts, onRefreshAlerts }) {
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

      {alerts.length > 0 && (
        <div className="absent-banner">
          <h4><AlertTriangle size={16} color="var(--accent)" /> Cảnh báo vắng mặt — {alerts.length} nhân viên chưa check-in</h4>
          {alerts.map((a, i) => (
            <div className="absent-item" key={i}>
              <strong>{a.staffName}</strong> · {a.shiftName} bắt đầu {a.startTime} — {a.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="btn-primary" onClick={onRefreshAlerts} style={{ fontSize: 12, padding: "7px 14px" }}>
          <RefreshCw size={16} color="var(--accent)" /> Kiểm tra vắng mặt
        </button>
      </div>
    </div>
  );
}

// ── 2. PHÂN CA ─────────────────────────────────────────────
function ShiftSection() {
  const [staff, setStaff]       = useState([]);
  const [shifts, setShifts]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm]         = useState({ userId: "", shiftId: "", workDate: new Date().toISOString().slice(0, 10), position: "XEP_XE" });
  const [msg, setMsg]           = useState({ text: "", type: "" });

  const load = useCallback(async () => {
    const [staffRes, shiftRes, assignRes] = await Promise.all([
      fetch(`${API}/manager/staff-list`).then(r => r.json()).catch(() => []),
      fetch(`${API}/manager/shifts`).then(r => r.json()).catch(() => []),
      fetch(`${API}/manager/assignments?date=${date}`).then(r => r.json()).catch(() => []),
    ]);
    setStaff(Array.isArray(staffRes) ? staffRes.filter(u => u.role === "STAFF") : []);
    setShifts(Array.isArray(shiftRes) ? shiftRes : []);
    setAssignments(Array.isArray(assignRes) ? assignRes : []);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async () => {
    if (!form.userId || !form.shiftId || !form.workDate) {
      setMsg({ text: "Vui lòng chọn đủ nhân viên, ca và ngày!", type: "error" }); return;
    }
    try {
      const res = await fetch(`${API}/manager/assign-shift`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(form.userId), shiftId: Number(form.shiftId), workDate: form.workDate, position: form.position }),
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

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <div className="card-title"><PlusCircle size={18} color="var(--accent)" /> Phân ca mới</div>
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
            <label>Ngày làm</label>
            <input type="date" value={form.workDate} onChange={e => setForm({ ...form, workDate: e.target.value })} />
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

      <div className="card">
        <div className="card-title"><ClipboardList size={18} color="var(--accent)" /> Lịch phân ca ngày</div>
        <div className="date-filter">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        {assignments.length === 0 ? (
          <div className="empty-state"><div className="emoji" style={{color: "var(--accent)"}}><Inbox size={48} /></div>Không có ca nào ngày này</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nhân viên</th><th>Ca</th><th>Giờ</th><th>Vị trí</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.user?.fullName}</strong></td>
                    <td>{a.shift?.shiftName}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{a.shift?.startTime} – {a.shift?.endTime}</td>
                    <td>{a.position === "KIEM_SOAT_VE" ? <><Ticket size={16} color="var(--accent)" /> Kiểm soát vé</> : <><Car size={16} color="var(--accent)" /> Xếp xe</>}</td>
                    <td><span className={`badge ${(a.status || "").toLowerCase()}`}>{a.status}</span></td>
                    <td><button className="btn-icon" onClick={() => handleDelete(a.id)}><X size={16} color="var(--accent)" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 3. DUYỆT ĐƠN ───────────────────────────────────────────
function RequestSection() {
  const [requests, setRequests] = useState([]);
  const [msg, setMsg]           = useState({ text: "", type: "" });

  const load = async () => {
    const data = await fetch(`${API}/manager/leave-requests`).then(r => r.json()).catch(() => []);
    setRequests(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const review = async (id, approved) => {
    try {
      const res = await fetch(`${API}/manager/leave-requests/${id}/approve?isApproved=${approved}`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi");
      setMsg({ text: `${data.message}${data.detail ? " " + data.detail : ""}`, type: "success" });
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <div className="card-title"><FileText size={18} color="var(--accent)" /> Đơn chờ duyệt ({requests.length})</div>
        {requests.length === 0 ? (
          <div className="empty-state"><div className="emoji"><CheckCircle size={16} color="var(--accent)" /></div>Không có đơn nào đang chờ</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nhân viên</th><th>Loại</th><th>Ngày</th><th>Lý do</th><th>Người thay</th><th></th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.user?.fullName}</strong><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.user?.username}</div></td>
                    <td>{r.requestType === "LEAVE" ? <><Sun size={16} color="var(--accent)" /> Nghỉ phép</> : <><RefreshCw size={16} color="var(--accent)" /> Đổi ca</>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.targetDate)}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason}</td>
                    <td>{r.substituteUser?.fullName || "—"}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn-approve" onClick={() => review(r.id, true)}><Check size={16} color="var(--accent)" /> Duyệt</button>
                      <button className="btn-reject"  onClick={() => review(r.id, false)}><X size={16} color="var(--accent)" /> Từ chối</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 4. SỰ CỐ ───────────────────────────────────────────────
function IncidentSection() {
  const [incidents, setIncidents] = useState([]);
  const [msg, setMsg]             = useState({ text: "", type: "" });

  const load = async () => {
    const data = await fetch(`${API}/manager/incidents`).then(r => r.json()).catch(() => []);
    setIncidents(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id) => {
    try {
      const res = await fetch(`${API}/manager/incidents/${id}/resolve`, { method: "PUT" });
      if (!res.ok) throw new Error("Lỗi xử lý");
      setMsg({ text: "Đã đánh dấu xử lý xong!", type: "success" });
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <div className="card-title"><AlertTriangle size={18} color="var(--accent)" /> Sự cố chờ xử lý ({incidents.length})</div>
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
                    <td><span className={`badge ${inc.status?.toLowerCase()}`}>{inc.status === "PENDING" ? "Chờ xử lý" : "Đã xử lý"}</span></td>
                    <td>
                      {inc.status === "PENDING" && (
                        <button className="btn-resolve" onClick={() => resolve(inc.id)}><Check size={16} color="var(--accent)" /> Xử lý</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 5. BÁO CÁO VẬN HÀNH ───────────────────────────────────────
function ReportSection() {
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  
  const load = useCallback(async () => {
    const s = await fetch(`${API}/manager/stats`).then(r => r.json()).catch(() => ({}));
    setStats(s);
    const a = await fetch(`${API}/manager/alerts/missing-staff`).then(r => r.json()).catch(() => []);
    setAlerts(Array.isArray(a) ? a : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="card-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ background: "var(--surface2)", border: "1px solid var(--accent)", borderRadius: 10 }}>
          <div className="card-title" style={{ color: "var(--accent)" }}><FileText size={18} /> Đơn xin nghỉ chờ duyệt</div>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>{stats.pendingRequests || 0}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Nhân viên đang chờ phê duyệt đổi ca/xin phép</div>
        </div>
        <div className="card" style={{ background: "var(--surface2)", border: "1px solid var(--danger)", borderRadius: 10 }}>
          <div className="card-title" style={{ color: "var(--danger)" }}><AlertTriangle size={18} /> Sự cố chưa giải quyết</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--danger)" }}>{stats.pendingIncidents || 0}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Báo cáo từ nhân viên cần xử lý ngay</div>
        </div>
      </div>
      
      <div className="card-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ background: "var(--surface2)", border: "1px solid var(--success)", borderRadius: 10 }}>
          <div className="card-title" style={{ color: "var(--success)" }}><CalendarDays size={18} /> Phân ca hôm nay</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--success)" }}>{stats.todayAssignments || 0}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Lượt nhân viên được phân công làm việc hôm nay</div>
        </div>
        <div className="card" style={{ background: "var(--surface2)", border: "1px solid var(--warning)", borderRadius: 10 }}>
          <div className="card-title" style={{ color: "var(--warning)" }}><Users size={18} /> Vắng mặt / Chưa check-in</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--warning)" }}>{alerts.length}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Nhân viên đã đến giờ ca làm nhưng chưa check-in</div>
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

  const EMPTY_DRAFT = { fullName: "", username: "", email: "", position: "", salary: "", workShift: "", workDays: "", role: "STAFF" };
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [draftMsg, setDraftMsg] = useState({ text: "", type: "" });
  const [drafting, setDrafting] = useState(false);

  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState({ text: "", type: "" });
  const [uploading, setUploading] = useState(false);

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
          setUploadMsg({ text: data.message, type: "success" });
          setFile(null);
          document.getElementById('fileInput').value = '';
          load();
      } catch (err) { setUploadMsg({ text: err.message, type: "error" }); }
      setUploading(false);
  };


  const load = async () => {
    const data = await fetch(`${API}/manager/staff-list`).then(r => r.json()).catch(() => []);
    setStaff(Array.isArray(data) ? data.filter(u => u.role === "STAFF" || u.role === "ACCOUNTANT") : []);
  };
  useEffect(() => { load(); }, []);

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (!draft.fullName || !draft.username) {
        setDraftMsg({ text: "Họ tên và Username là bắt buộc!", type: "error" }); return;
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

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><Upload size={18} color="var(--accent)" /> Import nhân viên từ Excel</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Chọn file Excel (.xlsx hoặc .xls) có cấu trúc: <strong>Họ tên, Username, Email, Lương, Ca làm, Ngày làm</strong>
          </p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input id="fileInput" type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} disabled={uploading} style={{background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px'}} />
              <button type="submit" className="btn-primary" style={{ width: 'fit-content' }} disabled={uploading}>
                  {uploading ? "Đang tải lên..." : <><Upload size={18} color="var(--accent)" /> Upload và lưu hồ sơ</>}
              </button>
              {uploadMsg.text && <div className={`alert ${uploadMsg.type}`}>{uploadMsg.text}</div>}
          </form>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div><PlusCircle size={18} color="var(--accent)" /> Thêm nhân viên thủ công (Chờ Admin duyệt)</div>
            <button className="btn-cancel-sm" onClick={() => setShowDraftForm(!showDraftForm)}>
                {showDraftForm ? "Ẩn form" : "Mở form"}
            </button>
          </div>
          {showDraftForm && (
            <form onSubmit={handleCreateDraft}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Họ tên *</label>
                        <input value={draft.fullName} onChange={e => setDraft({ ...draft, fullName: e.target.value })} placeholder="Nguyễn Văn A" />
                    </div>
                    <div className="form-group">
                        <label>Tài khoản *</label>
                        <input value={draft.username} onChange={e => setDraft({ ...draft, username: e.target.value })} placeholder="username" />
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
                        <label>Nhiệm vụ</label>
                        <input value={draft.position} onChange={e => setDraft({ ...draft, position: e.target.value })} placeholder="VD: Nhân viên bãi 1, Kế toán trưởng..." />
                    </div>
                    <div className="form-group">
                        <label>Lương cơ bản</label>
                        <input type="number" value={draft.salary} onChange={e => setDraft({ ...draft, salary: e.target.value })} placeholder="15000000" />
                    </div>
                    <div className="form-group">
                        <label>Ca mặc định</label>
                        <select value={draft.workShift} onChange={e => setDraft({ ...draft, workShift: e.target.value })}>
                            <option value="">-- Chọn ca --</option>
                            <option value="SHIFT 1">Ca Sáng (6h - 14h)</option>
                            <option value="SHIFT 2">Ca Chiều (14h - 22h)</option>
                            <option value="SHIFT 3">Ca Đêm (22h - 6h)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Ngày làm</label>
                        <input value={draft.workDays} onChange={e => setDraft({ ...draft, workDays: e.target.value })} placeholder="Monday,Tuesday..." />
                    </div>
                </div>
                <button type="submit" className="btn-primary" disabled={drafting}>
                    {drafting ? "Đang gửi..." : <><CheckCircle size={16} color="var(--accent)" /> Gửi yêu cầu duyệt</>}
                </button>
                {draftMsg.text && <div className={`alert ${draftMsg.type}`} style={{marginTop: 10}}>{draftMsg.text}</div>}
            </form>
          )}
        </div>

      <div className="card">
        <div className="card-title"><Users size={18} color="var(--accent)" /> Danh sách nhân viên ({staff.length})</div>
        {editing && (
          <div className="card" style={{ background: "var(--surface2)", marginBottom: 16 }}>
            <div className="card-title"><Edit size={16} color="var(--accent)" /> Chỉnh sửa: {editing.fullName}</div>
            <div className="form-row">
              <div className="form-group">
                <label>Họ tên</label>
                <input value={editing.fullName || ""} onChange={e => setEditing({ ...editing, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Nhiệm vụ</label>
                <input value={editing.position || ""} onChange={e => setEditing({ ...editing, position: e.target.value })} />
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
            <thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Nhiệm vụ</th><th>Ca</th><th>Ngày làm</th><th>Lương CB</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.fullName}</strong></td>
                  <td style={{ color: "var(--text-muted)" }}>{s.username}</td>
                  <td>{s.position || "—"}</td>
                  <td>{s.workShift || "—"}</td>
                  <td style={{ fontSize: 12 }}>{s.workDays || "—"}</td>
                  <td>{s.salary ? fmtMoney(s.salary) : "—"}</td>
                  <td><span className={`badge ${(s.status || "active").toLowerCase().replace("_", "-")}`}>
                    {s.status === "ACTIVE" ? "Đang làm" : s.status === "ON_LEAVE" ? "Nghỉ phép" : s.status || "—"}
                  </span></td>
                  <td><button className="btn-resolve" onClick={() => setEditing({ ...s })}><Edit size={16} color="var(--accent)" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
        <div className="sidebar-logo">
          <h2>Quản Lý</h2>
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
        {tab === "shifts"    && <ShiftSection />}
        { tab === "requests"  && <RequestSection /> }
        { tab === "incidents" && <IncidentSection /> }
        { tab === "report"    && <ReportSection /> }
        { tab === "staff"     && <StaffSection /> }
      </main>
    </div>
  );
}
