// src/pages/HR/HrDashboard.jsx
import { useState, useEffect } from 'react';
import API from '../../services/api';

function HrDashboard({ user, onLogout }) {
    
    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    
    const [report, setReport] = useState([]);

    const [file, setFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState({ text: "", type: "" });
    const [uploading, setUploading] = useState(false);

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
        <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2>Phòng Hành Chính: {user?.fullName}</h2>
                <button onClick={onLogout} style={{ padding: '5px 15px', cursor: 'pointer' }}>Đăng xuất</button>
            </div>

            {/* Form upload Excel */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h3>📤 Import nhân viên từ Excel</h3>
                <p style={{ fontSize: '13px', color: '#555' }}>
                    Chọn file Excel (.xlsx hoặc .xls) có cấu trúc: <strong>Họ tên, Username, Lương, Ca làm, Ngày làm</strong>
                </p>
                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setFile(e.target.files[0])}
                        disabled={uploading}
                    />
                    <button type="submit" style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: uploading ? 0.6 : 1,
                        width: 'fit-content'
                    }} disabled={uploading}>
                        {uploading ? "Đang tải lên..." : "📤 Upload và lưu hồ sơ"}
                    </button>
                    {uploadMsg.text && (
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            background: uploadMsg.type === 'success' ? '#d4edda' : '#f8d7da',
                            color: uploadMsg.type === 'success' ? '#155724' : '#721c24',
                            border: `1px solid ${uploadMsg.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                        }}>
                            {uploadMsg.text}
                        </div>
                    )}
                </form>
            </div>

            {/* Báo cáo thống kê */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>📊 Báo cáo thống kê nhân sự nhà xe (Biểu mẫu PHC_BM 1)</h3>
                    
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div>
                            <label>Năm: </label>
                            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: '80px', padding: '5px' }} />
                        </div>
                        <div>
                            <label>Tháng: </label>
                            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '5px' }}>
                                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={handleExportCSV} 
                            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
                        >
                            📥 Kết xuất báo cáo (Excel/CSV)
                        </button>
                    </div>
                </div>

                <p style={{ fontStyle: 'italic', color: '#555', marginTop: 0 }}>Kính gửi: Ban Giám đốc Học viện cơ sở</p>

                <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '10px' }}>
                    <thead style={{ backgroundColor: '#343a40', color: 'white' }}>
                        <tr>
                            <th>STT</th>
                            <th>Mã NV</th>
                            <th>Họ và tên</th>
                            <th>Tổng số ca làm</th>
                            <th>Số ngày nghỉ</th>
                            <th>Số lần đi trễ</th>
                            <th>Tổng lương (VNĐ)</th>
                            <th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Không có dữ liệu cho tháng này</td>
                            </tr>
                        ) : (
                            report.map((row, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ textAlign: 'center' }}>{row.maNV}</td>
                                    <td><strong>{row.hoTen}</strong></td>
                                    <td style={{ textAlign: 'center' }}>{row.tongCaLam}</td>
                                    <td style={{ textAlign: 'center', color: row.soNgayNghi > 0 ? 'red' : 'black' }}>{row.soNgayNghi}</td>
                                    <td style={{ textAlign: 'center', color: row.soLanDiTre > 0 ? 'orange' : 'black' }}>{row.soLanDiTre}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Number(row.tongLuong).toLocaleString('vi-VN')} đ</td>
                                    <td></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <p><em>Người lập biểu</em></p>
                        <br/>
                        <p><strong>{user?.fullName}</strong></p>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <p><em>Trưởng phòng Hành chính</em></p>
                        <br/>
                        <p>(Ký và ghi rõ họ tên)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HrDashboard;