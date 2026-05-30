package com.example.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_logs")
public class VehicleLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String licensePlate;
    private String zoneName;
    private LocalDateTime timeIn;
    private LocalDateTime timeOut;
    private String status; // IN, OUT

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }

    public LocalDateTime getTimeIn() { return timeIn; }
    public void setTimeIn(LocalDateTime timeIn) { this.timeIn = timeIn; }

    public LocalDateTime getTimeOut() { return timeOut; }
    public void setTimeOut(LocalDateTime timeOut) { this.timeOut = timeOut; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
