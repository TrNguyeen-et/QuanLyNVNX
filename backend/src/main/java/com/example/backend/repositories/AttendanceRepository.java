package com.example.backend.repositories;

import com.example.backend.models.Attendance;
import com.example.backend.models.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Attendance findByShiftAssignment(ShiftAssignment shiftAssignment);
}