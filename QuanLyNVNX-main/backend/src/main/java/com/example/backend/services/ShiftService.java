package com.example.backend.services;

import com.example.backend.models.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@SuppressWarnings("null")
public class ShiftService {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;

    /**
     * Xếp ca làm việc theo Quy định QLNX_QĐ 1
     */
    public Map<String, Object> assignShift(Map<String, Object> data) {
        long userId = Long.parseLong(data.get("userId").toString());
        long shiftId = Long.parseLong(data.get("shiftId").toString());
        LocalDate date = LocalDate.parse(data.get("workDate").toString());
        String position = data.getOrDefault("position", "XEP_XE").toString(); // Mặc định là Xếp xe nếu không gửi

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca làm"));

        // ========== VALIDATE QUY ĐỊNH QLNX_QĐ 1 ==========

        // 1. Không xếp 1 nhân viên làm 2 ca liên tiếp (Cùng ngày)
        List<ShiftAssignment> existingAssignments = shiftAssignmentRepository.findByUserAndWorkDate(user, date);
        if (!existingAssignments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Vi phạm QLNX_QĐ 1: Nhân viên " + user.getFullName() + " đã có ca trực trong ngày " + date + ". Không được xếp 2 ca liên tiếp!");
        }

        // 2. Mỗi ca phải đảm bảo tối thiểu 1 người kiểm soát vé và 1 người sắp xếp xe
        List<ShiftAssignment> currentShiftStaff = shiftAssignmentRepository.findByShiftIdAndWorkDate(shiftId, date);
        
        long veCount = currentShiftStaff.stream().filter(a -> "KIEM_SOAT_VE".equals(a.getPosition())).count();
        long xepCount = currentShiftStaff.stream().filter(a -> "XEP_XE".equals(a.getPosition())).count();

        // Nếu vị trí cần thêm là Kiem soát vé, nhưng đã có người rồi -> Chỉ cho phép thêm Xếp xe
        if ("KIEM_SOAT_VE".equals(position) && veCount >= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Vi phạm QLNX_QĐ 1: Ca này đã có người Kiểm soát vé. Vui lòng chọn vị trí Xếp xe!");
        }
        // Nếu vị trí cần thêm là Xếp xe, nhưng đã có người rồi -> Chỉ cho phép thêm Kiem soát vé
        if ("XEP_XE".equals(position) && xepCount >= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Vi phạm QLNX_QĐ 1: Ca này đã có người Xếp xe. Vui lòng chọn vị trí Kiểm soát vé!");
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

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Phân ca thành công! Vị trí: " + position);
        res.put("assignmentId", assignment.getId());
        return res;
    }
}