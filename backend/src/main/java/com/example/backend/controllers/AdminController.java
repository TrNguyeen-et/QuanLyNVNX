package com.example.backend.controllers;

import com.example.backend.models.User;
import com.example.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

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

    // --- PHẦN VIỆC CỦA BẠN: TẠO TÀI KHOẢN NHÂN VIÊN ---
    @PostMapping("/create-account")
    public Map<String, Object> createStaffAccount(@RequestBody User newUser) {
        newUser.setStatus("ACTIVE"); // Mặc định lúc tạo là đang làm việc
        User savedUser = userRepository.save(newUser);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Tạo tài khoản cho " + savedUser.getFullName() + " thành công!");
        response.put("userId", savedUser.getId());
        return response;
    }
}