package com.example.backend.services;

import com.example.backend.entities.*;
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
public class LeaveRequestService {

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private NotificationService notificationService;

    /**
     * Logic Duyệt đơn nghỉ phép / đổi ca (Liên kết Manager và Staff)
     */
    public Map<String, String> approveLeave(Long id, boolean isApproved) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn"));

        // Cập nhật trạng thái đơn
        request.setStatus(isApproved ? "APPROVED" : "REJECTED");
        leaveRequestRepository.save(request);

        // ========== LOGIC ĐỔI CA TỰ ĐỘNG ==========
        // Nếu Manager duyệt ĐỔI CA -> Tự động cập nhật lại bảng phân ca
        if (isApproved && "SHIFT_SWAP".equals(request.getRequestType()) && request.getSubstituteUser() != null) {
            User originalUser = request.getUser();
            User substituteUser = request.getSubstituteUser();
            LocalDate targetDate = request.getTargetDate();

            // Tìm tất cả các ca của người xin đổi vào ngày đó
            List<ShiftAssignment> originalAssignments = shiftAssignmentRepository.findByUserAndWorkDate(originalUser, targetDate);

            for (ShiftAssignment assignment : originalAssignments) {
                // Chuyển ca đó sang tên người trực thay
                assignment.setUser(substituteUser);
                shiftAssignmentRepository.save(assignment);
                
                String shiftName = (assignment.getShift() != null) ? assignment.getShift().getShiftName() : "không rõ";
                notificationService.createNotification(
                    substituteUser, 
                    "Bạn đã được nhận ca '" + shiftName + "' vào ngày " + targetDate + " do " + originalUser.getFullName() + " chuyển giao.", 
                    "ASSIGNMENT"
                );
            }
        }
        // ==========================================

        String actionStr = isApproved ? "được chấp nhận" : "bị từ chối";
        String reqTypeStr = "SHIFT_SWAP".equals(request.getRequestType()) ? "đổi ca" : "xin nghỉ";
        notificationService.createNotification(request.getUser(), "Đơn " + reqTypeStr + " ngày " + request.getTargetDate() + " đã " + actionStr + ".", "LEAVE");

        Map<String, String> res = new HashMap<>();
        res.put("message", isApproved ? "Duyệt thành công!" : "Đã từ chối đơn!");
        if (isApproved && "SHIFT_SWAP".equals(request.getRequestType())) {
            res.put("detail", "Đã tự động chuyển ca trực sang tên nhân viên thay.");
        }
        return res;
    }
}