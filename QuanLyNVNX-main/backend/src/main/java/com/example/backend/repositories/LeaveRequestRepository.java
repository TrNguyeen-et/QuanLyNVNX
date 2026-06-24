package com.example.backend.repositories;

import com.example.backend.models.LeaveRequest;
import com.example.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByStatus(String status);
    List<LeaveRequest> findByUser_Id(Long userId);

    // FIX: Dùng đúng tên method theo Spring Data JPA convention
    // LeaveRequest có @ManyToOne User → traverse bằng User object, không phải userId
    List<LeaveRequest> findByUserAndTargetDateBetweenAndStatus(
            User user, LocalDate start, LocalDate end, String status);
}
