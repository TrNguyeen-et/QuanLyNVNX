// src/pages/staff/StaffDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { getSalary } from "../../services/api";
import "./StaffDashboard.css";

const API = "http://localhost:8080/api";
const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VN = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"
];

// ─── helpers ───────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}

function Alert({ msg, type }) {
  if (!msg) return null;
  return <div className={`alert ${type}`}>{msg}</div>;
}

// ─── SECTION: LỊCH LÀM VIỆC + CHECKIN/OUT ─────────────────
function ScheduleSection({ user }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [assignments, setAssignments] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/staff/${user.id}/schedule?month=${monthStr}`);
      const data = await res.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch {
      setAssignments([]);
    }
    setLoading(false);
  }, [user.id, monthStr]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getAssignmentForDay = (day) => {
    const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return assignments.find(a => a.workDate === dateStr);
  };

  const handleDayClick = async (day) => {
    const a = getAssignmentForDay(day);
    setSelectedDay(day);
    setSelectedAssignment(a || null);
    setAttendance(null);
    setMsg({ text: "", type: "" });
    if (a) {
      try {
        const res = await fetch(`${API}/staff/attendance/${a.id}`);
        if (res.ok) setAttendance(await res.json());
      } catch { /* chưa có attendance */ }
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch(`${API}/staff/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: selectedAssignment.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi check in");
      setMsg({ text: `✅ ${data.message}`, type: "success" });
      // Reload attendance
      const ar = await fetch(`${API}/staff/attendance/${selectedAssignment.id}`);
      if (ar.ok) setAttendance(await ar.json());
      loadSchedule();
    } catch (e) {
      setMsg({ text: e.message, type: "error" });
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await fetch(`${API}/staff/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: selectedAssignment.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi check out");
      setMsg({ text: `✅ ${data.message}`, type: "success" });
      const ar = await fetch(`${API}/staff/attendance/${selectedAssignment.id}`);
      if (ar.ok) setAttendance(await ar.json());
      loadSchedule();
    } catch (e) {
      setMsg({ text: e.message, type: "error" });
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const todayDay = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate() : null;

  return (
    <div>
      <div className="month-nav">
        <button onClick={prevMonth}>‹</button>
        <span>{MONTHS_VN[month - 1]} {year}</span>
        <button onClick={nextMonth}>›</button>
      </div>

      {loading ? (
        <div className="loading">Đang tải lịch...</div>
      ) : (
        <div className="schedule-grid">
          {DAYS.map(d => <div key={d} className="day-header">{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="day-cell empty" />;
            const hasShift = getAssignmentForDay(day);
            return (
              <div
                key={day}
                className={[
                  "day-cell",
                  hasShift ? "has-shift" : "",
                  day === todayDay ? "today" : "",
                  day === selectedDay ? "selected" : "",
                ].join(" ")}
                onClick={() => handleDayClick(day)}
              >
                <span className="day-num">{day}</span>
                {hasShift && (
                  <span className="day-shift">
                    {hasShift.shift?.shiftName || "Ca"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <div className="shift-detail">
          <h4>📋 Chi tiết ngày {selectedDay}/{month}/{year}</h4>
          <Alert msg={msg.text} type={msg.type} />

          {!selectedAssignment ? (
            <div className="empty-state" style={{ padding: "20px" }}>
              Không có ca làm trong ngày này
            </div>
          ) : (
            <>
              <div className="shift-info-row">
                <span>Ca làm</span>
                <span>{selectedAssignment.shift?.shiftName || "—"}</span>
              </div>
              <div className="shift-info-row">
                <span>Giờ bắt đầu</span>
                <span>{selectedAssignment.shift?.startTime || "—"}</span>
              </div>
              <div className="shift-info-row">
                <span>Giờ kết thúc</span>
                <span>{selectedAssignment.shift?.endTime || "—"}</span>
              </div>
              <div className="shift-info-row">
                <span>Trạng thái ca</span>
                <span>
                  <span className={`badge ${(selectedAssignment.status || "").toLowerCase().replace("_","-")}`}>
                    {selectedAssignment.status || "ASSIGNED"}
                  </span>
                </span>
              </div>
              {attendance && (
                <>
                  <div className="shift-info-row">
                    <span>Check in</span>
                    <span>{fmtDate(attendance.checkInTime)}</span>
                  </div>
                  <div className="shift-info-row">
                    <span>Check out</span>
                    <span>{fmtDate(attendance.checkOutTime)}</span>
                  </div>
                  {attendance.penaltyFee != null && (
                    <div className="shift-info-row">
                      <span>Phí phạt</span>
                      <span style={{ color: "var(--danger)" }}>
                        {attendance.penaltyFee.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="check-btns">
                <button
                  className="btn-checkin"
                  onClick={handleCheckIn}
                  disabled={!!(attendance?.checkInTime)}
                >
                  ✅ Check In
                </button>
                <button
                  className="btn-checkout"
                  onClick={handleCheckOut}
                  disabled={!(attendance?.checkInTime) || !!(attendance?.checkOutTime)}
                >
                  🏁 Check Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SECTION: ĐƠN XIN NGHỈ / ĐỔI CA ──────────────────────
function RequestSection({ user }) {
  const [requests, setRequests] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [form, setForm] = useState({
    requestType: "LEAVE",
    targetDate: "",
    reason: "",
    substituteUserId: "",
  });
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/staff/${user.id}/requests`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch { setRequests([]); }
  }, [user.id]);

  useEffect(() => {
    load();
    fetch(`${API}/staff/all-staff`)
      .then(r => r.json())
      .then(d => setAllStaff(Array.isArray(d) ? d.filter(s => s.id !== user.id) : []))
      .catch(() => setAllStaff([]));
  }, [user.id, load]);

  const handleSubmit = async () => {
    if (!form.targetDate || !form.reason.trim()) {
      setMsg({ text: "Vui lòng điền đầy đủ ngày và lý do!", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const body = { userId: user.id, ...form };
      if (form.requestType !== "SHIFT_SWAP") delete body.substituteUserId;
      const res = await fetch(`${API}/staff/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Gửi đơn thất bại");
      setMsg({ text: "✅ Gửi đơn thành công!", type: "success" });
      setForm({ requestType: "LEAVE", targetDate: "", reason: "", substituteUserId: "" });
      load();
    } catch (e) {
      setMsg({ text: e.message, type: "error" });
    }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    if (!confirm("Hủy đơn này?")) return;
    try {
      const res = await fetch(`${API}/staff/request/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi hủy đơn");
      setMsg({ text: `✅ ${data.message}`, type: "success" });
      load();
    } catch (e) {
      setMsg({ text: e.message, type: "error" });
    }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />

      {/* Form gửi đơn */}
      <div className="card">
        <div className="card-title">📝 Gửi đơn mới</div>
        <div className="form-group">
          <label>Loại đơn</label>
          <select value={form.requestType} onChange={e => setForm({ ...form, requestType: e.target.value })}>
            <option value="LEAVE">Nghỉ phép</option>
            <option value="SHIFT_SWAP">Đổi ca</option>
          </select>
        </div>
        <div className="form-group">
          <label>Ngày xin nghỉ / đổi ca</label>
          <input
            type="date"
            value={form.targetDate}
            onChange={e => setForm({ ...form, targetDate: e.target.value })}
          />
        </div>
        {form.requestType === "SHIFT_SWAP" && (
          <div className="form-group">
            <label>Người trực thay</label>
            <select
              value={form.substituteUserId}
              onChange={e => setForm({ ...form, substituteUserId: e.target.value })}
            >
              <option value="">-- Chọn nhân viên --</option>
              {allStaff.map(s => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.username})</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label>Lý do</label>
          <textarea
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
            placeholder="Nhập lý do..."
          />
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi đơn"}
        </button>
      </div>

      {/* Danh sách đơn */}
      <div className="card">
        <div className="card-title">📋 Đơn đã gửi</div>
        {requests.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📭</div>
            Chưa có đơn nào
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Ngày</th>
                  <th>Lý do</th>
                  <th>Người thay</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>{r.requestType === "LEAVE" ? "Nghỉ phép" : "Đổi ca"}</td>
                    <td>{r.targetDate}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.reason}
                    </td>
                    <td>{r.substituteUser ? r.substituteUser.fullName : "—"}</td>
                    <td>
                      <span className={`badge ${r.status?.toLowerCase()}`}>
                        {r.status === "PENDING" ? "Chờ duyệt"
                          : r.status === "APPROVED" ? "Đã duyệt"
                          : "Từ chối"}
                      </span>
                    </td>
                    <td>
                      {r.status === "PENDING" && (
                        <button className="btn-cancel" onClick={() => handleCancel(r.id)}>
                          Hủy
                        </button>
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

// ─── SECTION: BÁO CÁO SỰ CỐ ───────────────────────────────
function IncidentSection({ user }) {
  const [incidents, setIncidents] = useState([]);
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/staff/${user.id}/incidents`);
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch { setIncidents([]); }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setMsg({ text: "Vui lòng nhập nội dung sự cố!", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/staff/incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, content }),
      });
      if (!res.ok) throw new Error("Gửi báo cáo thất bại");
      setMsg({ text: "✅ Báo cáo sự cố đã được gửi!", type: "success" });
      setContent("");
      load();
    } catch (e) {
      setMsg({ text: e.message, type: "error" });
    }
    setLoading(false);
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />

      <div className="card">
        <div className="card-title">🚨 Báo cáo sự cố mới</div>
        <div className="form-group">
          <label>Nội dung sự cố</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Mô tả sự cố: mất thẻ, không đủ chỗ, hỏng thiết bị..."
            style={{ minHeight: 100 }}
          />
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang gửi..." : "🚨 Gửi báo cáo"}
        </button>
      </div>

      <div className="card">
        <div className="card-title">📋 Sự cố đã báo cáo</div>
        {incidents.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">✅</div>
            Chưa có sự cố nào được báo cáo
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thời gian báo cáo</th>
                  <th>Nội dung</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(inc.reportTime)}</td>
                    <td>{inc.content}</td>
                    <td>
                      <span className={`badge ${inc.status?.toLowerCase()}`}>
                        {inc.status === "PENDING" ? "Chờ xử lý" : "Đã xử lý"}
                      </span>
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

// ─── SECTION: BÀN GIAO CA ─────────────────────────────────
function HandoverSection({ user }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadColleagues = async () => {
    if (!date) return;
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch(`${API}/staff/colleagues?date=${date}`);
      const data = await res.json();
      setColleagues(Array.isArray(data) ? data.filter(c => c.id !== user.id) : []);
      if (!Array.isArray(data) || data.filter(c => c.id !== user.id).length === 0) {
        setMsg({ text: "Không có nhân viên nào làm cùng ngày này", type: "error" });
      }
    } catch {
      setColleagues([]);
      setMsg({ text: "Lỗi tải dữ liệu", type: "error" });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">🤝 Bàn giao ca</div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          Xem danh sách đồng nghiệp làm cùng ca để bàn giao công việc.
        </p>
        <Alert msg={msg.text} type={msg.type} />
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16 }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Chọn ngày</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={loadColleagues} disabled={loading}>
            {loading ? "Đang tải..." : "Xem"}
          </button>
        </div>

        {colleagues.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Tài khoản</th>
                  <th>Ca làm</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {colleagues.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.fullName}</strong></td>
                    <td style={{ color: "var(--text-muted)" }}>{c.username}</td>
                    <td>{c.workShift || "—"}</td>
                    <td>
                      <span className={`badge ${c.status?.toLowerCase()}`}>
                        {c.status === "ACTIVE" ? "Đang làm"
                          : c.status === "ON_LEAVE" ? "Nghỉ phép"
                          : c.status || "—"}
                      </span>
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

// ─── SECTION: XEM LƯƠNG ──────────────────────────────────
function SalarySection({ user }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const fetchSalary = async () => {
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await getSalary(user.id, year, month);
      setSalaryData(res.data);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Không thể tải dữ liệu lương", type: "error" });
      setSalaryData(null);
    }
    setLoading(false);
  };

  // Tự động fetch khi user, month, year thay đổi
  useEffect(() => {
    fetchSalary();
  }, [user.id, month, year]);

  const handleMonthChange = (e) => {
    const [newYear, newMonth] = e.target.value.split("-").map(Number);
    setYear(newYear);
    setMonth(newMonth);
  };

  const currentMonthStr = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <label style={{ fontWeight: 600 }}>Chọn tháng:</label>
        <input
          type="month"
          value={currentMonthStr}
          onChange={handleMonthChange}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)" }}
        />
        <button onClick={fetchSalary} className="btn-primary" style={{ padding: "6px 16px" }}>
          🔄 Tải lại
        </button>
      </div>

      <Alert msg={msg.text} type={msg.type} />

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : salaryData ? (
        <div className="salary-result" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="salary-item">
            <span className="label">Nhân viên</span>
            <span className="value">{salaryData.staffName}</span>
          </div>
          <div className="salary-item">
            <span className="label">Tháng</span>
            <span className="value">{salaryData.month}/{salaryData.year}</span>
          </div>
          <div className="salary-item">
            <span className="label">Số ca hoàn thành</span>
            <span className="value">{salaryData.totalShifts}</span>
          </div>
          <div className="salary-item">
            <span className="label">Số lần đi trễ</span>
            <span className="value">{salaryData.lateCount}</span>
          </div>
          <div className="salary-item">
            <span className="label">Tổng lương (chưa trừ phạt)</span>
            <span className="value" style={{ color: "var(--primary)" }}>
              {salaryData.totalPay.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="salary-item">
            <span className="label">Tổng tiền phạt</span>
            <span className="value" style={{ color: "var(--danger)" }}>
              {salaryData.totalPenalty.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="salary-item" style={{ gridColumn: "span 2", borderTop: "2px solid var(--border)", paddingTop: 12 }}>
            <span className="label" style={{ fontSize: 18, fontWeight: 700 }}>💰 Lương thực nhận</span>
            <span className="value" style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>
              {salaryData.netSalary.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-state">Không có dữ liệu</div>
      )}
    </div>
  );
}

// ─── TỔNG HỢP: DASHBOARD ──────────────────────────────────
export default function StaffDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("schedule");
  const [requests, setRequests] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // Load thống kê nhanh
  useEffect(() => {
    fetch(`${API}/staff/${user.id}/requests`)
      .then(r => r.json()).then(d => setRequests(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/staff/${user.id}/incidents`)
      .then(r => r.json()).then(d => setIncidents(Array.isArray(d) ? d : [])).catch(() => {});
  }, [user.id]);

  const pendingRequests = requests.filter(r => r.status === "PENDING").length;
  const pendingIncidents = incidents.filter(i => i.status === "PENDING").length;

  const navItems = [
    { id: "schedule", icon: "📅", label: "Lịch làm việc" },
    { id: "requests", icon: "📝", label: "Đơn xin nghỉ/Đổi ca" },
    { id: "incidents", icon: "🚨", label: "Báo cáo sự cố" },
    { id: "handover", icon: "🤝", label: "Bàn giao ca" },
    { id: "salary", icon: "💰", label: "Lương" },
  ];

  const pageTitles = {
    schedule:  { title: "Lịch làm việc",        sub: "Xem lịch và chấm công của bạn" },
    requests:  { title: "Đơn xin nghỉ / Đổi ca", sub: "Gửi và theo dõi trạng thái đơn" },
    incidents: { title: "Báo cáo sự cố",         sub: "Mất thẻ, không đủ chỗ, hỏng thiết bị..." },
    handover:  { title: "Bàn giao ca",           sub: "Xem đồng nghiệp cùng ca" },
    salary:    { title: "Bảng lương",            sub: "Xem thu nhập của bạn theo tháng" },
  };

  return (
    <div className="staff-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🚗 NhàXe</h2>
          <p>Hệ thống quản lý</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="name">{user.fullName}</div>
          <span className="role-badge">Nhân viên</span>
        </div>
        <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="page-header">
          <h1>{pageTitles[tab].title}</h1>
          <p>{pageTitles[tab].sub}</p>
        </div>

        {/* Stat cards chỉ hiển thị ở trang chủ (schedule) */}
        {tab === "schedule" && (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📝</div>
              <div>
                <div className="stat-label">Đơn chờ duyệt</div>
                <div className="stat-value">{pendingRequests}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow">🚨</div>
              <div>
                <div className="stat-label">Sự cố chờ xử lý</div>
                <div className="stat-value">{pendingIncidents}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">👤</div>
              <div>
                <div className="stat-label">Nhân viên</div>
                <div className="stat-value" style={{ fontSize: 14 }}>{user.fullName}</div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          {tab === "schedule"  && <ScheduleSection user={user} />}
          {tab === "requests"  && <RequestSection user={user} />}
          {tab === "incidents" && <IncidentSection user={user} />}
          {tab === "handover"  && <HandoverSection user={user} />}
          {tab === "salary"    && <SalarySection user={user} />}
        </div>
      </main>
    </div>
  );
}
