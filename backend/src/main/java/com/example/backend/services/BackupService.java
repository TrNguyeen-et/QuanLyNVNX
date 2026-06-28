package com.example.backend.services;

import com.example.backend.entities.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@SuppressWarnings("null")
public class BackupService {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private IncidentRepository incidentRepository;

    /**
     * Sao lưu toàn bộ dữ liệu hệ thống (Trả về định dạng JSON để Frontend có thể tải về thành file)
     */
    public Map<String, Object> backupData() {
        Map<String, Object> backupSnapshot = new HashMap<>();
        
        // Lấy toàn bộ dữ liệu từ các bảng quan trọng
        List<User> users = userRepository.findAll();
        List<Shift> shifts = shiftRepository.findAll();
        List<ShiftAssignment> assignments = shiftAssignmentRepository.findAll();
        List<Attendance> attendances = attendanceRepository.findAll();
        List<LeaveRequest> leaves = leaveRequestRepository.findAll();
        List<Incident> incidents = incidentRepository.findAll();

        // Đóng gói vào 1 object
        backupSnapshot.put("backupTime", LocalDateTime.now().toString());
        backupSnapshot.put("totalRecords", users.size() + shifts.size() + assignments.size());
        backupSnapshot.put("users", users);
        backupSnapshot.put("shifts", shifts);
        backupSnapshot.put("shiftAssignments", assignments);
        backupSnapshot.put("attendances", attendances);
        backupSnapshot.put("leaveRequests", leaves);
        backupSnapshot.put("incidents", incidents);

        return backupSnapshot;
    }
}