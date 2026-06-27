import os
import re

backend_dir = r"c:\Users\l\OneDrive\Desktop\TEST CNPM\backend\src\main\java\com\example\backend"

# 1. Rename HrService to ManagerReportService
hr_service_path = os.path.join(backend_dir, "services", "HrService.java")
manager_service_path = os.path.join(backend_dir, "services", "ManagerReportService.java")

with open(hr_service_path, "r", encoding="utf-8") as f:
    hr_service_content = f.read()

hr_service_content = hr_service_content.replace("class HrService", "class ManagerReportService")
with open(manager_service_path, "w", encoding="utf-8") as f:
    f.write(hr_service_content)

os.remove(hr_service_path)

# 2. Update ManagerController.java
manager_controller_path = os.path.join(backend_dir, "controllers", "ManagerController.java")
with open(manager_controller_path, "r", encoding="utf-8") as f:
    mc_content = f.read()

# Add imports if needed
if "import com.example.backend.services.ManagerReportService;" not in mc_content:
    mc_content = mc_content.replace("import com.example.backend.services.ShiftService;", "import com.example.backend.services.ShiftService;\nimport com.example.backend.services.ManagerReportService;\nimport org.springframework.web.multipart.MultipartFile;")

# Inject ManagerReportService
mc_content = mc_content.replace("@Autowired private LeaveRequestService leaveRequestService;", "@Autowired private LeaveRequestService leaveRequestService;\n    @Autowired private ManagerReportService managerReportService;")

# Add endpoints
endpoints = """
    @GetMapping("/hr-report")
    public List<Map<String, Object>> getMonthlyReport(@RequestParam int year, @RequestParam int month) {
        return managerReportService.getMonthlyReport(year, month);
    }

    @PostMapping("/import-staff")
    public Map<String, String> importStaff(@RequestParam("file") MultipartFile file) {
        Long managerId = 1L; // demo hardcode
        try {
            String message = managerReportService.importStaffFromExcel(file, managerId);
            Map<String, String> res = new HashMap<>();
            res.put("message", message);
            return res;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
"""
mc_content = mc_content.replace("public class ManagerController {\n", "public class ManagerController {\n" + endpoints)

with open(manager_controller_path, "w", encoding="utf-8") as f:
    f.write(mc_content)

# 3. Delete HrController
hr_controller_path = os.path.join(backend_dir, "controllers", "HrController.java")
if os.path.exists(hr_controller_path):
    os.remove(hr_controller_path)

print("Backend refactored successfully.")
