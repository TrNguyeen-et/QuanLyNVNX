package com.example.backend.controllers;

import com.example.backend.entities.*;
import com.example.backend.repositories.*;
import com.example.backend.services.ShiftService;
import com.example.backend.services.ManagerReportService;
import org.springframework.web.multipart.MultipartFile;
import com.example.backend.services.LeaveRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class ManagerController {

    @GetMapping("/hr-report")
    public List<Map<String, Object>> getMonthlyReport(@RequestParam int year, @RequestParam int month) {
        return managerReportService.getMonthlyReport(year, month);
    }

    @PostMapping("/import-staff")
    public Map<String, Object> importStaff(@RequestParam("file") MultipartFile file) {
        Long managerId = 1L; // demo hardcode
        try {
            return managerReportService.importStaffFromExcel(file, managerId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PostMapping("/import-excel/confirm")
    public Map<String, String> confirmImport(@RequestBody List<Long> draftIds) {
        List<EmployeeImportDraft> drafts = employeeImportDraftRepository.findAllById(draftIds);
        for (EmployeeImportDraft draft : drafts) {
            if ("PREVIEW".equals(draft.getStatus())) {
                draft.setStatus("PENDING");
            }
        }
        employeeImportDraftRepository.saveAll(drafts);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Đã xác nhận và gửi " + drafts.size() + " hồ sơ cho Admin!");
        return res;
    }

    @PostMapping("/import-excel/cancel")
    public Map<String, String> cancelImport(@RequestBody List<Long> draftIds) {
        List<EmployeeImportDraft> drafts = employeeImportDraftRepository.findAllById(draftIds);
        for (EmployeeImportDraft draft : drafts) {
            if ("PREVIEW".equals(draft.getStatus())) {
                employeeImportDraftRepository.delete(draft);
            }
        }
        Map<String, String> res = new HashMap<>();
        res.put("message", "Đã hủy thao tác import!");
        return res;
    }

    @Autowired private com.example.backend.repositories.EmployeeImportDraftRepository employeeImportDraftRepository;

    @PostMapping("/add-staff-draft")
    public Map<String, String> addStaffDraft(@RequestBody EmployeeImportDraft draft) {
        if (draft.getFullName() == null || draft.getFullName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin bắt buộc!");
        }
        if ("ACCOUNTANT".equals(draft.getRole())) {
            draft.setRole("ACCOUNTANT");
        } else {
            draft.setRole("STAFF");
        }

        // Tự động cấp tài khoản theo vai trò
        String prefix = "STAFF".equals(draft.getRole()) ? "nv" : "kt";
        int count = 1;
        String generatedUsername = String.format("%s%03d", prefix, count);
        while (userRepository.findByUsername(generatedUsername).isPresent() ||
               employeeImportDraftRepository.existsByUsername(generatedUsername)) {
            count++;
            generatedUsername = String.format("%s%03d", prefix, count);
        }
        draft.setUsername(generatedUsername);
        draft.setStatus("PENDING");
        draft.setUploadedAt(java.time.LocalDateTime.now());
        draft.setUploadedBy(1L); // hardcode manager id
        employeeImportDraftRepository.save(draft);

        Map<String, String> res = new HashMap<>();
        res.put("message", "Đã tạo bản nháp thành công, chờ Admin duyệt.");
        return res;
    }

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private IncidentRepository incidentRepository;
    @Autowired private ShiftService shiftService;
    @Autowired private LeaveRequestService leaveRequestService;
    @Autowired private ManagerReportService managerReportService;
    @Autowired private com.example.backend.services.EmailService emailService;
    @Autowired private com.example.backend.services.NotificationService notificationService;

    @GetMapping("/staff-list")
    public List<User> getAllStaff() { return userRepository.findAll(); }

    @GetMapping("/shifts")
    public List<Shift> getShifts() { return shiftRepository.findAll(); }

    // FIX: dùng đúng path variable type là long (primitive) tránh null warning
    @PutMapping("/update-staff/{id}")
    public User updateStaff(@PathVariable long id, @RequestBody User s) {
        return userRepository.findById(id).map(u -> {
            u.setFullName(s.getFullName());
            u.setRole(s.getRole());
            if (s.getSalary() != null) u.setSalary(s.getSalary());
            if (s.getStatus() != null) u.setStatus(s.getStatus());
            if (s.getEmail() != null) u.setEmail(s.getEmail());
            if (s.getPosition() != null) u.setPosition(s.getPosition());
            if (s.getWorkShift() != null) u.setWorkShift(s.getWorkShift());
            if (s.getWorkDays() != null) u.setWorkDays(s.getWorkDays());
            return userRepository.save(u);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
    }

    @GetMapping("/assignments")
    public List<ShiftAssignment> getAssignments(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        if (date != null) {
            return shiftAssignmentRepository.findByWorkDate(LocalDate.parse(date, DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }
        if (month != null && year != null) {
            LocalDate start = LocalDate.of(year, month, 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            return shiftAssignmentRepository.findByWorkDateBetween(start, end);
        }
        return new ArrayList<>();
    }

    @DeleteMapping("/assignments/{id}")
    public Map<String, String> deleteAssignment(@PathVariable long id) {
        if (!shiftAssignmentRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phân công");
        shiftAssignmentRepository.deleteById(id);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Đã xóa phân công!");
        return res;
    }

    @PutMapping("/assignments/{id}")
    public Map<String, Object> updateAssignment(@PathVariable long id, @RequestBody Map<String, Object> data) {
        ShiftAssignment sa = shiftAssignmentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phân công"));
        
        if (data.containsKey("position")) {
            sa.setPosition(data.get("position").toString());
        }
        if (data.containsKey("shiftId")) {
            long shiftId = Long.parseLong(data.get("shiftId").toString());
            Shift shift = shiftRepository.findById(shiftId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca"));
            sa.setShift(shift);
        }
        if (data.containsKey("userId")) {
            long userId = Long.parseLong(data.get("userId").toString());
            User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user"));
            sa.setUser(user);
        }

        shiftAssignmentRepository.save(sa);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Đã cập nhật phân công!");
        return res;
    }

    @PostMapping("/assign-shift")
    public Map<String, Object> assignShift(@RequestBody Map<String, Object> data) {
        return shiftService.assignShift(data);
    }

    @GetMapping("/calculate-salaries")
    public List<Map<String, Object>> getSalaryReport() {
        List<User> staffs = userRepository.findAll();
        List<Map<String, Object>> report = new ArrayList<>();
        for (User s : staffs) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", s.getFullName());
            List<ShiftAssignment> assigns = shiftAssignmentRepository.findByUser(s);
            double pay = 0, penalty = 0;
            int comp = 0;
            for (ShiftAssignment a : assigns) {
                if ("COMPLETED".equals(a.getStatus()) || "DONE".equals(a.getStatus())) {
                    comp++;
                    if (a.getShift() != null && a.getShift().getShiftPrice() != null)
                        pay += a.getShift().getShiftPrice();
                    Attendance att = attendanceRepository.findByShiftAssignment(a);
                    if (att != null && att.getPenaltyFee() != null)
                        penalty += att.getPenaltyFee();
                }
            }
            item.put("shifts", comp);
            item.put("pay", pay);
            item.put("penalty", penalty);
            item.put("final", pay - penalty);
            item.put("userId", s.getId()); // added userId for payslip sending
            item.put("email", s.getEmail());
            report.add(item);
        }
        return report;
    }

    @PostMapping("/send-payslip")
    public Map<String, Object> sendPayslip(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String monthYear = YearMonth.now().toString(); // Mặc định là tháng hiện tại (yyyy-MM)
        
        User s = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user"));
        
        List<ShiftAssignment> assigns = shiftAssignmentRepository.findByUser(s);
        double pay = 0, penalty = 0;
        int comp = 0, lateCount = 0;
        for (ShiftAssignment a : assigns) {
            if ("COMPLETED".equals(a.getStatus()) || "DONE".equals(a.getStatus())) {
                comp++;
                if (a.getShift() != null && a.getShift().getShiftPrice() != null)
                    pay += a.getShift().getShiftPrice();
                Attendance att = attendanceRepository.findByShiftAssignment(a);
                if (att != null && att.getPenaltyFee() != null) {
                    penalty += att.getPenaltyFee();
                    if (att.getPenaltyFee() > 0) lateCount++;
                }
            }
        }
        
        if (s.getEmail() == null || s.getEmail().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhân viên chưa có địa chỉ email!");
        }

        emailService.sendPayslipEmail(s.getEmail(), s.getFullName(), monthYear, pay - penalty, comp, lateCount, penalty);
        
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Đã gửi phiếu lương thành công đến " + s.getEmail());
        return res;
    }

    @GetMapping("/reports/late")
    public List<Map<String, Object>> getLateReports() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Attendance att : attendanceRepository.findAll()) {
            if (att.getPenaltyFee() != null && att.getPenaltyFee() > 0) {
                Map<String, Object> m = new HashMap<>();
                // FIX: null-safe access
                ShiftAssignment sa = att.getShiftAssignment();
                m.put("name",    sa != null && sa.getUser() != null ? sa.getUser().getFullName() : "?");
                m.put("date",    att.getCheckInTime() != null ? att.getCheckInTime().toLocalDate() : null);
                m.put("penalty", att.getPenaltyFee());
                m.put("status",  att.getStatus());
                list.add(m);
            }
        }
        return list;
    }

    @GetMapping("/leave-requests")
    public List<LeaveRequest> getPendingLeaves() {
        return leaveRequestRepository.findByStatus("PENDING");
    }

    @GetMapping("/all-leave-requests")
    public List<LeaveRequest> getAllLeaves() {
        return leaveRequestRepository.findAll();
    }

    @PutMapping("/leave-requests/{id}/approve")
    public Map<String, String> approveLeave(@PathVariable long id, @RequestParam boolean isApproved) {
        return leaveRequestService.approveLeave(id, isApproved);
    }

    @GetMapping("/incidents")
    public List<Incident> getIncidents() { return incidentRepository.findByStatus("PENDING"); }

    @GetMapping("/all-incidents")
    public List<Incident> getAllIncidents() { return incidentRepository.findAll(); }

    @PutMapping("/incidents/{id}/resolve")
    public Map<String, String> resolveInc(@PathVariable long id) {
        Incident i = incidentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        i.setStatus("RESOLVED");
        incidentRepository.save(i);
        if (i.getUserId() != null) {
            userRepository.findById(i.getUserId()).ifPresent(user -> {
                String content = i.getContent() != null ? i.getContent() : "Không rõ";
                if (content.length() > 20) content = content.substring(0, 20) + "...";
                notificationService.createNotification(user, "Sự cố '" + content + "' đã được xử lý.", "INCIDENT");
            });
        }
        
        Map<String, String> res = new HashMap<>();
        res.put("message", "Done!");
        return res;
    }

    @GetMapping("/attendance")
    public List<Attendance> getAttendance() { return attendanceRepository.findAll(); }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        s.put("totalStaff",       userRepository.findByRole("STAFF").size());
        s.put("pendingRequests",  leaveRequestRepository.findByStatus("PENDING").size());
        s.put("pendingIncidents", incidentRepository.findByStatus("PENDING").size());
        s.put("todayAssignments", shiftAssignmentRepository.findByWorkDate(LocalDate.now()).size());
        return s;
    }

    @GetMapping("/alerts/missing-staff")
    public List<Map<String, Object>> getMissingStaffAlert() {
        LocalDate today = LocalDate.now();
        LocalTime now   = LocalTime.now();
        List<ShiftAssignment> todayAssignments = shiftAssignmentRepository.findByWorkDate(today);
        List<Map<String, Object>> alerts = new ArrayList<>();

        for (ShiftAssignment assign : todayAssignments) {
            Shift shift = assign.getShift();
            // FIX: null-safe shift access
            if (shift == null || shift.getStartTime() == null) continue;
            if (now.isAfter(shift.getStartTime().plusMinutes(10))) {
                Attendance att = attendanceRepository.findByShiftAssignment(assign);
                if (att == null || att.getCheckInTime() == null) {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("staffName", assign.getUser() != null ? assign.getUser().getFullName() : "?");
                    alert.put("shiftName", shift.getShiftName());
                    alert.put("startTime", shift.getStartTime());
                    alert.put("message",   "Vắng mặt! Đã trễ quá 10 phút mà chưa check-in.");
                    alerts.add(alert);
                }
            }
        }
        return alerts;
    }

    @Autowired private com.example.backend.services.AdminService adminService;
    @Autowired private com.example.backend.repositories.AuditLogRepository auditLogRepository;

    private void log(String action, String actor) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setActor(actor);
        log.setTimestamp(java.time.LocalDateTime.now());
        auditLogRepository.save(log);
    }
    
    @GetMapping("/configs")
    public List<SystemConfig> getConfigs() {
        return adminService.getAllConfigs();
    }

    @PutMapping("/configs/{key}")
    public SystemConfig updateConfig(@PathVariable String key, @RequestBody Map<String, String> body) {
        String newValue = body.get("configValue");
        log("Thay đổi cấu hình " + key + " thành " + newValue, "MANAGER");
        return adminService.updateConfig(key, newValue);
    }
}
