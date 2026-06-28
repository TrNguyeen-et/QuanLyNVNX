package com.example.backend.services;

import com.example.backend.entities.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@SuppressWarnings("null")
public class ShiftService {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private NotificationService notificationService;

    /**
     * Xếp ca làm việc theo Quy định QLNX_QĐ 1
     */
    public Map<String, Object> assignShift(Map<String, Object> data) {
        long userId = Long.parseLong(data.get("userId").toString());
        long shiftId = Long.parseLong(data.get("shiftId").toString());
        LocalDate date = LocalDate.parse(data.get("workDate").toString(), DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String position = data.getOrDefault("position", "XEP_XE").toString(); // Mặc định là Xếp xe nếu không gửi

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca làm"));

        // ========== VALIDATE QUY ĐỊNH QLNX_QĐ 1 ==========

        // 1. Không xếp 1 nhân viên vào cùng 1 ca trong ngày
        List<ShiftAssignment> existingAssignments = shiftAssignmentRepository.findByUserAndWorkDate(user, date);
        for (ShiftAssignment sa : existingAssignments) {
            if (sa.getShift() != null && sa.getShift().getId().equals(shiftId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Nhân viên " + user.getFullName() + " đã được phân vào ca này trong ngày " + date + "!");
            }
        }

        // ==================================================

        // Lưu vào DB nếu hợp lệ
        ShiftAssignment assignment = new ShiftAssignment();
        assignment.setUser(user);
        assignment.setShift(shift);
        assignment.setWorkDate(date);
        assignment.setPosition(position);
        assignment.setStatus("SCHEDULED");
        shiftAssignmentRepository.save(assignment);

        notificationService.createNotification(user, "Bạn đã được phân công ca '" + shift.getShiftName() + "' vào ngày " + date, "ASSIGNMENT");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Phân ca thành công! Vị trí: " + position);
        res.put("assignmentId", assignment.getId());
        return res;
    }
}