package com.example.backend.repositories;

import com.example.backend.entities.SalaryHistory;
import com.example.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SalaryHistoryRepository extends JpaRepository<SalaryHistory, Long> {
    List<SalaryHistory> findByMonthAndYear(Integer month, Integer year);
    List<SalaryHistory> findByUserAndMonthAndYear(User user, Integer month, Integer year);
    List<SalaryHistory> findByYear(Integer year);
}
