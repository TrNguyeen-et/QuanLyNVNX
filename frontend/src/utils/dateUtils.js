// Tiện ích xử lý Date đồng bộ format dd/MM/yyyy với backend

// Backend luôn trả về/nhận chuỗi: dd/MM/yyyy
export function parseDateString(str) {
  if (!str) return null;
  // Fallback: nếu chuỗi đã có dạng yyyy-mm-dd
  if (str.includes("-") && str.split("-")[0].length === 4) {
    return new Date(str);
  }
  // Nếu có dạng dd/MM/yyyy hoặc dd/MM/yyyy HH:mm:ss
  if (str.includes("/")) {
     const parts = str.split(/[ /:]/);
     const d = parts[0], m = parts[1], y = parts[2];
     const hr = parts[3] || "00", min = parts[4] || "00", sec = parts[5] || "00";
     return new Date(`${y}-${m}-${d}T${hr}:${min}:${sec}`);
  }
  return new Date(str);
}

// Format để hiển thị ra giao diện: dd/MM/yyyy
export function formatDateVN(str) {
  const d = parseDateString(str);
  if (!d || isNaN(d)) return "—";
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Format để hiển thị datetime ra giao diện: HH:mm dd/MM/yyyy
export function formatDateTimeVN(str) {
  const d = parseDateString(str);
  if (!d || isNaN(d)) return "—";
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hr = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hr}:${min} ${dd}/${mm}/${yyyy}`;
}

// Chuyển từ chuỗi nhận từ backend (dd/MM/yyyy) sang giá trị dùng cho <input type="date"> (YYYY-MM-DD)
export function toInputDate(str) {
  const d = parseDateString(str);
  if (!d || isNaN(d)) return "";
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// Chuyển từ giá trị của <input type="date"> (YYYY-MM-DD) sang chuỗi gửi cho backend (dd/MM/yyyy)
export function toBackendDate(str) {
  if (!str) return "";
  if (str.includes("/")) return str; // Tránh convert lại nếu đã đúng định dạng
  const parts = str.split("-");
  if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}
