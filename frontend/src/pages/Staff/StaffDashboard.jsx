// src/pages/staff/StaffDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { getSalary } from "../../services/api";
import "./StaffDashboard.css";
import { AlertTriangle, Banknote, BarChart3, CalendarDays, Car, CheckCircle, ClipboardList, FileText, Flag, Handshake, Inbox, RefreshCw, User, Home } from "lucide-react";
import UserProfile from "../../components/UserProfile";
import NotificationBell from "../../components/NotificationBell";

const API = "http://localhost:8080/api";
const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS_VN = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"
];

// ─── helpers ───────────────────────────────────────────────
import { formatDateTimeVN, formatDateVN, toInputDate, toBackendDate, parseDateString } from "../../utils/dateUtils";
import { ASSIGNMENT_STATUS_LABEL } from "../../utils/constants";

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
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [attendances, setAttendances] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/staff/${user.id}/schedule?month=${monthStr}`);
      const data = await res.json();
      setAssignments(Array.isArray(data) ? data.map(a => ({ ...a, workDate: a.workDate && a.workDate.includes('/') ? a.workDate.split('/').reverse().join('-') : a.workDate })) : []);
    } catch {
      setAssignments([]);
    }
    setLoading(false);
  }, [user.id, monthStr]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const shiftedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < shiftedFirstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getAssignmentsForDay = (day) => {
    const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return assignments.filter(a => a.workDate === dateStr);
  };

  const handleDayClick = async (day) => {
    const aList = getAssignmentsForDay(day);
    setSelectedDay(day);
    setSelectedAssignments(aList);
    setAttendances({});
    setMsg({ text: "", type: "" });
    if (aList.length > 0) {
      for (const a of aList) {
        try {
          const res = await fetch(`${API}/staff/attendance/${a.id}`);
          if (res.ok) {
            const att = await res.json();
            setAttendances(prev => ({ ...prev, [a.id]: att }));
          }
        } catch { /* chưa có attendance */ }
      }
    }
  };

  const handleCheckIn = async (assignmentId) => {
    try {
      const res = await fetch(`${API}/staff/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi check in");
      setMsg({ text: `${data.message}`, type: "success" });
      // Reload attendance
      const ar = await fetch(`${API}/staff/attendance/${assignmentId}`);
      if (ar.ok) {
        const att = await ar.json();
        setAttendances(prev => ({ ...prev, [assignmentId]: att }));
      }
      loadSchedule();
    } catch (e) {
      setMsg({ text: e.message, type: "error" });
    }
  };

  const handleCheckOut = async (assignmentId) => {
    try {
      const res = await fetch(`${API}/staff/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi check out");
      setMsg({ text: `${data.message}`, type: "success" });
      const ar = await fetch(`${API}/staff/attendance/${assignmentId}`);
      if (ar.ok) {
        const att = await ar.json();
        setAttendances(prev => ({ ...prev, [assignmentId]: att }));
      }
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
            const dayAssignments = getAssignmentsForDay(day);
            return (
              <div
                key={day}
                className={[
                  "day-cell",
                  dayAssignments.length > 0 ? "has-shift" : "",
                  day === todayDay ? "today" : "",
                  day === selectedDay ? "selected" : "",
                ].join(" ")}
                onClick={() => handleDayClick(day)}
              >
                <span className="day-num">{day}</span>
                {dayAssignments.map((a, idx) => (
                  <span key={idx} className="day-shift">
                    {a.shift?.shiftName || "Ca"}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <div className="shift-detail">
          <h4><ClipboardList size={18} color="var(--accent)" />Chi tiết ngày {selectedDay}/{month}/{year}</h4>
          <Alert msg={msg.text} type={msg.type} />
          {!selectedAssignments || selectedAssignments.length === 0 ? (
            <div className="empty-state" style={{ padding: "20px" }}>
              Không có ca làm trong ngày này
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {selectedAssignments.map(a => {
                const att = attendances[a.id];
                return (
                  <div key={a.id} style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "8px" }}>
                    <div className="shift-info-row">
                      <span>Ca làm</span>
                      <span>{a.shift?.shiftName || "—"}</span>
                    </div>
                    <div className="shift-info-row">
                      <span>Giờ bắt đầu</span>
                      <span>{a.shift?.startTime || "—"}</span>
                    </div>
                    <div className="shift-info-row">
                      <span>Giờ kết thúc</span>
                      <span>{a.shift?.endTime || "—"}</span>
                    </div>
                    <div className="shift-info-row">
                      <span>Trạng thái ca</span>
                      <span>
                        <span className={`badge ${(a.status || "").toLowerCase().replace("_","-")}`}>
                          {ASSIGNMENT_STATUS_LABEL[a.status || "ASSIGNED"] || a.status || "ASSIGNED"}
                        </span>
                      </span>
                    </div>
                    {att && (
                      <>
                        <div className="shift-info-row">
                          <span>Check in</span>
                          <span>{formatDateTimeVN(att.checkInTime)}</span>
                        </div>
                        <div className="shift-info-row">
                          <span>Check out</span>
                          <span>{formatDateTimeVN(att.checkOutTime)}</span>
                        </div>
                        {att.penaltyFee != null && (
                          <div className="shift-info-row">
                            <span>Phí phạt</span>
                            <span style={{ color: "var(--danger)" }}>
                              {att.penaltyFee.toLocaleString("vi-VN")} ₫
                            </span>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                );
              })}
            </div>
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
    shiftName: "",
    reason: "",
    substituteUserId: "",
  });
  const [shiftsOnDate, setShiftsOnDate] = useState([]);
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

  useEffect(() => {
    if (form.targetDate) {
      fetch(`${API}/staff/${user.id}/schedule-by-date?date=${form.targetDate}`)
        .then(r => r.json())
        .then(d => {
          const arr = Array.isArray(d) ? d : [];
          setShiftsOnDate(arr);
          if (arr.length > 0) {
            setForm(prev => ({ ...prev, shiftName: arr[0].shift?.shiftName || "" }));
          } else {
            setForm(prev => ({ ...prev, shiftName: "" }));
          }
        })
        .catch(() => setShiftsOnDate([]));
    } else {
      setShiftsOnDate([]);
      setForm(prev => ({ ...prev, shiftName: "" }));
    }
  }, [form.targetDate, user.id]);

  const handleSubmit = async () => {
    if (!form.targetDate || !form.reason.trim()) {
      setMsg({ text: "Vui lòng điền đầy đủ ngày và lý do!", type: "error" });
      return;
    }
    if (!form.shiftName) {
      setMsg({ text: "Bạn không có ca làm việc nào trong ngày này để tạo đơn!", type: "error" });
      return;
    }
    if (form.requestType === "SHIFT_SWAP" && !form.substituteUserId) {
      setMsg({ text: "Vui lòng chọn người trực thay để đổi ca!", type: "error" });
      return;
    }
    const targetDateObj = parseDateString(form.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (form.requestType === "LEAVE" && targetDateObj && targetDateObj <= today) {
      setMsg({ text: "Vi phạm QLNX_QĐ 2: Xin nghỉ phép phải báo trước ít nhất 24 tiếng!", type: "error" });
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gửi đơn thất bại");
      }
      setMsg({ text: "Gửi đơn thành công!", type: "success" });
      setForm({ requestType: "LEAVE", targetDate: "", shiftName: "", reason: "", substituteUserId: "" });
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
      setMsg({ text: `${data.message}`, type: "success" });
      load();
    } catch (e) {
      setMsg({ text: e.message, type: "error" });
    }
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />{/* Form gửi đơn */}
      <div className="card">
        <div className="card-title"><FileText size={18} color="var(--accent)" />Gửi đơn mới</div>
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
            value={toInputDate(form.targetDate)}
            onChange={e => setForm({ ...form, targetDate: toBackendDate(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Ca làm</label>
          <select
            value={form.shiftName}
            onChange={e => setForm({ ...form, shiftName: e.target.value })}
            disabled={shiftsOnDate.length === 0}
          >
            {shiftsOnDate.length === 0 ? (
              <option value="">Không có ca làm nào</option>
            ) : (
              shiftsOnDate.map((a, i) => (
                <option key={i} value={a.shift?.shiftName || ""}>
                  {a.shift?.shiftName || "Ca không tên"} ({a.shift?.startTime} - {a.shift?.endTime})
                </option>
              ))
            )}
          </select>
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

      {/* Lịch sử đơn đã được chuyển sang trang Quản lý */}
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
      setMsg({ text: "Báo cáo sự cố đã được gửi!", type: "success" });
      setContent("");
      load();
    } catch (e) {
      setMsg({ text: e.message, type: "error" });
    }
    setLoading(false);
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} /> <div className="card">
        <div className="card-title"><AlertTriangle size={18} color="var(--accent)" />Báo cáo sự cố mới</div>
        <div className="form-group">
          <label>Nội dung sự cố</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Mô tả sự cố: mất thẻ, không đủ chỗ, hỏng thiết bị..."
            style={{ minHeight: 100 }}
          />
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '40px', paddingRight: '40px' }}>
          {loading ? "Đang gửi..." : (
            <>
              <span style={{ position: 'absolute', left: '16px', display: 'flex', alignItems: 'center' }}>
                <AlertTriangle size={18} color="var(--accent)" />
              </span>
              <span>Gửi báo cáo</span>
            </>
          )}
        </button>
      </div>

      {/* Lịch sử sự cố đã được chuyển sang trang Quản lý */}
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
      </div>

      <Alert msg={msg.text} type={msg.type} />
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : salaryData ? (
        <div className="salary-result" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="salary-item" style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span className="label" style={{ color: "var(--text-muted)" }}>Nhân viên</span>
            <span className="value" style={{ fontWeight: "600" }}>{salaryData.staffName}</span>
          </div>
          <div className="salary-item" style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span className="label" style={{ color: "var(--text-muted)" }}>Tháng</span>
            <span className="value" style={{ fontWeight: "600" }}>{salaryData.month}/{salaryData.year}</span>
          </div>
          <div className="salary-item" style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span className="label" style={{ color: "var(--text-muted)" }}>Số ca hoàn thành</span>
            <span className="value" style={{ fontWeight: "600" }}>{salaryData.totalShifts}</span>
          </div>
          <div className="salary-item" style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span className="label" style={{ color: "var(--text-muted)" }}>Số lần đi trễ</span>
            <span className="value" style={{ fontWeight: "600" }}>{salaryData.lateCount}</span>
          </div>
          <div className="salary-item" style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span className="label" style={{ color: "var(--text-muted)" }}>Tổng lương (chưa trừ phạt)</span>
            <span className="value" style={{ color: "var(--primary)", fontWeight: "bold" }}>
              {salaryData.totalPay.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="salary-item" style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span className="label" style={{ color: "var(--text-muted)" }}>Tổng tiền phạt</span>
            <span className="value" style={{ color: "var(--danger)", fontWeight: "bold" }}>
              {salaryData.totalPenalty.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="salary-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gridColumn: "span 2", padding: "20px 16px", background: "rgba(79, 142, 247, 0.05)", borderRadius: "8px", border: "1px dashed var(--accent)" }}>
            <span className="label" style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Banknote size={20} color="var(--accent)" /> Lương thực nhận
            </span>
            <span className="value" style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>
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

function OverviewSection({ user, pendingRequests, pendingIncidents }) {
  const [salarySummary, setSalarySummary] = useState(null);
  
  useEffect(() => {
    const today = new Date();
    getSalary(user.id, today.getFullYear(), today.getMonth() + 1)
      .then(res => setSalarySummary(res.data))
      .catch(() => setSalarySummary(null));
  }, [user.id]);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FileText size={24} /></div>
          <div>
            <div className="stat-label">Đơn chờ duyệt</div>
            <div className="stat-value">{pendingRequests}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><AlertTriangle size={24} /></div>
          <div>
            <div className="stat-label">Sự cố chờ xử lý</div>
            <div className="stat-value">{pendingIncidents}</div>
          </div>
        </div>
      </div>
      <h3 style={{ marginTop: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
        <Banknote size={18} color="var(--accent)" /> Tạm tính lương tháng này
      </h3>
      {salarySummary ? (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle size={24} /></div>
            <div>
              <div className="stat-label">Số ca hoàn thành</div>
              <div className="stat-value">{salarySummary.totalShifts} ca</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow"><Flag size={24} /></div>
            <div>
              <div className="stat-label">Số lần đi trễ</div>
              <div className="stat-value" style={{ color: salarySummary.lateCount > 0 ? 'var(--warning)' : 'inherit' }}>{salarySummary.lateCount} lần</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><Banknote size={24} /></div>
            <div>
              <div className="stat-label">Thực nhận dự kiến</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--primary)' }}>{salarySummary.netSalary.toLocaleString("vi-VN")} ₫</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card"><p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu lương hoặc đang tải...</p></div>
      )}
    </div>
  );
}

// ─── TỔNG HỢP: DASHBOARD ──────────────────────────────────
export default function StaffDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview");
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
    { id: "overview", icon: <Home size={18} />, label: "Tổng quan" },
    { id: "schedule", icon: <CalendarDays size={18} />, label: "Lịch làm việc" },
    { id: "requests", icon: <FileText size={18} />, label: "Đơn xin nghỉ/Đổi ca" },
    { id: "incidents", icon: <AlertTriangle size={18} />, label: "Báo cáo sự cố" },
    { id: "salary", icon: <BarChart3 size={18} />, label: "Báo cáo lương" },
  ];

  const pageTitles = {
    overview:  { title: "Tổng quan",            sub: "Thông tin tổng hợp cá nhân" },
    schedule:  { title: "Lịch làm việc",        sub: "Xem lịch và chấm công của bạn" },
    requests:  { title: "Đơn xin nghỉ / Đổi ca", sub: "Gửi và theo dõi trạng thái đơn" },
    incidents: { title: "Báo cáo sự cố",         sub: "Mất thẻ, không đủ chỗ, hỏng thiết bị..." },
    salary:    { title: "Báo cáo lương",            sub: "Theo dõi chấm công và chi tiết lương của bạn" },
  };

  return (
    <div className="staff-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', padding: '0 16px 24px' }}>
          <UserProfile user={user} onLogout={onLogout} />
          <h2 style={{ marginLeft: 8 }}>Nhân Viên</h2>
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
        <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="page-header" style={{ position: "relative" }}>
          <h1>{pageTitles[tab].title}</h1>
          <p>{pageTitles[tab].sub}</p>
          <NotificationBell userId={user.id} />
        </div>

        {tab === "overview" && <OverviewSection user={user} pendingRequests={pendingRequests} pendingIncidents={pendingIncidents} />}
        
        {tab !== "overview" && (
          <div className="card">
            {tab === "schedule"  && <ScheduleSection user={user} />}
            {tab === "requests"  && <RequestSection user={user} />}
            {tab === "incidents" && <IncidentSection user={user} />}
            {tab === "salary"    && <SalarySection user={user} />}
          </div>
        )}
      </main>
    </div>
  );
}
