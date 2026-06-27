import os
import re

files = [
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Admin/AdminDashboard.jsx',
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Manager/ManagerDashboard.jsx',
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/HR/HrDashboard.jsx',
    'c:/Users/l/OneDrive/Desktop/TEST CNPM/frontend/src/pages/Staff/StaffDashboard.jsx'
]

pattern = re.compile(r'"(<[A-Za-z0-9]+ size=\{[0-9]+\} color="var\(--accent\)" \/>[^"]*)"')

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = pattern.sub(r'<>\1</>', content)

    # Some might start with text and end with icon, or just an icon
    # So let's also do a pass for that
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Fixed", file_path)
