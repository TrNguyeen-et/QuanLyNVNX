package com.example.backend.repositories;

import com.example.backend.models.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    // Lấy danh sách các đơn đang chờ duyệt
    List<LeaveRequest> findByStatus(String status);
}