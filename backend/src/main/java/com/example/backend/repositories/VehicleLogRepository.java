package com.example.backend.repositories;

import com.example.backend.models.VehicleLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleLogRepository extends JpaRepository<VehicleLog, Long> {
    Optional<VehicleLog> findByLicensePlateAndStatus(String licensePlate, String status);
    List<VehicleLog> findByZoneNameAndStatus(String zoneName, String status);
}
