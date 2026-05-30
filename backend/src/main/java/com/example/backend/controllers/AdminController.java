package com.example.backend.controllers;

import com.example.backend.models.User;
import com.example.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.example.backend.repositories.AppLogRepository appLogRepository;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMonthlyBikes", 15240);
        stats.put("projectedRevenue", "30.4M");
        stats.put("activeStaff", 8);
        return stats;
    }

    @GetMapping("/parking-zones")
    public List<Map<String, Object>> getZones() {
        return List.of(
            Map.of("manager", "Nguyễn Văn A", "zone", "Khu A - Tòa Trung Tâm", "capacity", 500, "status", "OPEN"),
            Map.of("manager", "Trần Thị B", "zone", "Khu B - Thư Viện", "capacity", 300, "status", "OPEN")
        );
    }

    @GetMapping("/logs")
    public List<com.example.backend.models.AppLog> getLogs() {
        return appLogRepository.findAllByOrderByTimestampDesc();
    }

    @GetMapping("/system-status")
    public Map<String, Object> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        status.put("totalMemoryMB", totalMemory);
        status.put("usedMemoryMB", totalMemory - freeMemory);
        status.put("cpuCores", runtime.availableProcessors());
        status.put("uptime", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime());
        status.put("version", "v1.0.0");
        return status;
    }

    // --- QUẢN LÝ NGƯỜI DÙNG ---
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping("/users")
    public Map<String, Object> createUser(@RequestBody User newUser) {
        newUser.setStatus("ACTIVE"); 
        User savedUser = userRepository.save(newUser);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Tạo tài khoản cho " + savedUser.getFullName() + " thành công!");
        response.put("userId", savedUser.getId());
        return response;
    }

    @PutMapping("/users/{id}")
    @com.example.backend.annotations.LogAction("Cập nhật thông tin tài khoản")
    public User updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        if(userDetails.getFullName() != null) user.setFullName(userDetails.getFullName());
        if(userDetails.getUsername() != null) user.setUsername(userDetails.getUsername());
        if(userDetails.getRole() != null) user.setRole(userDetails.getRole());
        if(userDetails.getSalary() != null) user.setSalary(userDetails.getSalary());
        if(userDetails.getWorkShift() != null) user.setWorkShift(userDetails.getWorkShift());
        if(userDetails.getWorkDays() != null) user.setWorkDays(userDetails.getWorkDays());
        if(userDetails.getGroupName() != null) user.setGroupName(userDetails.getGroupName());
        
        return userRepository.save(user);
    }

    @DeleteMapping("/users/{id}")
    @com.example.backend.annotations.LogAction("Vô hiệu hóa tài khoản")
    public Map<String, String> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        // Soft delete
        user.setStatus("INACTIVE");
        userRepository.save(user);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Tài khoản đã bị vô hiệu hóa.");
        return response;
    }

    // --- SAO LƯU DỮ LIỆU ---
    @GetMapping(value = "/backup", produces = "application/sql")
    @com.example.backend.annotations.LogAction("Sao lưu cơ sở dữ liệu")
    public ResponseEntity<byte[]> backupDatabase() {
        try {
            String command = "mysqldump -u root -padmin123 -P 3306 -h 127.0.0.1 quan_ly_nha_xe";
            Process process = Runtime.getRuntime().exec(command);
            byte[] backupData = process.getInputStream().readAllBytes();
            
            if (backupData.length == 0) {
                byte[] errorData = process.getErrorStream().readAllBytes();
                String errorMsg = new String(errorData);
                System.err.println("Lỗi mysqldump: " + errorMsg);
                throw new RuntimeException("Lỗi khi backup: " + errorMsg);
            }
            
            String filename = "backup_quan_ly_nha_xe_" + java.time.LocalDate.now() + ".sql";
            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=" + filename);
            return new ResponseEntity<>(backupData, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}