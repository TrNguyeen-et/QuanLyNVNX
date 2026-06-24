package com.example.backend.controllers;

import com.example.backend.models.*;
import com.example.backend.repositories.*;
import com.example.backend.services.ShiftService;
import com.example.backend.services.LeaveRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class ManagerController {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private IncidentRepository incidentRepository;
    @Autowired private ShiftService shiftService;
    @Autowired private LeaveRequestService leaveRequestService;

    @GetMapping("/staff-list")
    public List<User> getAllStaff() { return userRepository.findAll(); }

    @GetMapping("/shifts")
    public List<Shift> getShifts() { return shiftRepository.findAll(); }

    // FIX: dùng đúng path variable type là long (primitive) tránh null warning
    @PutMapping("/update-staff/{id}")
    public User updateStaff(@PathVariable long id, @RequestBody User s) {
        return userRepository.findById(id).map(u -> {
            u.setFullName(s.getFullName());
            u.setRole(s.getRole());
            u.setSalary(s.getSalary());
            u.setStatus(s.getStatus());
            return userRepository.save(u);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
    }

    @GetMapping("/assignments")
    public List<ShiftAssignment> getAssignmentsByDate(@RequestParam String date) {
        return shiftAssignmentRepository.findByWorkDate(LocalDate.parse(date));
    }

    @DeleteMapping("/assignments/{id}")
    public Map<String, String> deleteAssignment(@PathVariable long id) {
        if (!shiftAssignmentRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phân công");
        shiftAssignmentRepository.deleteById(id);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Đã xóa phân công!");
        return res;
    }

    @PostMapping("/assign-shift")
    public Map<String, Object> assignShift(@RequestBody Map<String, Object> data) {
        return shiftService.assignShift(data);
    }

    @GetMapping("/calculate-salaries")
    public List<Map<String, Object>> getSalaryReport() {
        List<User> staffs = userRepository.findAll();
        List<Map<String, Object>> report = new ArrayList<>();
        for (User s : staffs) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", s.getFullName());
            List<ShiftAssignment> assigns = shiftAssignmentRepository.findByUser(s);
            double pay = 0, penalty = 0;
            int comp = 0;
            for (ShiftAssignment a : assigns) {
                if ("COMPLETED".equals(a.getStatus()) || "DONE".equals(a.getStatus())) {
                    comp++;
                    if (a.getShift() != null && a.getShift().getShiftPrice() != null)
                        pay += a.getShift().getShiftPrice();
                    Attendance att = attendanceRepository.findByShiftAssignment(a);
                    if (att != null && att.getPenaltyFee() != null)
                        penalty += att.getPenaltyFee();
                }
            }
            item.put("shifts", comp);
            item.put("pay", pay);
            item.put("penalty", penalty);
            item.put("final", pay - penalty);
            report.add(item);
        }
        return report;
    }

    @GetMapping("/reports/late")
    public List<Map<String, Object>> getLateReports() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Attendance att : attendanceRepository.findAll()) {
            if (att.getPenaltyFee() != null && att.getPenaltyFee() > 0) {
                Map<String, Object> m = new HashMap<>();
                // FIX: null-safe access
                ShiftAssignment sa = att.getShiftAssignment();
                m.put("name",    sa != null && sa.getUser() != null ? sa.getUser().getFullName() : "?");
                m.put("date",    att.getCheckInTime() != null ? att.getCheckInTime().toLocalDate() : null);
                m.put("penalty", att.getPenaltyFee());
                m.put("status",  att.getStatus());
                list.add(m);
            }
        }
        return list;
    }

    @GetMapping("/leave-requests")
    public List<LeaveRequest> getPendingLeaves() {
        return leaveRequestRepository.findByStatus("PENDING");
    }

    @PutMapping("/leave-requests/{id}/approve")
    public Map<String, String> approveLeave(@PathVariable long id, @RequestParam boolean isApproved) {
        return leaveRequestService.approveLeave(id, isApproved);
    }

    @GetMapping("/incidents")
    public List<Incident> getIncidents() { return incidentRepository.findByStatus("PENDING"); }

    @PutMapping("/incidents/{id}/resolve")
    public Map<String, String> resolveInc(@PathVariable long id) {
        Incident i = incidentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        i.setStatus("RESOLVED");
        incidentRepository.save(i);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Done!");
        return res;
    }

    @GetMapping("/attendance")
    public List<Attendance> getAttendance() { return attendanceRepository.findAll(); }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        s.put("totalStaff",       userRepository.findByRole("STAFF").size());
        s.put("pendingRequests",  leaveRequestRepository.findByStatus("PENDING").size());
        s.put("pendingIncidents", incidentRepository.findByStatus("PENDING").size());
        s.put("todayAssignments", shiftAssignmentRepository.findByWorkDate(LocalDate.now()).size());
        return s;
    }

    @GetMapping("/alerts/missing-staff")
    public List<Map<String, Object>> getMissingStaffAlert() {
        LocalDate today = LocalDate.now();
        LocalTime now   = LocalTime.now();
        List<ShiftAssignment> todayAssignments = shiftAssignmentRepository.findByWorkDate(today);
        List<Map<String, Object>> alerts = new ArrayList<>();

        for (ShiftAssignment assign : todayAssignments) {
            Shift shift = assign.getShift();
            // FIX: null-safe shift access
            if (shift == null || shift.getStartTime() == null) continue;
            if (now.isAfter(shift.getStartTime().plusMinutes(10))) {
                Attendance att = attendanceRepository.findByShiftAssignment(assign);
                if (att == null || att.getCheckInTime() == null) {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("staffName", assign.getUser() != null ? assign.getUser().getFullName() : "?");
                    alert.put("shiftName", shift.getShiftName());
                    alert.put("startTime", shift.getStartTime());
                    alert.put("message",   "Vắng mặt! Đã trễ quá 10 phút mà chưa check-in.");
                    alerts.add(alert);
                }
            }
        }
        return alerts;
    }
}
