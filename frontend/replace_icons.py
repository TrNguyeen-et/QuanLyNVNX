import os
import re

FILES = [
    "c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Manager/ManagerDashboard.jsx",
    "c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Admin/AdminDashboard.jsx",
    "c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/HR/HrDashboard.jsx",
    "c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Staff/StaffDashboard.jsx"
]

ICON_MAP = {
    "🏠": "<Home size={18} color=\"var(--primary)\" />",
    "📅": "<CalendarDays size={18} color=\"var(--primary)\" />",
    "📝": "<FileText size={18} color=\"var(--primary)\" />",
    "🚨": "<AlertTriangle size={18} color=\"var(--primary)\" />",
    "📊": "<BarChart3 size={18} color=\"var(--primary)\" />",
    "👥": "<Users size={18} color=\"var(--primary)\" />",
    "🚗": "<Car size={24} color=\"var(--primary)\" style={{marginRight: 8}} />",
    "🔐": "<Lock size={18} color=\"var(--primary)\" />",
    "👷": "<HardHat size={18} color=\"var(--primary)\" />",
    "📋": "<ClipboardList size={18} color=\"var(--primary)\" />",
    "📁": "<Folder size={18} color=\"var(--primary)\" />",
    "📥": "<Download size={18} color=\"var(--primary)\" />",
    "📤": "<Upload size={18} color=\"var(--primary)\" />",
    "⚙️": "<Settings size={18} color=\"var(--primary)\" />",
    "💾": "<Save size={18} color=\"var(--primary)\" />",
    "🤝": "<Handshake size={18} color=\"var(--primary)\" />",
    "💰": "<Banknote size={18} color=\"var(--primary)\" />",
    "👤": "<User size={18} color=\"var(--primary)\" />",
    "📭": "<Inbox size={24} color=\"var(--primary)\" />",
    "🔍": "<Search size={18} color=\"var(--primary)\" />",
    "✅": "<CheckCircle2 size={18} color=\"var(--primary)\" />",
    "✏️": "<Pencil size={16} color=\"var(--primary)\" />",
    "🗑": "<Trash2 size={16} color=\"var(--danger)\" />",
    "✓": "<Check size={16} color=\"var(--primary)\" />",
    "✕": "<X size={16} color=\"var(--danger)\" />",
    "➕": "<Plus size={16} color=\"var(--primary)\" />",
    "🔄": "<RefreshCw size={16} color=\"var(--primary)\" />",
    "🏖️": "<Palmtree size={16} color=\"var(--primary)\" />",
    "🎫": "<Ticket size={16} color=\"var(--primary)\" />",
    "🎉": "<PartyPopper size={24} color=\"var(--primary)\" />",
    "💡": "<Lightbulb size={16} color=\"var(--warning)\" />",
    "♻️": "<RefreshCcw size={16} color=\"var(--primary)\" />",
    "📌": "<Pin size={16} color=\"var(--primary)\" />",
    "⚠️": "<AlertTriangle size={16} color=\"var(--warning)\" />",
}

IMPORT_STATEMENT = 'import { Home, CalendarDays, FileText, AlertTriangle, BarChart3, Users, Car, Lock, HardHat, ClipboardList, Folder, Download, Upload, Settings, Save, Handshake, Banknote, User, Inbox, Search, CheckCircle2, Pencil, Trash2, Check, X, Plus, RefreshCw, Palmtree, Ticket, PartyPopper, Lightbulb, RefreshCcw, Pin } from "lucide-react";\n'

for path in FILES:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if "import { Home" not in content:
        lines = content.split('\n')
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import_idx = i
        lines.insert(last_import_idx + 1, IMPORT_STATEMENT)
        content = '\n'.join(lines)

    for emoji, comp in ICON_MAP.items():
        content = content.replace(f'"{emoji}"', comp)
        # also wrap text ones
        content = content.replace(emoji, '{' + comp + '}')
        content = content.replace('{{<', '{<').replace('>}}', '>}')

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("Replacement done!")
