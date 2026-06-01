package com.example.backend.controllers;

import com.example.backend.models.AuditLog;
import com.example.backend.models.SystemConfig;
import com.example.backend.models.User;
import com.example.backend.repositories.AuditLogRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.services.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private AdminService adminService; // Inject Service

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

    // ==================== CẤU HÌNH HỆ THỐNG (YÊU CẦU PHI CHỨC NĂNG) ====================

    /**
     * Lấy danh sách cấu hình hệ thống (Lớn nhất là mức phạt đi trễ)
     */
    @GetMapping("/configs")
    public List<SystemConfig> getConfigs() {
        return adminService.getAllConfigs();
    }

    /**
     * Cập nhật cấu hình hệ thống (Ví dụ: đổi tiền phạt từ 20k thành 30k mà không cần sửa code)
     */
    @PutMapping("/configs/{key}")
    public SystemConfig updateConfig(@PathVariable String key, @RequestBody Map<String, String> body) {
        String newValue = body.get("configValue");
        log("Thay đổi cấu hình " + key + " thành " + newValue, "ADMIN");
        return adminService.updateConfig(key, newValue);
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
}