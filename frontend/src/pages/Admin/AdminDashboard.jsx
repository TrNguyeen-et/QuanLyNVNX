// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";

const API = "http://localhost:8080/api/admin";

function fmt(v) {
  if (!v) return "—";
  return new Date(v).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Alert({ msg, type }) {
  if (!msg) return null;
  return <div className={`alert ${type}`}>{msg}</div>;
}

const ROLE_LABEL  = { ADMIN: "Admin", MANAGER: "Quản lý", STAFF: "Nhân viên", HR: "Hành chính" };
const STATUS_LABEL = { ACTIVE: "Đang làm", ON_LEAVE: "Nghỉ phép", RESIGNED: "Đã nghỉ" };

// ── 1. TỔNG QUAN ──────────────────────────────────────────
function OverviewSection() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
    fetch(`${API}/users`).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const byRole = (role) => users.filter(u => u.role === role).length;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div><div className="stat-label">Tổng tài khoản</div><div className="stat-value">{stats.totalUsers ?? "—"}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🔐</div>
          <div><div className="stat-label">Admin / Quản lý</div><div className="stat-value">{byRole("ADMIN") + byRole("MANAGER")}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">👷</div>
          <div><div className="stat-label">Nhân viên</div><div className="stat-value">{byRole("STAFF")}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📊 Phân bố vai trò</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {["ADMIN", "MANAGER", "STAFF", "HR"].map(role => (
            <div key={role} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>
                {role === "ADMIN" ? "🔐" : role === "MANAGER" ? "📋" : role === "HR" ? "📁" : "👷"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{byRole(role)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{ROLE_LABEL[role] || role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 2. QUẢN LÝ TÀI KHOẢN ──────────────────────────────────
const EMPTY_FORM = { username: "", password: "", fullName: "", role: "STAFF", status: "ACTIVE", salary: "", workShift: "", workDays: "" };

function AccountSection() {
  const [users, setUsers]     = useState([]);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [search, setSearch]   = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [msg, setMsg]         = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const data = await fetch(`${API}/users`).then(r => r.json()).catch(() => []);
    setUsers(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flashMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); setMsg({ text: "", type: "" }); };
  const openEdit   = (u) => { setForm({ ...u, password: "" }); setEditingId(u.id); setShowForm(true); setMsg({ text: "", type: "" }); };
  const closeForm  = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async () => {
    if (!form.username || !form.fullName || !form.role) {
      setMsg({ text: "Vui lòng điền đủ Tài khoản, Họ tên và Vai trò!", type: "error" }); return;
    }
    if (!editingId && !form.password) {
      setMsg({ text: "Vui lòng nhập mật khẩu!", type: "error" }); return;
    }
    setLoading(true);
    try {
      if (editingId) {
        // Cập nhật
        const res = await fetch(`${API}/users/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Lỗi cập nhật");
        flashMsg("✅ Cập nhật tài khoản thành công!", "success");
      } else {
        // Tạo mới
        const res = await fetch(`${API}/create-account`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Lỗi tạo tài khoản");
        flashMsg(`✅ ${data.message} (ID: ${data.userId})`, "success");
      }
      closeForm();
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa tài khoản "${name}"? Hành động này không thể hoàn tác!`)) return;
    try {
      const res = await fetch(`${API}/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi xóa");
      flashMsg(`✅ ${data.message}`, "success");
      load();
    } catch (e) { flashMsg(e.message, "error"); }
  };

  const filtered = users.filter(u =>
    (filterRole ? u.role === filterRole : true) &&
    (search ? (u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())) : true)
  );

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "9px 12px", fontSize: 13, fontFamily: "var(--font)", flex: 1, minWidth: 180 }}
          placeholder="🔍 Tìm kiếm tên, tài khoản..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "9px 12px", fontSize: 13, fontFamily: "var(--font)" }}
          value={filterRole} onChange={e => setFilterRole(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Quản lý</option>
          <option value="STAFF">Nhân viên</option>
          <option value="HR">Hành chính</option>
        </select>
        <button className="btn-primary" onClick={openCreate}>+ Tạo tài khoản</button>
      </div>

      {/* Form tạo / sửa */}
      {showForm && (
        <div className="card" style={{ background: "var(--surface2)", marginBottom: 16, border: "1px solid var(--accent)" }}>
          <div className="card-title">{editingId ? "✏️ Chỉnh sửa tài khoản" : "➕ Tạo tài khoản mới"}</div>
          <div className="form-row">
            <div className="form-group">
              <label>Tài khoản *</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username" disabled={!!editingId} />
            </div>
            <div className="form-group">
              <label>{editingId ? "Mật khẩu mới (để trống = không đổi)" : "Mật khẩu *"}</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
            </div>
            <div className="form-group">
              <label>Họ và tên *</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Nguyễn Văn A" />
            </div>
            <div className="form-group">
              <label>Vai trò *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Quản lý</option>
                <option value="STAFF">Nhân viên</option>
                <option value="HR">Hành chính</option>
              </select>
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Đang làm</option>
                <option value="ON_LEAVE">Nghỉ phép</option>
                <option value="RESIGNED">Đã nghỉ</option>
              </select>
            </div>
            <div className="form-group">
              <label>Lương cơ bản</label>
              <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="15000000" />
            </div>
            <div className="form-group">
              <label>Ca mặc định</label>
              <select value={form.workShift} onChange={e => setForm({ ...form, workShift: e.target.value })}>
                <option value="">-- Chọn ca --</option>
                <option value="SHIFT 1">Ca Sáng (6h - 14h)</option>
                <option value="SHIFT 2">Ca Chiều (14h - 22h)</option>
                <option value="SHIFT 3">Ca Đêm (22h - 6h)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ngày làm (vd: Monday,Tuesday)</label>
              <input value={form.workDays} onChange={e => setForm({ ...form, workDays: e.target.value })} placeholder="Monday,Tuesday,Wednesday" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Đang lưu..." : editingId ? "💾 Lưu thay đổi" : "✅ Tạo tài khoản"}
            </button>
            <button className="btn-cancel-sm" onClick={closeForm}>Hủy</button>
          </div>
        </div>
      )}

      {/* Bảng tài khoản */}
      <div className="card">
        <div className="card-title">👥 Danh sách tài khoản ({filtered.length})</div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="emoji">🔍</div>Không tìm thấy tài khoản nào</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Tài khoản</th><th>Họ tên</th><th>Vai trò</th>
                  <th>Trạng thái</th><th>Ca</th><th>Lương CB</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>#{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.fullName}</td>
                    <td><span className={`badge ${u.role?.toLowerCase()}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                    <td><span className={`badge ${(u.status || "active").toLowerCase().replace("_", "-")}`}>{STATUS_LABEL[u.status] || u.status}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.workShift || "—"}</td>
                    <td style={{ fontSize: 12 }}>{u.salary ? Number(u.salary).toLocaleString("vi-VN") + " ₫" : "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn-edit" onClick={() => openEdit(u)}>✏️</button>
                      <button className="btn-del"  onClick={() => handleDelete(u.id, u.fullName)}>🗑</button>
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

// ── 3. AUDIT LOG ──────────────────────────────────────────
function LogSection() {
  const [logs, setLogs]     = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/logs`).then(r => r.json())
      .then(d => setLogs(Array.isArray(d) ? d : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.actor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="card">
        <div className="card-title">📋 Nhật ký hệ thống ({filtered.length})</div>
        <input
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "9px 12px", fontSize: 13, fontFamily: "var(--font)", width: "100%", marginBottom: 16 }}
          placeholder="🔍 Tìm kiếm hành động..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        {loading ? (
          <div className="loading">Đang tải log...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="emoji">📭</div>Chưa có log nào</div>
        ) : (
          <div className="log-list">
            {filtered.map(log => (
              <div className="log-item" key={log.id}>
                <div className="log-action">
                  <span style={{ marginRight: 8, fontSize: 14 }}>
                    {log.action?.startsWith("Tạo") ? "✅" : log.action?.startsWith("Xóa") ? "🗑" : log.action?.startsWith("Cập") ? "✏️" : log.action?.startsWith("Thay") ? "⚙️" : "📌"}
                  </span>
                  {log.action}
                </div>
                <div className="log-meta">
                  <div style={{ color: "var(--accent)", fontSize: 11 }}>{log.actor}</div>
                  <div>{fmt(log.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 4. CẤU HÌNH HỆ THỐNG ─────────────────────────────────
function ConfigSection() {
  const [configs, setConfigs] = useState([]);
  const [editing, setEditing] = useState({}); // { key: newValue }
  const [msg, setMsg] = useState({ text: "", type: "" });

  const load = async () => {
    const data = await fetch(`${API}/configs`).then(r => r.json()).catch(() => []);
    setConfigs(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (key) => {
    const newVal = editing[key];
    if (newVal === undefined) return;
    try {
      const res = await fetch(`${API}/configs/${key}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configValue: newVal }),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      setMsg({ text: `✅ Đã cập nhật cấu hình ${key}!`, type: "success" });
      const newEditing = { ...editing };
      delete newEditing[key];
      setEditing(newEditing);
      load();
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <div className="card-title">⚙️ Cấu hình hệ thống</div>
        <div className="alert info" style={{ marginBottom: 16 }}>
          💡 Thay đổi cấu hình tại đây sẽ áp dụng ngay lập tức mà không cần sửa code hoặc khởi động lại.
        </div>
        {configs.length === 0 ? (
          <div className="empty-state"><div className="emoji">⚙️</div>Không có cấu hình nào</div>
        ) : (
          configs.map(c => (
            <div className="config-item" key={c.configKey}>
              <div className="config-key">{c.configKey}</div>
              <div className="config-desc">{c.description}</div>
              <input
                className="config-input"
                value={editing[c.configKey] !== undefined ? editing[c.configKey] : (c.configValue || "")}
                onChange={e => setEditing({ ...editing, [c.configKey]: e.target.value })}
                type="number"
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6, marginRight: 8 }}>VNĐ</span>
              {editing[c.configKey] !== undefined && (
                <button className="btn-save" onClick={() => handleSave(c.configKey)}>Lưu</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── 5. SAO LƯU & PHỤC HỒI ────────────────────────────────
function BackupSection() {
  const [msg, setMsg]       = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [restoreData, setRestoreData] = useState("");

  const handleBackup = async () => {
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      const res  = await fetch(`${API}/backup`);
      const data = await res.json();
      if (!res.ok) throw new Error("Lỗi sao lưu");

      // Tải file JSON về máy
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMsg({ text: `✅ Sao lưu thành công! Tổng ${data.totalRecords || "?"} bản ghi.`, type: "success" });
    } catch (e) { setMsg({ text: e.message, type: "error" }); }
    setLoading(false);
  };

  const handleRestore = async () => {
    if (!restoreData.trim()) { setMsg({ text: "Vui lòng dán dữ liệu JSON vào ô bên dưới!", type: "error" }); return; }
    if (!confirm("⚠️ Phục hồi dữ liệu sẽ ghi đè lên dữ liệu hiện tại. Bạn chắc chắn?")) return;
    setLoading(true);
    try {
      const parsed = JSON.parse(restoreData);
      const users  = parsed.users || parsed; // hỗ trợ cả backup toàn bộ và chỉ users
      const res = await fetch(`${API}/restore`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi phục hồi");
      setMsg({ text: `✅ ${data.message}`, type: "success" });
      setRestoreData("");
    } catch (e) {
      setMsg({ text: e.message.includes("JSON") ? "File JSON không hợp lệ!" : e.message, type: "error" });
    }
    setLoading(false);
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />

      <div className="card">
        <div className="card-title">💾 Sao lưu dữ liệu</div>
        <div className="backup-info">
          Sao lưu toàn bộ dữ liệu hệ thống (tài khoản, ca làm, phân công, chấm công, đơn nghỉ, sự cố) thành file JSON và tải về máy.
        </div>
        <div className="backup-actions">
          <button className="btn-success" onClick={handleBackup} disabled={loading}>
            {loading ? "Đang xử lý..." : "📥 Tải file sao lưu (.json)"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">♻️ Phục hồi dữ liệu</div>
        <div className="backup-info">
          Dán nội dung file JSON (đã tải về trước đó) vào ô bên dưới rồi nhấn Phục hồi.
          <strong style={{ color: "var(--danger)" }}> Lưu ý: Thao tác này sẽ ghi đè dữ liệu hiện tại!</strong>
        </div>
        <textarea
          value={restoreData}
          onChange={e => setRestoreData(e.target.value)}
          placeholder='Dán nội dung file backup.json vào đây...'
          style={{ width: "100%", minHeight: 140, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: 12, fontSize: 13, fontFamily: "monospace", resize: "vertical", marginBottom: 12 }}
        />
        <button className="btn-danger" onClick={handleRestore} disabled={loading}>
          {loading ? "Đang phục hồi..." : "♻️ Phục hồi dữ liệu"}
        </button>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────
export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview");

  const navItems = [
    { id: "overview", icon: "🏠", label: "Tổng quan" },
    { id: "accounts", icon: "👥", label: "Tài khoản" },
    { id: "logs",     icon: "📋", label: "Nhật ký hệ thống" },
    { id: "configs",  icon: "⚙️", label: "Cấu hình" },
    { id: "backup",   icon: "💾", label: "Sao lưu & Phục hồi" },
  ];

  const pageTitles = {
    overview: { title: "Tổng quan hệ thống",      sub: "Chào mừng, " + user.fullName },
    accounts: { title: "Quản lý tài khoản",        sub: "Thêm, sửa, xóa và cấp quyền tài khoản" },
    logs:     { title: "Nhật ký hệ thống",         sub: "Ghi lại toàn bộ hành động trong hệ thống" },
    configs:  { title: "Cấu hình hệ thống",        sub: "Điều chỉnh các tham số như mức phạt, quy tắc..." },
    backup:   { title: "Sao lưu & Phục hồi",       sub: "Đảm bảo an toàn dữ liệu hệ thống" },
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🚗 NhàXe</h2>
          <p>Quản trị hệ thống</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="name">{user.fullName}</div>
          <span className="role-badge">Admin</span>
        </div>
        <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>{pageTitles[tab].title}</h1>
          <p>{pageTitles[tab].sub}</p>
        </div>

        {tab === "overview" && <OverviewSection />}
        {tab === "accounts" && <AccountSection />}
        {tab === "logs"     && <LogSection />}
        {tab === "configs"  && <ConfigSection />}
        {tab === "backup"   && <BackupSection />}
      </main>
    </div>
  );
}
