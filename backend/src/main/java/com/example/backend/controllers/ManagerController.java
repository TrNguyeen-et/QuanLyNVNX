package com.example.backend.controllers;
import com.example.backend.models.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "*")
public class ManagerController {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private AttendanceRepository attendanceRepository;

    @GetMapping("/staff-list")
    public List<User> getAllStaff() { return userRepository.findAll(); }

    @PutMapping("/update-staff/{id}")
    public User updateStaff(@PathVariable long id, @RequestBody User staffDetails) {
        return userRepository.findById(id).map(user -> {
            user.setFullName(staffDetails.getFullName());
            user.setRole(staffDetails.getRole());
            user.setSalary(staffDetails.getSalary()); 
            user.setStatus(staffDetails.getStatus()); 
            return userRepository.save(user);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay nhan vien hop le!"));
    }

    // --- PHẦN VIỆC CỦA BẠN: TÍNH LƯƠNG CHUẨN THEO CA VÀ PHẠT ---
    @GetMapping("/calculate-salaries")
    public List<Map<String, Object>> getSalaryReport() {
        List<User> staffs = userRepository.findAll();
        List<Map<String, Object>> report = new ArrayList<>();
        
        for (User s : staffs) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", s.getFullName());
            
            List<ShiftAssignment> assignments = shiftAssignmentRepository.findByUser(s);
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
            item.put("completedShifts", completedShifts);
            item.put("totalShiftPay", totalShiftPay);
            item.put("totalPenalty", totalPenalty);
            item.put("finalSalary", totalShiftPay - totalPenalty); // Lương thực tế
            
            report.add(item);
        }
        return report;
    }

    @PostMapping("/assign-shift")
    public Map<String, Object> assignShiftToStaff(@RequestBody Map<String, Object> requestData) {
        long userId = Long.parseLong(requestData.get("userId").toString());
        long shiftId = Long.parseLong(requestData.get("shiftId").toString());
        LocalDate workDate = LocalDate.parse(requestData.get("workDate").toString());

        User staff = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay nhan vien"));
        Shift shift = shiftRepository.findById(shiftId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ca truc"));

        ShiftAssignment assignment = new ShiftAssignment();
        assignment.setUser(staff);
        assignment.setShift(shift);
        assignment.setWorkDate(workDate);
        assignment.setStatus("SCHEDULED");
        shiftAssignmentRepository.save(assignment);

        return Map.of("status", "success", "message", "Da phan ca thanh cong");
    }

    @GetMapping("/leave-requests")
    public List<LeaveRequest> getPendingLeaveRequests() { 
        return leaveRequestRepository.findByStatus("PENDING"); 
    }

    @PutMapping("/leave-requests/{id}/approve")
    public Map<String, String> approveLeaveRequest(@PathVariable long id, @RequestParam boolean isApproved) {
        LeaveRequest request = leaveRequestRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay don"));
            
        request.setStatus(isApproved ? "APPROVED" : "REJECTED");
        leaveRequestRepository.save(request);
        return Map.of("message", isApproved ? "Da duyet don" : "Da tu choi don");
    }
}