package com.example.backend.entities;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "shifts")
public class Shift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String shiftName; // Ví dụ: Sáng, Chiều, Đêm
    private LocalTime startTime;
    private LocalTime endTime;
    private Double shiftPrice; // Đơn giá ca

    // --- GETTER VÀ SETTER THỦ CÔNG ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getShiftName() {
        return shiftName;
    }

    public void setShiftName(String shiftName) {
        this.shiftName = shiftName;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Double getShiftPrice() {
        return shiftPrice;
    }

    public void setShiftPrice(Double shiftPrice) {
        this.shiftPrice = shiftPrice;
    }
}