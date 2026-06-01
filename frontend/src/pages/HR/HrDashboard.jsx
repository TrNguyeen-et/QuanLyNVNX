import { useState, useEffect, useContext } from 'react';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

function HrDashboard() {
    const { user, logout } = useContext(AuthContext);
    
    // State cho bộ lọc tháng/năm
    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    
    // State chứa dữ liệu báo cáo
    const [report, setReport] = useState([]);

    // Lấy dữ liệu khi load trang hoặc khi đổi tháng/năm
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

    // ==================== XUẤT BÁO CÁO EXCEL/CSV ====================
    // (Thực hiện yêu cầu phi chức năng số 5: Tương thích - Kết xuất ra file)
    const handleExportCSV = () => {
        if (report.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }

        // Tạo header theo đúng biểu mẫu PHC_BM 1
        const headers = ["Mã NV", "Họ và tên", "Tổng số ca làm", "Số ngày nghỉ", "Số lần đi trễ", "Tổng lương (VNĐ)", "Ghi chú"];
        
        // Tạo các dòng dữ liệu
        const rows = report.map(row => [
            row.maNV,
            row.hoTen,
            row.tongCaLam,
            row.soNgayNghi,
            row.soLanDiTre,
            row.tongLuong,
            "" // Ghi chú trống
        ]);

        // Ghép lại thành chuỗi CSV (dùng ';' để Excel tiếng Việt dễ nhận diện)
        const csvContent = [
            `BÁO CÁO THỐNG KÊ NHÂN SỰ NHÀ XE - Tháng ${month}/${year}`,
            "Kính gửi: Ban Giám đốc Học viện",
            "", // Dòng trống
            headers.join(';'),
            ...rows.map(e => e.join(';'))
        ].join('\n');

        // Tạo file và tự động tải về
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv; charset=utf-8;' }); // Thêm BOM để Excel hiểu tiếng Việt
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bao_cao_nhan_su_thang_${month}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ==================== GIAO DIỆN ====================
    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2>Phòng Hành Chính: {user?.fullName}</h2>
                <button onClick={logout} style={{ padding: '5px 15px', cursor: 'pointer' }}>Đăng xuất</button>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>📊 Báo cáo thống kê nhân sự nhà xe (Biểu mẫu PHC_BM 1)</h3>
                    
                    {/* Bộ lọc thời gian & Nút Export */}
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

                {/* Bảng dữ liệu báo cáo */}
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

                {/* Chân bảng báo cáo */}
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