import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart2, Banknote, Download, Inbox, PartyPopper, Home, Clock, Upload, CheckCircle } from "lucide-react";
import "./AccountantDashboard.css";
import UserProfile from "../../components/UserProfile";

const API = "http://localhost:8080/api";
const fmtMoney = (val) => Number(val || 0).toLocaleString("vi-VN") + " ₫";

function TimekeepingSection() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/accountant/upload-timesheet`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setMessage({ type: "success", text: data.message });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="card-title"><Clock size={18} color="var(--accent)" />Upload Dữ liệu chấm công từ Excel</div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        Vui lòng tải lên file Excel (.xlsx) với các cột: <strong>Username, Ngày (yyyy-MM-dd), Ca làm, Giờ vào (HH:mm), Giờ ra (HH:mm)</strong>.
        Hệ thống sẽ tự động cập nhật giờ chấm công và tính phạt đi trễ (nếu muộn hơn 15 phút so với giờ bắt đầu ca).
      </p>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}
      
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange} 
          ref={fileInputRef}
          style={{ display: "none" }} 
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className="btn-cancel-sm" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px" }}>
          <Upload size={16} /> Chọn File Excel
        </label>
        <span style={{ fontSize: 13 }}>{file ? file.name : "Chưa chọn file nào"}</span>
      </div>
      <div style={{ marginTop: 20 }}>
        <button className="btn-primary" onClick={handleUpload} disabled={!file || loading}>
          {loading ? "Đang xử lý..." : "Tải lên & Tự động chấm công"}
        </button>
      </div>
    </div>
  );
}

function PayrollSection() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState([]);
  const [finalizedData, setFinalizedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  
  const loadSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const finRes = await fetch(`${API}/accountant/finalized-salaries?month=${month}&year=${year}`);
      const finData = await finRes.json();
      
      if (finData && finData.length > 0) {
        setIsFinalized(true);
        setFinalizedData(finData);
        setData([]);
      } else {
        setIsFinalized(false);
        const res = await fetch(`${API}/accountant/salaries?month=${month}&year=${year}`);
        const dynData = await res.json();
        setData(Array.isArray(dynData) ? dynData : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { loadSalaries(); }, [loadSalaries]);

  const handleFinalize = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn CHỐT LƯƠNG tháng ${month}/${year}? Thao tác này không thể hoàn tác.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/accountant/finalize-salary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Lỗi khi chốt lương");
      alert(result.message);
      loadSalaries(); 
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const currentData = isFinalized ? finalizedData : data;

  return (
    <div>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: "inline-block", marginRight: 8, marginBottom: 0 }}>Năm:</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 100, display: "inline-block" }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: "inline-block", marginRight: 8, marginBottom: 0 }}>Tháng:</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 120, display: "inline-block" }}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </select>
          </div>
        </div>
        <div>
          {isFinalized ? (
            <div className="badge active" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 13 }}>
              <CheckCircle size={16} /> Đã chốt lương
            </div>
          ) : (
            <button className="btn-primary" onClick={handleFinalize} disabled={loading || data.length === 0} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Banknote size={16} /> Chốt Lương Tháng {month}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title"><Banknote size={18} color="var(--accent)" /> Bảng tính lương {isFinalized ? "(Đã chốt)" : "(Tạm tính)"}</div>
        {loading ? <div className="loading">Đang tải...</div> : 
         currentData.length === 0 ? <div className="empty-state"><Inbox size={48} /> Chưa có dữ liệu</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nhân viên</th><th>Tổng ca</th><th>Lương ca</th><th>Phạt đi trễ</th><th>Thực nhận</th></tr></thead>
              <tbody>
                {currentData.map((r, i) => (
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
        )}
      </div>
    </div>
  );
}

function ReportSection() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [hrReport, setHrReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const hrRes = await fetch(`${API}/manager/hr-report?year=${year}&month=${month}`);
      const hrData = await hrRes.json();
      setHrReport(Array.isArray(hrData) ? hrData : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [year, month]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API}/manager/export-hr-csv?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baocao_nhansu_${month}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="card">
      <div className="card-title" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart2 size={18} color="var(--accent)" /> Báo cáo thống kê nhân sự (PHC_BM 1)
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            Năm: <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            Tháng: <select value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleExportCSV} style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>Xuất CSV</button>
        </div>
      </div>
      {loading ? <div className="loading">Đang tải...</div> : 
       hrReport.length === 0 ? <div className="empty-state"><Inbox size={48} /> Chưa có dữ liệu</div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>STT</th><th>MÃ NV</th><th>HỌ VÀ TÊN</th><th>TỔNG SỐ CA</th><th>NGÀY NGHỈ</th><th>ĐI TRỄ</th><th>TỔNG LƯƠNG</th></tr></thead>
            <tbody>
              {hrReport.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.userId}</td>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.totalShifts}</td>
                  <td>{r.absentDays}</td>
                  <td>{r.lateDays}</td>
                  <td><strong>{fmtMoney(r.totalSalary)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OverviewSection({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/manager/calculate-salaries`)
      .then(r => r.json())
      .then(d => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalEmployees = data.length;
  const totalShifts = data.reduce((sum, item) => sum + (item.shifts || 0), 0);
  const totalPayroll = data.reduce((sum, item) => sum + (item.final || 0), 0);

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><PartyPopper size={24} /></div>
          <div>
            <div className="stat-label">Nhân sự có lương</div>
            <div className="stat-value">{loading ? "..." : totalEmployees}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><BarChart2 size={24} /></div>
          <div>
            <div className="stat-label">Tổng ca hoàn thành</div>
            <div className="stat-value">{loading ? "..." : totalShifts}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Banknote size={24} /></div>
          <div>
            <div className="stat-label">Dự toán quỹ lương</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{loading ? "..." : totalPayroll.toLocaleString("vi-VN") + " ₫"}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><Home size={18} color="var(--accent)" />Tổng quan kế toán</div>
        <p style={{ marginTop: 12 }}>Chào mừng <strong>{user?.fullName || "Kế toán"}</strong>. Bạn có thể sử dụng các chức năng tính lương và xuất báo cáo trong menu bên trái.</p>
      </div>
    </div>
  );
}

export default function AccountantDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview");

  const navItems = [
    { id: "overview", icon: <Home size={18} />, label: "Tổng quan" },
    { id: "timekeeping", icon: <Clock size={18} />, label: "Quản lý chấm công" },
    { id: "payroll", icon: <Banknote size={18} />, label: "Tính Lương & Chốt lương" },
    { id: "report", icon: <BarChart2 size={18} />, label: "Báo cáo thống kê" },
  ];

  const pageTitles = {
    overview: { title: "Tổng quan", sub: "Thống kê tổng quan quỹ lương và nhân sự, chào mừng " + (user?.fullName || "Kế toán") },
    timekeeping: { title: "Quản lý chấm công", sub: "Tải lên dữ liệu chấm công từ Excel và chấm công tự động" },
    payroll: { title: "Tính Lương & Chốt lương", sub: "Xem bảng lương chi tiết và thực hiện chốt lương hàng tháng" },
    report: { title: "Báo cáo thống kê", sub: "Xem và xuất các báo cáo nhân sự theo mẫu" },
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', padding: '0 16px 24px' }}>
          <UserProfile user={user} onLogout={onLogout} />
          <div style={{ marginLeft: 8 }}>
            <h2 className="brand" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '2px' }}>Kế toán</h2>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>{pageTitles[tab]?.title || "Kế toán"}</h1>
          <p>{pageTitles[tab]?.sub}</p>
        </div>
        <div className="content-area">
          {tab === "overview" && <OverviewSection user={user} />}
          {tab === "timekeeping" && <TimekeepingSection />}
          {tab === "payroll" && <PayrollSection />}
          {tab === "report" && <ReportSection />}
        </div>
      </main>
    </div>
  );
}
