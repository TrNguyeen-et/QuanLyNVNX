package com.example.backend.controllers;

import com.example.backend.entities.User;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.SystemConfigRepository;
import com.example.backend.entities.SystemConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @PostMapping("/login")
    public org.springframework.http.ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");

        User user = userRepository.findByUsername(username).orElse(null);
        
        if (user == null || !user.getPassword().equals(password)) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Sai tên đăng nhập hoặc mật khẩu");
            return org.springframework.http.ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        if (!"ADMIN".equals(user.getRole())) {
            SystemConfig config = systemConfigRepository.findById("MAINTENANCE_MODE").orElse(null);
            if (config != null && "true".equalsIgnoreCase(config.getConfigValue())) {
                String duration = systemConfigRepository.findById("MAINTENANCE_TIME")
                        .map(SystemConfig::getConfigValue)
                        .orElse("");
                String timeMsg = (duration != null && !duration.trim().isEmpty()) ? " trong " + duration : "";
                
                Map<String, String> error = new HashMap<>();
                error.put("message", "Hệ thống đang được bảo trì" + timeMsg + ", vui lòng quay lại sau!");
                return org.springframework.http.ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("fullName", user.getFullName());
        response.put("role", user.getRole());
        response.put("email", user.getEmail());
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public Map<String, Object> changePassword(@RequestBody Map<String, String> data) {
        String userIdStr = data.get("userId");
        String oldPassword = data.get("oldPassword");
        String newPassword = data.get("newPassword");

        if (userIdStr == null || oldPassword == null || newPassword == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin");
        }

        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID người dùng không hợp lệ");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        if (!user.getPassword().equals(oldPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu cũ không chính xác");
        }

        user.setPassword(newPassword);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đổi mật khẩu thành công");
        return response;
    }
}