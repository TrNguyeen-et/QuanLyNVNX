package com.example.backend.controllers;

import com.example.backend.models.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
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
    @Autowired private IncidentRepository incidentRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;

    @GetMapping("/{userId}/schedule")
    public List<ShiftAssignment> getMySchedule(@PathVariable long userId) {
        User staff = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        return shiftAssignmentRepository.findByUser(staff);
    }

    @PostMapping("/check-in")
    public Map<String, Object> checkIn(@RequestBody Map<String, Object> data) {
        long assignmentId = Long.parseLong(data.get("assignmentId").toString());
        ShiftAssignment assignment = shiftAssignmentRepository.findById(assignmentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        LocalDateTime now = LocalDateTime.now();
        LocalTime actualTime = now.toLocalTime();
        LocalTime shiftStart = assignment.getShift().getStartTime();

        Attendance att = new Attendance();
        att.setShiftAssignment(assignment);
        att.setCheckInTime(now);

        long minutesLate = Duration.between(shiftStart, actualTime).toMinutes();
        double penalty = 0.0; String status = "ON_TIME";
        if (minutesLate > 0) { status = "LATE"; if (minutesLate < 15) penalty = 20000; else if (minutesLate <= 30) penalty = 50000; else penalty = 100000; }
        
        att.setPenaltyFee(penalty); att.setStatus(status);
        attendanceRepository.save(att);
        assignment.setStatus(status); shiftAssignmentRepository.save(assignment);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success"); res.put("message", "Check-in thanh cong!"); res.put("minutesLate", minutesLate > 0 ? minutesLate : 0); res.put("penaltyFee", penalty);
        return res;
    }

    @PostMapping("/check-out")
    public Map<String, Object> checkOut(@RequestBody Map<String, Object> data) {
        long assignmentId = Long.parseLong(data.get("assignmentId").toString());
        ShiftAssignment assignment = shiftAssignmentRepository.findById(assignmentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        Attendance att = attendanceRepository.findByShiftAssignment(assignment);
        if (att == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chua check-in");
        att.setCheckOutTime(LocalDateTime.now()); attendanceRepository.save(att);
        assignment.setStatus("COMPLETED"); shiftAssignmentRepository.save(assignment);
        Map<String, Object> res = new HashMap<>(); res.put("status", "success"); res.put("message", "Check-out thanh cong!"); return res;
    }

    @GetMapping("/{userId}/my-salary")
    public Map<String, Object> getMySalary(@PathVariable long userId) {
        User staff = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        List<ShiftAssignment> assignments = shiftAssignmentRepository.findByUser(staff);
        double totalPay = 0, totalPenalty = 0; int shifts = 0;
        for (ShiftAssignment a : assignments) {
            if ("COMPLETED".equals(a.getStatus())) {
                shifts++;
                if (a.getShift() != null && a.getShift().getShiftPrice() != null) totalPay += a.getShift().getShiftPrice();
                Attendance att = attendanceRepository.findByShiftAssignment(a);
                if (att != null && att.getPenaltyFee() != null) totalPenalty += att.getPenaltyFee();
            }
        }
        Map<String, Object> sal = new HashMap<>(); sal.put("fullName", staff.getFullName()); sal.put("completedShifts", shifts); sal.put("totalShiftPay", totalPay); sal.put("totalPenalty", totalPenalty); sal.put("finalSalary", totalPay - totalPenalty);
        return sal;
    }

    @PostMapping("/report-incident")
    public Map<String, String> reportIncident(@RequestBody Map<String, String> data) {
        Long userId = Long.parseLong(data.get("userId")); String content = data.get("content");
        if (content == null || content.trim().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty");
        Incident inc = new Incident(); inc.setUserId(userId); inc.setContent(content); inc.setReportTime(LocalDateTime.now()); inc.setStatus("PENDING");
        incidentRepository.save(inc);
        Map<String, String> res = new HashMap<>(); res.put("message", "Thanh cong!"); return res;
    }

    @PostMapping("/request-leave")
    public Map<String, String> requestLeave(@RequestBody Map<String, String> data) {
        User u = userRepository.findById(Long.parseLong(data.get("userId"))).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        LeaveRequest r = new LeaveRequest(); r.setUser(u); r.setRequestType("LEAVE"); r.setTargetDate(java.time.LocalDate.parse(data.get("targetDate"))); r.setReason(data.get("reason")); r.setStatus("PENDING");
        leaveRequestRepository.save(r);
        Map<String, String> res = new HashMap<>(); res.put("message", "Thanh cong!"); return res;
    }

    @PostMapping("/request-swap")
    public Map<String, String> requestSwap(@RequestBody Map<String, String> data) {
        User u = userRepository.findById(Long.parseLong(data.get("userId"))).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        User sub = userRepository.findById(Long.parseLong(data.get("substituteUserId"))).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        LeaveRequest r = new LeaveRequest(); r.setUser(u); r.setSubstituteUser(sub); r.setRequestType("SHIFT_SWAP"); r.setTargetDate(java.time.LocalDate.parse(data.get("targetDate"))); r.setReason(data.get("reason")); r.setStatus("PENDING");
        leaveRequestRepository.save(r);
        Map<String, String> res = new HashMap<>(); res.put("message", "Thanh cong!"); return res;
    }

    @GetMapping("/{userId}/my-requests") public List<LeaveRequest> getMyRequests(@PathVariable long userId) { return leaveRequestRepository.findByUserId(userId); }
    @GetMapping("/{userId}/my-incidents") public List<Incident> getMyIncidents(@PathVariable long userId) { return incidentRepository.findByUserId(userId); }
}