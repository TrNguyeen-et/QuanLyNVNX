package com.example.backend.controllers;

import com.example.backend.models.*;
import com.example.backend.repositories.*;
import com.example.backend.services.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
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
        req.setTargetDate(LocalDate.parse(body.get("targetDate").toString()));
        req.setReason(body.get("reason").toString());
        req.setStatus("PENDING");

        if ("LEAVE".equals(req.getRequestType()) && !req.getTargetDate().isAfter(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vi phạm QLNX_QĐ 2: Xin nghỉ phép phải báo trước ít nhất 24 tiếng!");

        if ("SHIFT_SWAP".equals(req.getRequestType()) && body.get("substituteUserId") != null) {
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
        LocalDate workDate = LocalDate.parse(date);
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
}
