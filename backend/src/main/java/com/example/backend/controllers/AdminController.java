package com.example.backend.controllers;

import com.example.backend.entities.AuditLog;
import com.example.backend.entities.SystemConfig;
import com.example.backend.entities.User;
import com.example.backend.repositories.AuditLogRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.AuditLogRepository;
import com.example.backend.repositories.EmployeeImportDraftRepository;
import com.example.backend.repositories.SystemConfigRepository;
import com.example.backend.services.AdminService;
import com.example.backend.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.backend.entities.EmployeeImportDraft;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private EmployeeImportDraftRepository draftRepository;
    @Autowired private SystemConfigRepository systemConfigRepository;
    @Autowired private AdminService adminService; // Inject Service
    @Autowired private EmailService emailService;

    private void log(String action, String actor) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setActor(actor);
        log.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(log);
    }

    // ==================== QUẢN LÝ TÀI KHOẢN ====================

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        s.put("totalUsers", userRepository.findAll().size());
        return s;
    }

    @GetMapping("/users")
    public List<User> getAll() { return userRepository.findAll(); }

    @GetMapping("/logs")
    public List<AuditLog> getLogs() { return auditLogRepository.findAllByOrderByIdDesc(); }

    @PostMapping("/create-account")
    public Map<String, Object> create(@RequestBody User u) {
        // Áp dụng ADM_QĐ 1: Chỉ cấp tài khoản cho nhân sự chính thức (Trạng thái ACTIVE)
        if (u.getStatus() == null || !u.getStatus().equals("ACTIVE")) {
            u.setStatus("ACTIVE"); // Mặc định set ACTIVE khi tạo qua hệ thống
        }
        User saved = userRepository.save(u);
        log("Tạo tài khoản: " + u.getUsername(), "ADMIN");

        if (u.getEmail() != null && !u.getEmail().trim().isEmpty()) {
            emailService.sendWelcomeEmail(
                u.getEmail(),
                u.getFullName(),
                u.getUsername(),
                u.getPassword()
            );
        }

        Map<String, Object> r = new HashMap<>();
        r.put("status", "success");
        r.put("message", "Tạo thành công!");
        r.put("userId", saved.getId());
        return r;
    }

    @PutMapping("/users/{id}")
    public User update(@PathVariable long id, @RequestBody User u) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(u.getUsername());
            user.setFullName(u.getFullName());
            user.setRole(u.getRole());
            user.setStatus(u.getStatus());
            if (u.getPassword() != null && !u.getPassword().trim().isEmpty()) {
                user.setPassword(u.getPassword());
            }
            if (u.getSalary() != null) user.setSalary(u.getSalary());
            if (u.getWorkShift() != null) user.setWorkShift(u.getWorkShift());
            if (u.getWorkDays() != null) user.setWorkDays(u.getWorkDays());
            if (u.getPosition() != null) user.setPosition(u.getPosition());
            if (u.getEmail() != null) user.setEmail(u.getEmail());
            
            log("Cập nhật tài khoản ID: " + id, "ADMIN");
            return userRepository.save(user);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
    }

    @DeleteMapping("/users/{id}")
    public Map<String, String> delete(@PathVariable long id) {
        if(!userRepository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        userRepository.deleteById(id);
        log("Xóa tài khoản ID: " + id, "ADMIN");
        Map<String, String> r = new HashMap<>();
        r.put("message", "Xóa thành công!");
        return r;
    }



    // ==================== SAO LƯU & PHỤC HỒI DỮ LIỆU ====================

    /**
     * API Sao lưu dữ liệu (Frontend gọi và download file JSON về)
     */
    @GetMapping("/backup")
    public Map<String, Object> backupData() {
        log("Thực hiện sao lưu dữ liệu", "ADMIN");
        return adminService.backupData();
    }

    /**
     * API Phục hồi dữ liệu (Frontend upload file JSON lên)
     */
    @PostMapping("/restore")
    public Map<String, String> restoreData(@RequestBody List<User> users) {
        log("Thực hiện phục hồi dữ liệu", "ADMIN");
        String message = adminService.restoreUsers(users);
        Map<String, String> res = new HashMap<>();
        res.put("message", message);
        return res;
    }

    @GetMapping("/pending-imports")
    public List<EmployeeImportDraft> getPendingImports() {
        return adminService.getPendingImports();
    }

    @PostMapping("/pending-imports/approve")
    public Map<String, Object> approveImports(@RequestBody List<Long> draftIds) {
        // Giả định adminId từ token
        Long adminId = 1L; // Thay bằng thực tế
        int count = adminService.approveImports(draftIds, adminId);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Đã cấp tài khoản thành công cho " + count + " nhân viên.");
        res.put("approvedCount", count);
        return res;
    }

    @PostMapping("/pending-imports/reject")
    public Map<String, String> rejectImports(@RequestBody List<Long> draftIds,
                                             @RequestParam(required = false) String reason) {
        Long adminId = 1L;
        adminService.rejectImports(draftIds, adminId, reason);
        return Map.of("message", "Đã từ chối " + draftIds.size() + " hồ sơ.");
    }

    // ==================== BẢO TRÌ HỆ THỐNG ====================

    @GetMapping("/maintenance/status")
    public Map<String, Object> getMaintenanceStatus() {
        boolean isMaintenance = systemConfigRepository.findById("MAINTENANCE_MODE")
                .map(config -> "true".equalsIgnoreCase(config.getConfigValue()))
                .orElse(false);
        String duration = systemConfigRepository.findById("MAINTENANCE_TIME")
                .map(SystemConfig::getConfigValue)
                .orElse("");
        return Map.of("maintenanceMode", isMaintenance, "duration", duration);
    }

    @PostMapping("/maintenance/toggle")
    public Map<String, Object> toggleMaintenance(@RequestBody(required = false) Map<String, Object> body) {
        boolean enable = false;
        String duration = "";
        
        if (body != null && body.containsKey("enabled")) {
            enable = Boolean.TRUE.equals(body.get("enabled"));
            duration = (String) body.getOrDefault("duration", "");
        } else {
            // Fallback: simple toggle
            boolean current = systemConfigRepository.findById("MAINTENANCE_MODE")
                .map(config -> "true".equalsIgnoreCase(config.getConfigValue()))
                .orElse(false);
            enable = !current;
        }

        SystemConfig modeConfig = systemConfigRepository.findById("MAINTENANCE_MODE").orElse(new SystemConfig());
        modeConfig.setConfigKey("MAINTENANCE_MODE");
        modeConfig.setConfigValue(enable ? "true" : "false");
        modeConfig.setDescription("Trạng thái bảo trì hệ thống");
        systemConfigRepository.save(modeConfig);
        
        SystemConfig timeConfig = systemConfigRepository.findById("MAINTENANCE_TIME").orElse(new SystemConfig());
        timeConfig.setConfigKey("MAINTENANCE_TIME");
        timeConfig.setConfigValue(duration);
        timeConfig.setDescription("Thời gian bảo trì dự kiến");
        systemConfigRepository.save(timeConfig);

        log(enable ? "Bật chế độ bảo trì" : "Tắt chế độ bảo trì", "ADMIN");
        return Map.of(
            "maintenanceMode", enable,
            "duration", duration != null ? duration : "",
            "message", enable ? "Đã bật chế độ bảo trì!" : "Đã tắt chế độ bảo trì!"
        );
    }

    @PostMapping("/maintenance/clear-logs")
    public Map<String, String> clearOldLogs() {
        auditLogRepository.deleteByTimestampBefore(LocalDateTime.now().minusDays(30));
        log("Dọn dẹp nhật ký hệ thống (cũ hơn 30 ngày)", "ADMIN");
        return Map.of("message", "Đã dọn dẹp nhật ký cũ thành công!");
    }

    @PostMapping("/maintenance/clear-drafts")
    public Map<String, String> clearDrafts() {
        draftRepository.deleteByStatus("REJECTED");
        log("Dọn dẹp hồ sơ nháp bị từ chối", "ADMIN");
        return Map.of("message", "Đã dọn dẹp hồ sơ rác thành công!");
    }
}