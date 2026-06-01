package com.example.backend.services;

import com.example.backend.models.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
@SuppressWarnings("null") 
public class AttendanceService {

    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private SystemConfigRepository configRepository;

    public Map<String, Object> processCheckIn(Long assignmentId) {
        if (assignmentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã ca làm việc!");
        }

        ShiftAssignment assignment = shiftAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca làm"));

        Attendance existing = attendanceRepository.findByShiftAssignment(assignment);
        if (existing != null && existing.getCheckInTime() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đã check in rồi!");
        }

        LocalDateTime checkInTime = LocalDateTime.now();
        Double penaltyFee = 0.0;
        String note = "Đúng giờ.";

        Shift shift = assignment.getShift();
        if (shift != null && shift.getStartTime() != null) {
            LocalTime shiftStartTime = shift.getStartTime(); 
            LocalTime actualCheckInTime = checkInTime.toLocalTime(); 

            if (actualCheckInTime.isAfter(shiftStartTime)) {
                long minutesLate = Duration.between(shiftStartTime, actualCheckInTime).toMinutes();

                // Lấy mức phạt từ DB một cách an toàn
                Double p15 = getConfigValue("PENALTY_15MIN", 20000.0);
                Double p30 = getConfigValue("PENALTY_30MIN", 50000.0);
                Double pOver30 = getConfigValue("PENALTY_OVER_30MIN", 100000.0);

                if (minutesLate <= 15) {
                    penaltyFee = p15; 
                    note = "Trễ " + minutesLate + " phút. Phạt " + String.format("%,.0f", penaltyFee) + " VNĐ.";
                } else if (minutesLate <= 30) {
                    penaltyFee = p30; 
                    note = "Trễ " + minutesLate + " phút. Phạt " + String.format("%,.0f", penaltyFee) + " VNĐ.";
                } else {
                    penaltyFee = pOver30; 
                    note = "Trễ " + minutesLate + " phút. Phạt " + String.format("%,.0f", penaltyFee) + " VNĐ.";
                }
            }
        }

        Attendance attendance = existing != null ? existing : new Attendance();
        attendance.setShiftAssignment(assignment);
        attendance.setCheckInTime(checkInTime);
        attendance.setPenaltyFee(penaltyFee); 
        attendance.setStatus(penaltyFee > 0 ? "LATE" : "ON_TIME"); 
        attendanceRepository.save(attendance);

        assignment.setStatus("IN_PROGRESS");
        shiftAssignmentRepository.save(assignment);

        Map<String, Object> res = new HashMap<>();
        res.put("message", penaltyFee > 0 ? "Check in thành công (Đi trễ)!" : "Check in thành công!");
        res.put("checkInTime", attendance.getCheckInTime());
        res.put("penaltyFee", penaltyFee);
        res.put("note", note);
        return res;
    }

    public Map<String, Object> processCheckOut(Long assignmentId) {
        if (assignmentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã ca làm việc!");
        }

        ShiftAssignment assignment = shiftAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca làm"));

        Attendance attendance = attendanceRepository.findByShiftAssignment(assignment);
        if (attendance == null || attendance.getCheckInTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa check in!");
        }
        if (attendance.getCheckOutTime() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đã check out rồi!");
        }

        LocalDateTime checkOutTime = LocalDateTime.now();
        Double penaltyFee = attendance.getPenaltyFee() != null ? attendance.getPenaltyFee() : 0.0; 

        attendance.setCheckOutTime(checkOutTime);
        attendance.setPenaltyFee(penaltyFee); 
        attendance.setStatus("COMPLETED");
        attendanceRepository.save(attendance);

        assignment.setStatus("DONE");
        shiftAssignmentRepository.save(assignment);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Check out thành công!");
        res.put("checkOutTime", attendance.getCheckOutTime());
        res.put("totalPenaltyFee", penaltyFee); 
        if(penaltyFee > 0) {
            res.put("warning", "Bạn đã bị trừ tổng cộng " + String.format("%,.0f", penaltyFee) + " VNĐ do đi trễ/về sớm!");
        }
        return res;
    }

    // Hàm phụ trợ đọc Config từ DB, nếu null thì lấy giá trị mặc định (Tránh Dead code warning)
    private Double getConfigValue(String key, Double defaultValue) {
        SystemConfig config = configRepository.findById(key).orElse(null);
        if (config != null && config.getConfigValue() != null) {
            try {
                return Double.parseDouble(config.getConfigValue());
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }
}