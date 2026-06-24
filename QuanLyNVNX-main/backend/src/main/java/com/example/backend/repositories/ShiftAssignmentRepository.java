package com.example.backend.repositories;

import com.example.backend.models.ShiftAssignment;
import com.example.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {
    List<ShiftAssignment> findByUser(User user);
    List<ShiftAssignment> findByWorkDate(LocalDate workDate);
    List<ShiftAssignment> findByUserAndWorkDate(User user, LocalDate workDate);
    List<ShiftAssignment> findByShiftIdAndWorkDate(Long shiftId, LocalDate workDate);
    
    // THÊM MỚI: Tìm ca làm việc trong 1 khoảng thời gian của 1 user
    List<ShiftAssignment> findByUserAndWorkDateBetween(User user, LocalDate start, LocalDate end);
}