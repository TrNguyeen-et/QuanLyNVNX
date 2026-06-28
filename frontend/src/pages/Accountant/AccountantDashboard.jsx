import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart2, Banknote, Download, Inbox, PartyPopper, Home, Clock, Upload, CheckCircle, Users, Wallet, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import "./AccountantDashboard.css";
import UserProfile from "../../components/UserProfile";

const API = "http://localhost:8080/api";
const fmtMoney = (val) => Number(val || 0).toLocaleString("vi-VN") + " ₫";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

function CombinedTimekeepingPayrollSection() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState([]);
  const [finalizedData, setFinalizedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = useRef(null);
  
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setUploadMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/accountant/upload-timesheet`, {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Upload failed");
      setUploadMessage({ type: "success", text: resData.message });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Tải lại bảng lương sau khi upload thành công
      loadSalaries();
    } catch (e) {
      setUploadMessage({ type: "error", text: e.message });
    }
    setLoading(false);
  };

  const handleFinalize = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn CHỐT LƯƠNG tháng ${month}/${year}? Hệ thống sẽ tự động gửi email phiếu lương đến các nhân viên.`)) return;
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: "inline-block", marginRight: 8, marginBottom: 0 }}>Năm:</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 100, display: "inline-block" }}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
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

      {!isFinalized && (
        <div className="card">
          <div className="card-title"><Clock size={18} color="var(--accent)" />Upload Dữ liệu chấm công từ Excel</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Vui lòng chọn <strong>Tháng và Năm</strong> ở phía trên, sau đó tải lên file Excel (.xlsx) với các cột: <strong>Họ tên, Ngày (dd/MM/yyyy), Ca làm, Vị trí, Giờ vào (HH:mm), Giờ ra (HH:mm)</strong>.
          </p>
          {uploadMessage && <div className={`alert ${uploadMessage.type}`}>{uploadMessage.text}</div>}
          
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
          <div style={{ marginTop: 20, display: "flex", gap: "10px" }}>
            <button className="btn-primary" onClick={handleUpload} disabled={!file || loading}>
              {loading ? "Đang xử lý..." : "Tải lên & Cập nhật bảng lương"}
            </button>
          </div>
        </div>
      )}

      {(loading || currentData.length > 0) && (
        <div className="card">
          <div className="card-title"><Banknote size={18} color="var(--accent)" /> Bảng tính lương {isFinalized ? "(Đã chốt)" : "(Tạm tính)"}</div>
          {loading ? <div className="loading">Đang tải...</div> : (
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
      )}
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
      a.download = `baocao_luong_${month}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) { alert(e.message); }
  };

  const totalEmployees = hrReport.length;
  const totalPayroll = hrReport.reduce((sum, item) => sum + (item.netSalary || 0), 0);
  const avgSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
  const totalAbsentLate = hrReport.reduce((sum, item) => sum + (item.absentCount || 0) + (item.lateCount || 0), 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: 'var(--accent)', fontWeight: 600 }}>Tổng lương: {fmtMoney(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-title" style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart2 size={18} color="var(--accent)" /> Báo cáo thống kê lương
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
              Năm: <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
              Tháng: <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
            </div>
            <button className="btn-primary" onClick={handleExportCSV} style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={14} /> Xuất CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? <div className="loading">Đang tải...</div> : 
       hrReport.length === 0 ? <div className="card empty-state"><Inbox size={48} /> Chưa có dữ liệu</div> : (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="stat-card">
              <div className="stat-icon purple"><Wallet size={24} /></div>
              <div>
                <div className="stat-label">Tổng quỹ lương</div>
                <div className="stat-value" style={{ fontSize: 20 }}>{fmtMoney(totalPayroll)}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><Banknote size={24} /></div>
              <div>
                <div className="stat-label">Lương trung bình</div>
                <div className="stat-value" style={{ fontSize: 20 }}>{fmtMoney(avgSalary)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ fontSize: 16, marginBottom: 20 }}>Biểu đồ Lương nhân viên</div>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hrReport} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="staffName" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => value.toLocaleString('vi-VN')} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                  <Bar dataKey="netSalary" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ fontSize: 16 }}>Danh sách chi tiết</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>STT</th><th>MÃ NV</th><th>HỌ VÀ TÊN</th><th>TỔNG LƯƠNG</th></tr></thead>
                <tbody>
                  {hrReport.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r.staffId}</td>
                      <td><strong>{r.staffName}</strong></td>
                      <td><strong>{fmtMoney(r.netSalary)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
    { id: "timekeeping", icon: <Banknote size={18} />, label: "Quản lý chấm công và lương" },
    { id: "report", icon: <BarChart2 size={18} />, label: "Báo cáo thống kê" },
  ];

  const pageTitles = {
    overview: { title: "Tổng quan", sub: "Thống kê tổng quan quỹ lương và nhân sự, chào mừng " + (user?.fullName || "Kế toán") },
    timekeeping: { title: "Quản lý chấm công và tính lương", sub: "Tải dữ liệu chấm công và thực hiện chốt lương" },
    report: { title: "Báo cáo thống kê", sub: "Xem và xuất các báo cáo lương theo từng tháng" },
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
          {tab === "timekeeping" && <CombinedTimekeepingPayrollSection />}
          {tab === "report" && <ReportSection />}
        </div>
      </main>
    </div>
  );
}
