package com.example.backend.services;

import com.example.backend.models.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@SuppressWarnings("null")
public class HrService {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;

    public List<Map<String, Object>> getMonthlyReport(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = YearMonth.of(year, month).atEndOfMonth();

        List<User> allStaff = userRepository.findByRole("STAFF");
        List<Map<String, Object>> report = new ArrayList<>();

        for (User staff : allStaff) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("staffId",   staff.getId());
            row.put("staffName", staff.getFullName());
            row.put("username",  staff.getUsername());
            row.put("status",    staff.getStatus());

            List<ShiftAssignment> assignments =
                shiftAssignmentRepository.findByUserAndWorkDateBetween(staff, start, end);

            int totalShifts = assignments.size();
            int doneShifts  = 0, lateCount = 0, absentCount = 0;
            double totalPay = 0, totalPenalty = 0;

            for (ShiftAssignment sa : assignments) {
                Attendance att = attendanceRepository.findByShiftAssignment(sa);
                if (att == null || att.getCheckInTime() == null) {
                    absentCount++;
                } else {
                    if ("COMPLETED".equals(att.getStatus()) || "DONE".equals(sa.getStatus())) {
                        doneShifts++;
                        if (sa.getShift() != null && sa.getShift().getShiftPrice() != null)
                            totalPay += sa.getShift().getShiftPrice();
                    }
                    if ("LATE".equals(att.getStatus())) lateCount++;
                    if (att.getPenaltyFee() != null) totalPenalty += att.getPenaltyFee();
                }
            }

            // FIX: dùng đúng method signature có trong LeaveRequestRepository
            List<LeaveRequest> approvedLeaves =
                leaveRequestRepository.findByUserAndTargetDateBetweenAndStatus(staff, start, end, "APPROVED");
            int leaveCount = (int) approvedLeaves.stream()
                    .filter(r -> "LEAVE".equals(r.getRequestType())).count();

            row.put("totalShifts",  totalShifts);
            row.put("doneShifts",   doneShifts);
            row.put("absentCount",  absentCount);
            row.put("lateCount",    lateCount);
            row.put("leaveCount",   leaveCount);
            row.put("totalPay",     totalPay);
            row.put("totalPenalty", totalPenalty);
            row.put("netSalary",    totalPay - totalPenalty);
            report.add(row);
        }
        return report;
    }
}
