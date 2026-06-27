import os
import re

def update_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Dictionary of replacements
    replacements = {
        "📊": '<BarChart2 size={18} color="var(--accent)" />',
        "🔐": '<Lock size={16} color="var(--accent)" />',
        "📋": '<ClipboardList size={18} color="var(--accent)" />',
        "📁": '<Folder size={16} color="var(--accent)" />',
        "👷": '<HardHat size={16} color="var(--accent)" />',
        "🔍": '<Search size={16} color="var(--accent)" />',
        "✏️": '<Edit size={16} color="var(--accent)" />',
        "➕": '<PlusCircle size={18} color="var(--accent)" />',
        "💾": '<Save size={16} color="var(--accent)" />',
        "👥": '<Users size={18} color="var(--accent)" />',
        "🗑": '<Trash2 size={16} color="var(--accent)" />',
        "📥": '<Download size={16} color="var(--accent)" />',
        "❌": '<XCircle size={16} color="var(--accent)" />',
        "🔄": '<RefreshCw size={16} color="var(--accent)" />',
        "⚙️": '<Settings size={18} color="var(--accent)" />',
        "📌": '<Pin size={16} color="var(--accent)" />',
        "💡": '<Lightbulb size={16} color="var(--accent)" />',
        "♻️": '<RefreshCcw size={18} color="var(--accent)" />',
        "🎫": '<Ticket size={16} color="var(--accent)" />',
        "🚗": '<Car size={16} color="var(--accent)" />',
        "✕": '<X size={16} color="var(--accent)" />',
        "📝": '<FileText size={18} color="var(--accent)" />',
        "🏖️": '<Sun size={16} color="var(--accent)" />',
        "✓": '<Check size={16} color="var(--accent)" />',
        "🚨": '<AlertTriangle size={18} color="var(--accent)" />',
        "💰": '<Banknote size={18} color="var(--accent)" />',
        "📤": '<Upload size={18} color="var(--accent)" />',
        "🏁": '<Flag size={16} color="var(--accent)" />',
        "🤝": '<Handshake size={18} color="var(--accent)" />',
        "✅": '<CheckCircle size={16} color="var(--accent)" />',
        "⚠️": '<AlertTriangle size={16} color="var(--accent)" />',
        '<div className="emoji">📭</div>': '<div className="emoji" style={{color: "var(--accent)"}}><Inbox size={48} /></div>',
        '<div className="emoji">✅</div>': '<div className="emoji" style={{color: "var(--accent)"}}><CheckCircle size={48} /></div>',
        '<div className="emoji">🎉</div>': '<div className="emoji" style={{color: "var(--accent)"}}><PartyPopper size={48} /></div>',
        '<div className="emoji">🔍</div>': '<div className="emoji" style={{color: "var(--accent)"}}><Search size={48} /></div>',
        '<div className="emoji">⚙️</div>': '<div className="emoji" style={{color: "var(--accent)"}}><Settings size={48} /></div>',
    }
    
    # We also have to handle strings in JS like flashMsg("✅ ...")
    content = content.replace('"✅ Cập nhật tài khoản thành công!"', '"Cập nhật tài khoản thành công!"')
    content = content.replace('`✅ ${data.message} (ID: ${data.userId})`', '`${data.message} (ID: ${data.userId})`')
    content = content.replace('`✅ ${data.message}`', '`${data.message}`')
    content = content.replace('`✅ ${data.message}${data.detail ? " " + data.detail : ""}`', '`${data.message}${data.detail ? " " + data.detail : ""}`')
    content = content.replace('"✅ Đã cập nhật cấu hình ${key}!"', '"Đã cập nhật cấu hình ${key}!"')
    content = content.replace('`✅ Đã cập nhật cấu hình ${key}!`', '`Đã cập nhật cấu hình ${key}!`')
    content = content.replace('`✅ Sao lưu thành công! Tổng ${data.totalRecords || "?"} bản ghi.`', '`Sao lưu thành công! Tổng ${data.totalRecords || "?"} bản ghi.`')
    content = content.replace('"⚠️ Phục hồi dữ liệu sẽ ghi đè lên dữ liệu hiện tại. Bạn chắc chắn?"', '"Cảnh báo: Phục hồi dữ liệu sẽ ghi đè lên dữ liệu hiện tại. Bạn chắc chắn?"')
    content = content.replace('"✅ Đã đánh dấu xử lý xong!"', '"Đã đánh dấu xử lý xong!"')
    content = content.replace('"✅ Cập nhật thành công!"', '"Cập nhật thành công!"')
    content = content.replace('"✅ Gửi đơn thành công!"', '"Gửi đơn thành công!"')
    content = content.replace('"✅ Báo cáo sự cố đã được gửi!"', '"Báo cáo sự cố đã được gửi!"')

    for k, v in replacements.items():
        content = content.replace(k, v)

    # Need to add imports for all the newly used icons.
    used_icons = set()
    for match in re.finditer(r'<([A-Z][a-zA-Z0-9]+)\s+size', content):
        used_icons.add(match.group(1))
    
    import_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+["\']lucide-react["\'];', content)
    if import_match:
        existing = set(i.strip() for i in import_match.group(1).split(','))
        combined = sorted(list(existing | used_icons))
        new_import = 'import { ' + ', '.join(combined) + ' } from "lucide-react";'
        content = content[:import_match.start()] + new_import + content[import_match.end():]
    else:
        new_import = 'import { ' + ', '.join(sorted(list(used_icons))) + ' } from "lucide-react";\n'
        content = new_import + content
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Admin/AdminDashboard.jsx',
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Manager/ManagerDashboard.jsx',
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/HR/HrDashboard.jsx',
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Staff/StaffDashboard.jsx'
]

for f in files:
    update_file(f)
    print("Updated", f)

