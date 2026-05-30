package com.example.backend.repositories;

import com.example.backend.models.AppLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppLogRepository extends JpaRepository<AppLog, Long> {
    List<AppLog> findAllByOrderByTimestampDesc();
}
