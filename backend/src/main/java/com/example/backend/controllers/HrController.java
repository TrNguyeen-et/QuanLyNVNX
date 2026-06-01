package com.example.backend.controllers;

import com.example.backend.services.HrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
}