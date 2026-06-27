import React, { useState, useEffect, useCallback } from "react";
import { BarChart2, Banknote, Download, Inbox, PartyPopper } from "lucide-react";
import "./AccountantDashboard.css";

const API = "http://localhost:8080/api";
const fmtMoney = (val) => Number(val || 0).toLocaleString("vi-VN") + " ₫";

function SalaryTable() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch(`${API}/manager/calculate-salaries`).then(r => r.json()).then(d => setData(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  if (data.length === 0) return <div className="empty-state"><div className="emoji" style={{color: "var(--accent)"}}><Inbox size={48} /></div>Chưa có dữ liệu</div>;
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

function ReportSection() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [hrReport, setHrReport] = useState([]);
  const [late, setLate] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const [hrRes, lateRes] = await Promise.all([
        fetch(`${API}/manager/hr-report?year=${year}&month=${month}`),
        fetch(`${API}/manager/late-staff?year=${year}&month=${month}`)
      ]);
      const hrData = await hrRes.json();
      const lateData = await lateRes.json();
      setHrReport(Array.isArray(hrData) ? hrData : []);
      setLate(Array.isArray(lateData) ? lateData : []);
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
    <div>
      <div className="card-row">
        <div className="card">
          <div className="card-title"><BarChart2 size={18} color="var(--accent)" /> Nhân viên đi trễ ({late.length})</div>
          {late.length === 0 ? (
            <div className="empty-state"><div className="emoji" style={{color: "var(--accent)"}}><PartyPopper size={48} /></div>Không có ai đi trễ</div>
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
          <div className="card-title"><Banknote size={18} color="var(--accent)" /> Bảng tính lương</div>
          <SalaryTable />
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div className="card-title" style={{ marginBottom: 0 }}><BarChart2 size={18} color="var(--accent)" /> Báo cáo thống kê nhân sự (PHC_BM 1)</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '6px' }}>Năm:</label>
                      <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '6px' }}>Tháng:</label>
                      <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
                      </select>
                  </div>
                  <button onClick={handleExportCSV} className="btn-primary" style={{ padding: '6px 16px' }}>
                      <Download size={16} color="var(--accent)" /> Xuất CSV
                  </button>
              </div>
          </div>
          <div className="table-wrap">
              <table>
                  <thead><tr><th>STT</th><th>Mã NV</th><th>Họ và tên</th><th>Tổng số ca</th><th>Ngày nghỉ</th><th>Đi trễ</th><th>Tổng lương</th></tr></thead>
                  <tbody>
                      {hrReport.length === 0 ? (
                          <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
                      ) : (
                          hrReport.map((row, index) => (
                              <tr key={index}>
                                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                  <td style={{ textAlign: 'center' }}>{row.maNV || '—'}</td>
                                  <td><strong>{row.hoTen}</strong></td>
                                  <td style={{ textAlign: 'center' }}>{row.tongCaLam || 0}</td>
                                  <td style={{ textAlign: 'center', color: row.soNgayNghi > 0 ? 'var(--danger)' : 'inherit' }}>{row.soNgayNghi || 0}</td>
                                  <td style={{ textAlign: 'center', color: row.soLanDiTre > 0 ? 'var(--warning)' : 'inherit' }}>{row.soLanDiTre || 0}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Number(row.tongLuong || 0).toLocaleString('vi-VN')} ₫</td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}

export default function AccountantDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("report");

  const navItems = [
    { id: "report", icon: <BarChart2 size={18} />, label: "Tính Lương & Báo cáo" },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">K</div>
          <div>
            <h2 className="brand">Kế toán</h2>
            <div className="badge admin">{user?.fullName || "Kế toán"}</div>
          </div>
        </div>
        <nav className="nav-menu">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>Kế toán / Tính Lương & Báo Cáo</h1>
          <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
        </header>
        <div className="content-area">
          {tab === "report" && <ReportSection />}
        </div>
      </main>
    </div>
  );
}
