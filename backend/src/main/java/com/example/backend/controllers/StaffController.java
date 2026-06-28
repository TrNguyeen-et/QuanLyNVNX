package com.example.backend.controllers;

import com.example.backend.entities.*;
import com.example.backend.repositories.*;
import com.example.backend.services.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.YearMonth;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class StaffController {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private IncidentRepository incidentRepository;
    @Autowired private AttendanceService attendanceService;

    @GetMapping("/{userId}/schedule")
    public List<ShiftAssignment> getSchedule(
            @PathVariable Long userId,
            @RequestParam(required = false) String month) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));

        List<ShiftAssignment> assignments = shiftAssignmentRepository.findByUser(user);

        if (month != null && !month.isEmpty()) {
            String[] parts = month.split("-");
            int year = Integer.parseInt(parts[0]);
            int mon  = Integer.parseInt(parts[1]);
            assignments = assignments.stream()
                    .filter(a -> a.getWorkDate().getYear() == year && a.getWorkDate().getMonthValue() == mon)
                    .collect(java.util.stream.Collectors.toList());
        }
        return assignments;
    }

    @GetMapping("/{userId}/schedule-by-date")
    public List<ShiftAssignment> getScheduleByDate(
            @PathVariable Long userId,
            @RequestParam String date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
        LocalDate d = LocalDate.parse(date, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        return shiftAssignmentRepository.findByUserAndWorkDate(user, d);
    }

    @PostMapping("/checkin")
    public Map<String, Object> checkIn(@RequestBody Map<String, Long> body) {
        Long assignmentId = body.getOrDefault("assignmentId", null);
        return attendanceService.processCheckIn(assignmentId);
    }

    @PostMapping("/checkout")
    public Map<String, Object> checkOut(@RequestBody Map<String, Long> body) {
        Long assignmentId = body.getOrDefault("assignmentId", null);
        return attendanceService.processCheckOut(assignmentId);
    }

    @GetMapping("/attendance/{assignmentId}")
    public Attendance getAttendance(@PathVariable Long assignmentId) {
        ShiftAssignment assignment = shiftAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca làm"));
        Attendance attendance = attendanceRepository.findByShiftAssignment(assignment);
        if (attendance == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có dữ liệu chấm công");
        return attendance;
    }

    @PostMapping("/handover")
    public Map<String, String> confirmHandover(@RequestBody Map<String, Long> body) {
        Long assignmentId = body.getOrDefault("assignmentId", null);
        if (assignmentId == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã ca làm việc!");

        ShiftAssignment assignment = shiftAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca làm"));

        assignment.setStatus("HANDED_OVER");
        shiftAssignmentRepository.save(assignment);

        Map<String, String> res = new HashMap<>();
        res.put("message", "Xác nhận bàn giao ca thành công! Bạn có thể check-out.");
        return res;
    }

    @GetMapping("/{userId}/requests")
    public List<LeaveRequest> getMyRequests(@PathVariable Long userId) {
        return leaveRequestRepository.findByUser_Id(userId);
    }

    @PostMapping("/request")
    public LeaveRequest submitRequest(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));

        LeaveRequest req = new LeaveRequest();
        req.setUser(user);
        req.setRequestType(body.get("requestType").toString());
        req.setTargetDate(LocalDate.parse(body.get("targetDate").toString(), DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        if (body.get("shiftName") != null && !body.get("shiftName").toString().trim().isEmpty()) {
            req.setShiftName(body.get("shiftName").toString());
        }
        req.setReason(body.get("reason").toString());
        req.setStatus("PENDING");

        // Validate shift existence
        List<ShiftAssignment> assignments = shiftAssignmentRepository.findByUserAndWorkDate(user, req.getTargetDate());
        if (assignments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không có ca làm việc nào trong ngày " + req.getTargetDate());
        }
        if (req.getShiftName() != null) {
            boolean hasShift = assignments.stream().anyMatch(a -> a.getShift() != null && req.getShiftName().equals(a.getShift().getShiftName()));
            if (!hasShift) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không có " + req.getShiftName() + " trong ngày " + req.getTargetDate());
            }
        }

        if ("LEAVE".equals(req.getRequestType()) && !req.getTargetDate().isAfter(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vi phạm QLNX_QĐ 2: Xin nghỉ phép phải báo trước ít nhất 24 tiếng!");

        if ("SHIFT_SWAP".equals(req.getRequestType())) {
            if (body.get("substituteUserId") == null || body.get("substituteUserId").toString().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đổi ca phải chọn người trực thay!");
            }
            Long subId = Long.valueOf(body.get("substituteUserId").toString());
            userRepository.findById(subId).ifPresent(req::setSubstituteUser);
        }
        return leaveRequestRepository.save(req);
    }

    @DeleteMapping("/request/{id}")
    public Map<String, String> cancelRequest(@PathVariable Long id) {
        LeaveRequest req = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn"));
        if (!"PENDING".equals(req.getStatus()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể hủy đơn đang chờ duyệt!");
        leaveRequestRepository.deleteById(id);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Hủy đơn thành công!");
        return res;
    }

    @GetMapping("/{userId}/incidents")
    public List<Incident> getMyIncidents(@PathVariable Long userId) {
        return incidentRepository.findByUserId(userId);
    }

    @PostMapping("/incident")
    public Incident reportIncident(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
        Incident incident = new Incident();
        incident.setUserId(userId);
        incident.setContent(body.get("content").toString());
        incident.setReportTime(LocalDateTime.now());
        incident.setStatus("PENDING");
        return incidentRepository.save(incident);
    }

    @GetMapping("/colleagues")
    public List<User> getColleagues(@RequestParam String date) {
        LocalDate workDate = LocalDate.parse(date, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        List<ShiftAssignment> assignments = shiftAssignmentRepository.findByWorkDate(workDate);
        List<User> colleagues = new ArrayList<>();
        for (ShiftAssignment a : assignments) {
            if (!colleagues.contains(a.getUser())) colleagues.add(a.getUser());
        }
        return colleagues;
    }

    @GetMapping("/user/{id}")
    public User getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
    }

    @GetMapping("/all-staff")
    public List<User> getAllStaff() {
        return userRepository.findByRole("STAFF");
    }
    @GetMapping("/{userId}/salary")
    public Map<String, Object> getMySalary(
        @PathVariable Long userId,
        @RequestParam int year,
        @RequestParam int month) {

    // 1. Kiểm tra người dùng tồn tại
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));

    // 2. Xác định khoảng thời gian cần tính (đầu tháng -> cuối tháng)
    LocalDate start = LocalDate.of(year, month, 1);
    LocalDate end = YearMonth.of(year, month).atEndOfMonth();

    // 3. Lấy tất cả ca làm việc của nhân viên trong tháng đó
    List<ShiftAssignment> assignments = shiftAssignmentRepository.findByUserAndWorkDateBetween(user, start, end);

    // 4. Tính toán
    double totalPay = 0.0;
    double totalPenalty = 0.0;
    int completedShifts = 0;
    int lateCount = 0;

    for (ShiftAssignment sa : assignments) {
        // Cộng lương ca (nếu ca có giá)
        if (sa.getShift() != null && sa.getShift().getShiftPrice() != null) {
            totalPay += sa.getShift().getShiftPrice();
        }
        // Lấy attendance của ca đó
        Attendance att = attendanceRepository.findByShiftAssignment(sa);
        if (att != null) {
            // Cộng phạt (nếu có)
            if (att.getPenaltyFee() != null && att.getPenaltyFee() > 0) {
                totalPenalty += att.getPenaltyFee();
                lateCount++;
            }
            // Đếm ca đã hoàn thành (có check-out)
            if ("COMPLETED".equals(att.getStatus())) {
                completedShifts++;
            }
        }
    }

    // 5. Đóng gói kết quả trả về
    Map<String, Object> response = new HashMap<>();
    response.put("staffName", user.getFullName());
    response.put("year", year);
    response.put("month", month);
    response.put("totalShifts", completedShifts);
    response.put("totalPay", totalPay);
    response.put("totalPenalty", totalPenalty);
    response.put("netSalary", totalPay - totalPenalty);
    response.put("lateCount", lateCount);
    return response;
}

    
}
