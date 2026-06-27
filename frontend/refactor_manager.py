import re

def main():
    file_path = 'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Manager/ManagerDashboard.jsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add missing lucide-react imports if any
    if 'Upload' not in content:
        content = re.sub(r'import \{([^}]+)\} from "lucide-react";', r'import {\1, Upload, Download} from "lucide-react";', content)

    # We need to insert the Import section in StaffSection
    # StaffSection ends with a closing div of the card, we can put it above the card or below the card.
    # Let's add an Import button that opens a file picker, or just put the form above the staff table.
    import_html = """
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><Upload size={18} color="var(--accent)" /> Import nhân viên từ Excel</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Chọn file Excel (.xlsx hoặc .xls) có cấu trúc: <strong>Họ tên, Username, Lương, Ca làm, Ngày làm</strong>
          </p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input id="fileInput" type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} disabled={uploading} style={{background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px'}} />
              <button type="submit" className="btn-primary" style={{ width: 'fit-content' }} disabled={uploading}>
                  {uploading ? "Đang tải lên..." : <><Upload size={18} color="var(--accent)" /> Upload và lưu hồ sơ</>}
              </button>
              {uploadMsg.text && <div className={`alert ${uploadMsg.type}`}>{uploadMsg.text}</div>}
          </form>
        </div>
"""
    staff_state = """
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState({ text: "", type: "" });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
      e.preventDefault();
      if (!file) { setUploadMsg({ text: "Vui lòng chọn file Excel!", type: "error" }); return; }
      setUploading(true); setUploadMsg({ text: "", type: "" });
      const formData = new FormData();
      formData.append('file', file);
      try {
          const res = await fetch('http://localhost:8080/api/manager/import-staff', { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Lỗi upload");
          setUploadMsg({ text: data.message, type: "success" });
          setFile(null);
          document.getElementById('fileInput').value = '';
          load();
      } catch (err) { setUploadMsg({ text: err.message, type: "error" }); }
      setUploading(false);
  };
"""
    # Insert states into StaffSection
    content = content.replace("  const [msg, setMsg] = useState({ text: \"\", type: \"\" });", 
                              "  const [msg, setMsg] = useState({ text: \"\", type: \"\" });\n" + staff_state)
    # Insert HTML into StaffSection
    content = content.replace("<div className=\"card\">\n        <div className=\"card-title\"><Users size={18} color=\"var(--accent)\" /> Danh sách nhân viên ({staff.length})</div>",
                              import_html + "\n      <div className=\"card\">\n        <div className=\"card-title\"><Users size={18} color=\"var(--accent)\" /> Danh sách nhân viên ({staff.length})</div>")

    # Now ReportSection
    report_state = """
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [hrReport, setHrReport] = useState([]);
  const loadHrReport = async () => {
      const res = await fetch(`${API}/manager/hr-report?year=${year}&month=${month}`).then(r => r.json()).catch(() => []);
      setHrReport(res);
  };
  useEffect(() => { loadHrReport(); }, [year, month]);

  const handleExportCSV = () => {
      if (hrReport.length === 0) return alert("Không có dữ liệu để xuất!");
      const headers = ["Mã NV", "Họ và tên", "Tổng số ca làm", "Số ngày nghỉ", "Số lần đi trễ", "Tổng lương (VNĐ)", "Ghi chú"];
      const rows = hrReport.map(r => [r.maNV, r.hoTen, r.tongCaLam, r.soNgayNghi, r.soLanDiTre, r.tongLuong, ""]);
      const csvContent = [`BÁO CÁO THỐNG KÊ NHÂN SỰ NHÀ XE - Tháng ${month}/${year}`, "Kính gửi: Ban Giám đốc Học viện", "", headers.join(';'), ...rows.map(e => e.join(';'))].join('\\n');
      const blob = new Blob(["\\uFEFF" + csvContent], { type: 'text/csv; charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_cao_nhan_su_thang_${month}_${year}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
"""
    hr_report_html = """
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
"""
    content = content.replace("  const [loading, setLoading] = useState(false);", "  const [loading, setLoading] = useState(false);\n" + report_state)
    # Insert at the end of the return of ReportSection
    content = content.replace("      </div>\n    </div>\n  );\n}\n\nfunction SalaryTable()", hr_report_html + "\n    </div>\n  );\n}\n\nfunction SalaryTable()")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    main()
