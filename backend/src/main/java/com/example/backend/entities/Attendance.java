package com.example.backend.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendances")
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "assignment_id")
    private ShiftAssignment shiftAssignment;

    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private Double penaltyFee; 
    private String status; 

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ShiftAssignment getShiftAssignment() { return shiftAssignment; }
    public void setShiftAssignment(ShiftAssignment shiftAssignment) { this.shiftAssignment = shiftAssignment; }
    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }
    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }
    public Double getPenaltyFee() { return penaltyFee; }
    public void setPenaltyFee(Double penaltyFee) { this.penaltyFee = penaltyFee; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}