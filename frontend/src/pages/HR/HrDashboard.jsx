// src/pages/HR/HrDashboard.jsx
import { useState, useEffect } from 'react';
import API from '../../services/api';
import "./HrDashboard.css";

function HrDashboard({ user, onLogout }) {

    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth() + 1);

    const [report, setReport] = useState([]);

    const [file, setFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState({ text: "", type: "" });
    const [uploading, setUploading] = useState(false);

    const [activeTab, setActiveTab] = useState("report");

    useEffect(() => {
        fetchReport();
    }, [year, month]);

    const fetchReport = async () => {
        try {
            const res = await API.get(`/hr/report?year=${year}&month=${month}`);
            setReport(res.data);
        } catch (err) {
            console.error("Lỗi tải báo cáo", err);
        }
    };

    // Xử lý upload file Excel
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setUploadMsg({ text: "Vui lòng chọn file Excel!", type: "error" });
            return;
        }
        setUploading(true);
        setUploadMsg({ text: "", type: "" });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8080/api/hr/import-staff', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Lỗi upload");
            setUploadMsg({ text: data.message, type: "success" });
            setFile(null);
            document.getElementById('fileInput').value = '';
        } catch (err) {
            setUploadMsg({ text: err.message, type: "error" });
        }
        setUploading(false);
    };

    const handleExportCSV = () => {
        if (report.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }

        const headers = ["Mã NV", "Họ và tên", "Tổng số ca làm", "Số ngày nghỉ", "Số lần đi trễ", "Tổng lương (VNĐ)", "Ghi chú"];

        const rows = report.map(row => [
            row.maNV,
            row.hoTen,
            row.tongCaLam,
            row.soNgayNghi,
            row.soLanDiTre,
            row.tongLuong,
            ""
        ]);

        const csvContent = [
            `BÁO CÁO THỐNG KÊ NHÂN SỰ NHÀ XE - Tháng ${month}/${year}`,
            "Kính gửi: Ban Giám đốc Học viện",
            "",
            headers.join(';'),
            ...rows.map(e => e.join(';'))
        ].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv; charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bao_cao_nhan_su_thang_${month}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="hr-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>🚗 NhàXe</h2>
                    <p>Hệ thống quản lý</p>
                </div>
                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeTab === "report" ? "active" : ""}`}
                        onClick={() => setActiveTab("report")}
                    >
                        <span className="icon">📊</span>
                        Báo cáo nhân sự
                    </button>
                    <button 
                        className={`nav-item ${activeTab === "import" ? "active" : ""}`}
                        onClick={() => setActiveTab("import")}
                    >
                        <span className="icon">📤</span>
                        Import nhân viên
                    </button>
                </nav>
                <div className="sidebar-user">
                    <div className="name">{user?.fullName || "HR"}</div>
                    <span className="role-badge">Phòng Hành chính</span>
                </div>
                <button className="btn-logout" onClick={onLogout}>Đăng xuất</button>
            </aside>

            <main className="main-content">
                <div className="page-header">
                    <h1>{activeTab === "report" ? "📊 Báo cáo nhân sự" : "📤 Import nhân viên"}</h1>
                    <p>{activeTab === "report" ? "Thống kê nhân sự theo tháng" : "Upload file Excel để thêm nhân viên hàng loạt"}</p>
                </div>

                {activeTab === "import" && (
                    <div className="card">
                        <div className="card-title">📤 Import nhân viên từ Excel</div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            Chọn file Excel (.xlsx hoặc .xls) có cấu trúc: <strong>Họ tên, Username, Lương, Ca làm, Ngày làm</strong>
                        </p>
                        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                id="fileInput"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setFile(e.target.files[0])}
                                disabled={uploading}
                                style={{
                                    background: 'var(--surface2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    color: 'var(--text)'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: 'fit-content' }}
                                disabled={uploading}
                            >
                                {uploading ? "Đang tải lên..." : "📤 Upload và lưu hồ sơ"}
                            </button>
                            {uploadMsg.text && (
                                <div className={`alert ${uploadMsg.type}`}>
                                    {uploadMsg.text}
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {activeTab === "report" && (
                    <div className="card">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            <div className="card-title" style={{ marginBottom: 0 }}>📊 Báo cáo thống kê nhân sự nhà xe (PHC_BM 1)</div>

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '6px' }}>Năm:</label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={e => setYear(Number(e.target.value))}
                                        style={{
                                            width: '70px',
                                            padding: '6px 10px',
                                            background: 'var(--surface2)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            color: 'var(--text)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '6px' }}>Tháng:</label>
                                    <select
                                        value={month}
                                        onChange={e => setMonth(Number(e.target.value))}
                                        style={{
                                            padding: '6px 10px',
                                            background: 'var(--surface2)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            color: 'var(--text)'
                                        }}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>Tháng {m}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleExportCSV}
                                    className="btn-primary"
                                    style={{ padding: '6px 16px' }}
                                >
                                    📥 Xuất CSV
                                </button>
                            </div>
                        </div>

                        <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            Kính gửi: Ban Giám đốc Học viện cơ sở
                        </p>

                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Mã NV</th>
                                        <th>Họ và tên</th>
                                        <th>Tổng số ca</th>
                                        <th>Số ngày nghỉ</th>
                                        <th>Số lần đi trễ</th>
                                        <th>Tổng lương (VNĐ)</th>
                                        <th>Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                                Không có dữ liệu cho tháng này
                                            </td>
                                        </tr>
                                    ) : (
                                        report.map((row, index) => (
                                            <tr key={index}>
                                                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                                <td style={{ textAlign: 'center' }}>{row.maNV || '—'}</td>
                                                <td><strong>{row.hoTen}</strong></td>
                                                <td style={{ textAlign: 'center' }}>{row.tongCaLam || 0}</td>
                                                <td style={{ textAlign: 'center', color: row.soNgayNghi > 0 ? 'var(--danger)' : 'inherit' }}>
                                                    {row.soNgayNghi || 0}
                                                </td>
                                                <td style={{ textAlign: 'center', color: row.soLanDiTre > 0 ? 'var(--warning)' : 'inherit' }}>
                                                    {row.soLanDiTre || 0}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                    {Number(row.tongLuong || 0).toLocaleString('vi-VN')} ₫
                                                </td>
                                                <td></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '30px',
                            paddingTop: '20px',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <div style={{ textAlign: 'center', width: '30%' }}>
                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Người lập biểu</p>
                                <br />
                                <p><strong>{user?.fullName || '—'}</strong></p>
                            </div>
                            <div style={{ textAlign: 'center', width: '30%' }}>
                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Trưởng phòng Hành chính</p>
                                <br />
                                <p style={{ color: 'var(--text-muted)' }}>(Ký và ghi rõ họ tên)</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default HrDashboard;