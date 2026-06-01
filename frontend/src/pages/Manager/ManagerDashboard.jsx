// src/pages/manager/ManagerDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import "./ManagerDashboard.css";

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
          <div className="stat-icon blue">👥</div>
          <div><div className="stat-label">Tổng nhân viên</div><div className="stat-value">{stats.totalStaff ?? "—"}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">📝</div>
          <div><div className="stat-label">Đơn chờ duyệt</div><div className="stat-value">{stats.pendingRequests ?? "—"}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🚨</div>
          <div><div className="stat-label">Sự cố chờ xử lý</div><div className="stat-value">{stats.pendingIncidents ?? "—"}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📅</div>
          <div><div className="stat-label">Ca hôm nay</div><div className="stat-value">{stats.todayAssignments ?? "—"}</div></div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="absent-banner">
          <h4>⚠️ Cảnh báo vắng mặt — {alerts.length} nhân viên chưa check-in</h4>
          {alerts.map((a, i) => (
            <div className="absent-item" key={i}>
              <strong>{a.staffName}</strong> · {a.shiftName} bắt đầu {a.startTime} — {a.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="btn-primary" onClick={onRefreshAlerts} style={{ fontSize: 12, padding: "7px 14px" }}>
          🔄 Kiểm tra vắng mặt
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
      setMsg({ text: `✅ ${data.message}`, type: "success" });
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
        <div className="card-title">➕ Phân ca mới</div>
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
        <div className="card-title">📋 Lịch phân ca ngày</div>
        <div className="date-filter">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        {assignments.length === 0 ? (
          <div className="empty-state"><div className="emoji">📭</div>Không có ca nào ngày này</div>
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
                    <td>{a.position === "KIEM_SOAT_VE" ? "🎫 Kiểm soát vé" : "🚗 Xếp xe"}</td>
                    <td><span className={`badge ${(a.status || "").toLowerCase()}`}>{a.status}</span></td>
                    <td><button className="btn-icon" onClick={() => handleDelete(a.id)}>✕</button></td>
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
      setMsg({ text: `✅ ${data.message}${data.detail ? " " + data.detail : ""}`, type: "success" });
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <div className="card-title">📝 Đơn chờ duyệt ({requests.length})</div>
        {requests.length === 0 ? (
          <div className="empty-state"><div className="emoji">✅</div>Không có đơn nào đang chờ</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nhân viên</th><th>Loại</th><th>Ngày</th><th>Lý do</th><th>Người thay</th><th></th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.user?.fullName}</strong><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.user?.username}</div></td>
                    <td>{r.requestType === "LEAVE" ? "🏖️ Nghỉ phép" : "🔄 Đổi ca"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.targetDate)}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason}</td>
                    <td>{r.substituteUser?.fullName || "—"}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn-approve" onClick={() => review(r.id, true)}>✓ Duyệt</button>
                      <button className="btn-reject"  onClick={() => review(r.id, false)}>✕ Từ chối</button>
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
      setMsg({ text: "✅ Đã đánh dấu xử lý xong!", type: "success" });
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <div className="card-title">🚨 Sự cố chờ xử lý ({incidents.length})</div>
        {incidents.length === 0 ? (
          <div className="empty-state"><div className="emoji">✅</div>Không có sự cố nào</div>
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
                        <button className="btn-resolve" onClick={() => resolve(inc.id)}>✓ Xử lý</button>
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

// ── 5. BÁO CÁO NHÂN SỰ ─────────────────────────────────────
function ReportSection() {
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [late, setLate]     = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [repRes, lateRes] = await Promise.all([
        fetch(`${API}/manager/attendance`).then(r => r.json()).catch(() => null),
        fetch(`${API}/manager/reports/late`).then(r => r.json()).catch(() => []),
      ]);
      setReport(repRes);
      setLate(Array.isArray(lateRes) ? lateRes : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, []);

  return (
    <div>
      <div className="card-row">
        <div className="card">
          <div className="card-title">📊 Nhân viên đi trễ ({late.length})</div>
          {late.length === 0 ? (
            <div className="empty-state"><div className="emoji">🎉</div>Không có ai đi trễ</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nhân viên</th><th>Ngày</th><th>Phí phạt</th></tr></thead>
                <tbody>
                  {late.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.date}</td>
                      <td className="negative">{fmtMoney(r.penalty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">💰 Bảng tính lương</div>
          <SalaryTable />
        </div>
      </div>
    </div>
  );
}

function SalaryTable() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch(`${API}/manager/calculate-salaries`).then(r => r.json()).then(d => setData(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  if (data.length === 0) return <div className="empty-state"><div className="emoji">📭</div>Chưa có dữ liệu</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Nhân viên</th><th>Ca</th><th>Lương ca</th><th>Phạt</th><th>Thực nhận</th></tr></thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <td><strong>{r.name}</strong></td>
              <td>{r.shifts}</td>
              <td className="positive">{fmtMoney(r.pay)}</td>
              <td className="negative">{r.penalty > 0 ? fmtMoney(r.penalty) : "—"}</td>
              <td><strong className="positive">{fmtMoney(r.final)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 6. DANH SÁCH NHÂN VIÊN ─────────────────────────────────
function StaffSection() {
  const [staff, setStaff] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const load = async () => {
    const data = await fetch(`${API}/manager/staff-list`).then(r => r.json()).catch(() => []);
    setStaff(Array.isArray(data) ? data.filter(u => u.role === "STAFF") : []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const res = await fetch(`${API}/manager/update-staff/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      setMsg({ text: "✅ Cập nhật thành công!", type: "success" });
      setEditing(null);
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <div className="card-title">👥 Danh sách nhân viên ({staff.length})</div>
        {editing && (
          <div className="card" style={{ background: "var(--surface2)", marginBottom: 16 }}>
            <div className="card-title">✏️ Chỉnh sửa: {editing.fullName}</div>
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
            <thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Ca</th><th>Ngày làm</th><th>Lương CB</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.fullName}</strong></td>
                  <td style={{ color: "var(--text-muted)" }}>{s.username}</td>
                  <td>{s.workShift || "—"}</td>
                  <td style={{ fontSize: 12 }}>{s.workDays || "—"}</td>
                  <td>{s.salary ? fmtMoney(s.salary) : "—"}</td>
                  <td><span className={`badge ${(s.status || "active").toLowerCase().replace("_", "-")}`}>
                    {s.status === "ACTIVE" ? "Đang làm" : s.status === "ON_LEAVE" ? "Nghỉ phép" : s.status || "—"}
                  </span></td>
                  <td><button className="btn-resolve" onClick={() => setEditing({ ...s })}>✏️</button></td>
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
    { id: "overview",  icon: "🏠", label: "Tổng quan" },
    { id: "shifts",    icon: "📅", label: "Phân ca" },
    { id: "requests",  icon: "📝", label: "Duyệt đơn", count: stats.pendingRequests },
    { id: "incidents", icon: "🚨", label: "Sự cố",     count: stats.pendingIncidents },
    { id: "report",    icon: "📊", label: "Báo cáo" },
    { id: "staff",     icon: "👥", label: "Nhân viên" },
  ];

  const pageTitles = {
    overview:  { title: "Tổng quan",       sub: "Chào mừng trở lại, " + user.fullName },
    shifts:    { title: "Phân ca làm việc", sub: "Xếp lịch và quản lý ca trực" },
    requests:  { title: "Duyệt đơn",       sub: "Đơn xin nghỉ và đổi ca chờ phê duyệt" },
    incidents: { title: "Báo cáo sự cố",   sub: "Xử lý sự cố từ nhân viên" },
    report:    { title: "Báo cáo nhân sự", sub: "Chuyên cần, đi trễ và bảng lương" },
    staff:     { title: "Quản lý nhân viên", sub: "Xem và chỉnh sửa thông tin nhân viên" },
  };

  return (
    <div className="mgr-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🚗 NhàXe</h2>
          <p>Quản lý nhà xe</p>
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
        <div className="sidebar-user">
          <div className="name">{user.fullName}</div>
          <span className="role-badge">Quản lý</span>
        </div>
        <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>{pageTitles[tab].title}</h1>
          <p>{pageTitles[tab].sub}</p>
        </div>

        {tab === "overview"  && <OverviewSection stats={stats} alerts={alerts} onRefreshAlerts={loadAlerts} />}
        {tab === "shifts"    && <ShiftSection />}
        {tab === "requests"  && <RequestSection />}
        {tab === "incidents" && <IncidentSection />}
        {tab === "report"    && <ReportSection />}
        {tab === "staff"     && <StaffSection />}
      </main>
    </div>
  );
}
