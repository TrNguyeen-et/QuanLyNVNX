package com.example.backend.controllers;

import com.example.backend.models.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin("*")
public class StaffController {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private IncidentRepository incidentRepository; // Thêm mới

    @GetMapping("/{userId}/schedule")
    public List<ShiftAssignment> getMySchedule(@PathVariable long userId) {
        User staff = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay nhan vien"));
        return shiftAssignmentRepository.findByUser(staff);
    }

    @PostMapping("/check-in")
    public Map<String, Object> checkIn(@RequestBody Map<String, Object> data) {
        long assignmentId = Long.parseLong(data.get("assignmentId").toString());
        ShiftAssignment assignment = shiftAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ca truc"));

        LocalDateTime now = LocalDateTime.now();
        LocalTime actualCheckInTime = now.toLocalTime();
        LocalTime shiftStartTime = assignment.getShift().getStartTime();

        Attendance attendance = new Attendance();
        attendance.setShiftAssignment(assignment); 
        attendance.setCheckInTime(now);

        long minutesLate = Duration.between(shiftStartTime, actualCheckInTime).toMinutes();
        double penalty = 0; 
        String status = "ON_TIME";

        if (minutesLate > 0) {
            status = "LATE";
            if (minutesLate < 15) penalty = 20000;
            else if (minutesLate <= 30) penalty = 50000;
            else penalty = 100000;
        }

        attendance.setPenaltyFee(penalty); 
        attendance.setStatus(status);
        attendanceRepository.save(attendance);

        return Map.of("status", "success", "message", "Check-in thanh cong!", "minutesLate", minutesLate > 0 ? minutesLate : 0, "penaltyFee", penalty);
    }

    @PostMapping("/check-out")
    public Map<String, Object> checkOut(@RequestBody Map<String, Object> data) {
        long assignmentId = Long.parseLong(data.get("assignmentId").toString());
        ShiftAssignment assignment = shiftAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ca truc"));

        Attendance attendance = attendanceRepository.findByShiftAssignment(assignment);
        if (attendance == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ban chua Check-in!");

        attendance.setCheckOutTime(LocalDateTime.now());
        attendanceRepository.save(attendance);

        assignment.setStatus("COMPLETED");
        shiftAssignmentRepository.save(assignment);

        return Map.of("status", "success", "message", "Check-out thanh cong!");
    }

    // --- PHẦN VIỆC CỦA BẠN: XEM LƯƠNG CÁ NHÂN ---
    @GetMapping("/{userId}/my-salary")
    public Map<String, Object> getMySalary(@PathVariable long userId) {
        User staff = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay nhan vien"));
            
        List<ShiftAssignment> assignments = shiftAssignmentRepository.findByUser(staff);
        
        double totalShiftPay = 0; 
        double totalPenalty = 0; 
        int completedShifts = 0;

        for (ShiftAssignment assignment : assignments) {
            if ("COMPLETED".equals(assignment.getStatus())) {
                completedShifts++;
                totalShiftPay += assignment.getShift().getShiftPrice() != null ? assignment.getShift().getShiftPrice() : 0;
                Attendance att = attendanceRepository.findByShiftAssignment(assignment);
                if (att != null && att.getPenaltyFee() != null) {
                    totalPenalty += att.getPenaltyFee();
                }
            }
        }

        Map<String, Object> salaryData = new HashMap<>();
        salaryData.put("fullName", staff.getFullName());
        salaryData.put("completedShifts", completedShifts);
        salaryData.put("totalShiftPay", totalShiftPay);
        salaryData.put("totalPenalty", totalPenalty);
        salaryData.put("finalSalary", totalShiftPay - totalPenalty);

        return salaryData;
    }

    // --- PHẦN VIỆC MỚI: GHI NHẬN SỰ CỐ CA TRỰC ---
    @PostMapping("/report-incident")
    public Map<String, String> reportIncident(@RequestBody Map<String, String> data) {
        Long userId = Long.parseLong(data.get("userId"));
        String content = data.get("content");

        if (content == null || content.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Noi dung su co khong duoc de trong");
        }

        Incident incident = new Incident();
        incident.setUserId(userId);
        incident.setContent(content);
        incident.setReportTime(LocalDateTime.now());
        
        incidentRepository.save(incident);

        return Map.of("message", "Da gui bien ban ghi nhan su co thanh cong!");
    }
}