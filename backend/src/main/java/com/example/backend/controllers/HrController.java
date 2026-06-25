package com.example.backend.controllers;

import com.example.backend.services.HrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/hr") // HR = Phòng Hành Chính
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class HrController {

    @Autowired
    private HrService hrService;

    /**
     * API Tra cứu thống kê chuyên cần và lương (PHC_BM 1)
     * Ví dụ gọi: GET /api/hr/report?year=2023&month=10
     */
    @GetMapping("/report")
    public List<Map<String, Object>> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {
        return hrService.getMonthlyReport(year, month);
    }

    @PostMapping("/import-staff")
    public Map<String, String> importStaff(@RequestParam("file") MultipartFile file) {
        // Giả định: lấy ID của HR từ token/session, ở đây demo hardcode 1L
        Long hrId = 1L; // Thay bằng cách lấy từ Authentication
        try {
            String message = hrService.importStaffFromExcel(file, hrId);
            Map<String, String> res = new HashMap<>();
            res.put("message", message);
            return res;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}