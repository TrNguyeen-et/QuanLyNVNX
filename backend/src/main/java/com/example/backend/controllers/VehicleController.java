package com.example.backend.controllers;

import com.example.backend.models.VehicleLog;
import com.example.backend.repositories.VehicleLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    @Autowired
    private VehicleLogRepository vehicleLogRepository;

    @PostMapping("/swipe-card")
    public Map<String, Object> swipeCard(@RequestBody Map<String, String> request) {
        String licensePlate = request.get("licensePlate");
        String zoneName = request.get("zoneName");

        Optional<VehicleLog> existingLog = vehicleLogRepository.findByLicensePlateAndStatus(licensePlate, "IN");

        if (existingLog.isPresent()) {
            // Xe đang ở trong bãi -> Đánh dấu OUT
            VehicleLog log = existingLog.get();
            log.setTimeOut(LocalDateTime.now());
            log.setStatus("OUT");
            vehicleLogRepository.save(log);
            return Map.of("status", "success", "message", "Xe ra khỏi bãi", "vehicle", log);
        } else {
            // Xe chưa ở trong bãi -> Đánh dấu IN
            VehicleLog log = new VehicleLog();
            log.setLicensePlate(licensePlate);
            log.setZoneName(zoneName != null ? zoneName : "Khu Vực Chung");
            log.setTimeIn(LocalDateTime.now());
            log.setStatus("IN");
            vehicleLogRepository.save(log);
            return Map.of("status", "success", "message", "Xe vào bãi", "vehicle", log);
        }
    }

    @GetMapping("/stats")
    public List<Map<String, Object>> getVehicleStats() {
        List<VehicleLog> allLogs = vehicleLogRepository.findAll();
        Map<String, Integer> zoneCounts = new HashMap<>();

        for (VehicleLog log : allLogs) {
            if ("IN".equals(log.getStatus())) {
                String zone = log.getZoneName();
                zoneCounts.put(zone, zoneCounts.getOrDefault(zone, 0) + 1);
            }
        }

        List<Map<String, Object>> stats = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : zoneCounts.entrySet()) {
            stats.add(Map.of("zone", entry.getKey(), "count", entry.getValue()));
        }

        return stats;
    }
}
