package com.example.backend.repositories;

import com.example.backend.models.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByStatus(String status);
    List<LeaveRequest> findByUserId(Long userId); // Thêm dòng này
}