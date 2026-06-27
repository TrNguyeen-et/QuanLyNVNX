import os
import re

files = [
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Admin/AdminDashboard.css',
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Manager/ManagerDashboard.css',
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Staff/StaffDashboard.css'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update .stat-icon to include color: var(--accent);
    # First find .stat-icon { ... }
    # Let's just append color: var(--accent) before } if not already there
    content = re.sub(r'(\.stat-icon\s*\{[^}]*)(\})', r'\1 color: var(--accent); \2', content)

    # 2. Update .stat-icon.* colors to use blue background
    content = re.sub(r'\.stat-icon\.blue\s*\{[^}]*\}', '.stat-icon.blue { background: rgba(79,142,247,0.15); }', content)
    content = re.sub(r'\.stat-icon\.green\s*\{[^}]*\}', '.stat-icon.green { background: rgba(79,142,247,0.15); }', content)
    content = re.sub(r'\.stat-icon\.yellow\s*\{[^}]*\}', '.stat-icon.yellow { background: rgba(79,142,247,0.15); }', content)
    content = re.sub(r'\.stat-icon\.red\s*\{[^}]*\}', '.stat-icon.red { background: rgba(79,142,247,0.15); }', content)
    content = re.sub(r'\.stat-icon\.purple\s*\{[^}]*\}', '.stat-icon.purple { background: rgba(79,142,247,0.15); }', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        print("Fixed", file_path)
