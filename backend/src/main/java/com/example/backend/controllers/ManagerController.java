package com.example.backend.controllers;
import com.example.backend.models.*; import com.example.backend.repositories.*; import org.springframework.beans.factory.annotation.Autowired; import org.springframework.http.HttpStatus; import org.springframework.web.bind.annotation.*; import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate; import java.util.*;

@RestController @RequestMapping("/api/manager") @CrossOrigin(origins = "*") public class ManagerController {
    @Autowired private UserRepository userRepository; @Autowired private ShiftRepository shiftRepository; @Autowired private ShiftAssignmentRepository shiftAssignmentRepository; @Autowired private LeaveRequestRepository leaveRequestRepository; @Autowired private AttendanceRepository attendanceRepository; @Autowired private IncidentRepository incidentRepository;

    @GetMapping("/staff-list") public List<User> getAllStaff() { return userRepository.findAll(); }
    @GetMapping("/shifts") public List<Shift> getShifts() { return shiftRepository.findAll(); }

    @PutMapping("/update-staff/{id}")
    public User updateStaff(@PathVariable long id, @RequestBody User s) { return userRepository.findById(id).map(u -> { u.setFullName(s.getFullName()); u.setRole(s.getRole()); u.setSalary(s.getSalary()); u.setStatus(s.getStatus()); return userRepository.save(u); }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found")); }

    @PostMapping("/assign-shift")
    public Map<String, Object> assignShift(@RequestBody Map<String, Object> data) {
        long userId = Long.parseLong(data.get("userId").toString()); long shiftId = Long.parseLong(data.get("shiftId").toString()); LocalDate date = LocalDate.parse(data.get("workDate").toString());
        User u = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        Shift s = shiftRepository.findById(shiftId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        ShiftAssignment a = new ShiftAssignment(); a.setUser(u); a.setShift(s); a.setWorkDate(date); a.setStatus("SCHEDULED"); shiftAssignmentRepository.save(a);
        Map<String, Object> res = new HashMap<>(); res.put("status", "success"); res.put("message", "Da phan ca!"); return res;
    }

    @GetMapping("/calculate-salaries")
    public List<Map<String, Object>> getSalaryReport() {
        List<User> staffs = userRepository.findAll(); List<Map<String, Object>> report = new ArrayList<>();
        for (User s : staffs) {
            Map<String, Object> item = new HashMap<>(); item.put("name", s.getFullName()); List<ShiftAssignment> assigns = shiftAssignmentRepository.findByUser(s);
            double pay = 0, penalty = 0; int comp = 0;
            for (ShiftAssignment a : assigns) {
                if ("COMPLETED".equals(a.getStatus())) { comp++; if(a.getShift()!=null && a.getShift().getShiftPrice()!=null) pay += a.getShift().getShiftPrice(); Attendance att = attendanceRepository.findByShiftAssignment(a); if(att!=null && att.getPenaltyFee()!=null) penalty += att.getPenaltyFee(); }
            }
            item.put("shifts", comp); item.put("pay", pay); item.put("penalty", penalty); item.put("final", pay - penalty); report.add(item);
        } return report;
    }

    // BÁO CÁO ĐI TRỄ
    @GetMapping("/reports/late")
    public List<Map<String, Object>> getLateReports() {
        List<Map<String, Object>> list = new ArrayList<>();
        for(Attendance att : attendanceRepository.findAll()) {
            if(att.getPenaltyFee() != null && att.getPenaltyFee() > 0) {
                Map<String, Object> m = new HashMap<>();
                m.put("name", att.getShiftAssignment().getUser().getFullName());
                m.put("date", att.getCheckInTime().toLocalDate());
                m.put("penalty", att.getPenaltyFee());
                m.put("status", att.getStatus());
                list.add(m);
            }
        } return list;
    }

    @GetMapping("/leave-requests") public List<LeaveRequest> getPendingLeaves() { return leaveRequestRepository.findByStatus("PENDING"); }
    @PutMapping("/leave-requests/{id}/approve") public Map<String, String> approveLeave(@PathVariable long id, @RequestParam boolean isApproved) { LeaveRequest r = leaveRequestRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found")); r.setStatus(isApproved ? "APPROVED" : "REJECTED"); leaveRequestRepository.save(r); Map<String, String> res = new HashMap<>(); res.put("message", "Done!"); return res; }
    @GetMapping("/incidents") public List<Incident> getIncidents() { return incidentRepository.findByStatus("PENDING"); }
    @PutMapping("/incidents/{id}/resolve") public Map<String, String> resolveInc(@PathVariable long id) { Incident i = incidentRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found")); i.setStatus("RESOLVED"); incidentRepository.save(i); Map<String, String> res = new HashMap<>(); res.put("message", "Done!"); return res; }
    @GetMapping("/attendance")
    public List<Attendance> getAttendance() {
        return attendanceRepository.findAll();
    }
}