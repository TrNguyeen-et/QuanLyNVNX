package com.example.backend.controllers;

import com.example.backend.models.User;
import com.example.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    @com.example.backend.annotations.LogAction("Đăng nhập hệ thống")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        User user = userRepository.findByUsername(username);
        if (user != null && user.getPassword() != null && user.getPassword().equals(password)) {
            if ("INACTIVE".equals(user.getStatus())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Tài khoản đã bị khóa hoặc vô hiệu hóa.");
                return ResponseEntity.status(403).body(error);
            }
            return ResponseEntity.ok(user);
        }
        
        Map<String, String> error = new HashMap<>();
        error.put("message", "Tên đăng nhập hoặc mật khẩu không đúng.");
        return ResponseEntity.status(401).body(error);
    }

    @PutMapping("/change-password/{id}")
    @com.example.backend.annotations.LogAction("Đổi mật khẩu")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> passwords) {
        String oldPassword = passwords.get("oldPassword");
        String newPassword = passwords.get("newPassword");

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Người dùng không tồn tại.");
            return ResponseEntity.status(404).body(error);
        }

        if (!user.getPassword().equals(oldPassword)) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Mật khẩu cũ không chính xác.");
            return ResponseEntity.status(400).body(error);
        }

        user.setPassword(newPassword);
        userRepository.save(user);

        Map<String, String> success = new HashMap<>();
        success.put("message", "Đổi mật khẩu thành công!");
        return ResponseEntity.ok(success);
    }
}
