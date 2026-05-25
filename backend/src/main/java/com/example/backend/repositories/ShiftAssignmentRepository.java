package com.example.backend.repositories;

import com.example.backend.models.ShiftAssignment;
import com.example.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {
    // Tìm các ca trực của một nhân viên cụ thể
    List<ShiftAssignment> findByUser(User user);
    // Tìm các ca trực trong một ngày cụ thể
    List<ShiftAssignment> findByWorkDate(LocalDate workDate);
}