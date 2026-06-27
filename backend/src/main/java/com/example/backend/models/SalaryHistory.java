package com.example.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_histories")
public class SalaryHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Integer month;
    private Integer year;
    private Integer totalShifts;
    private Double totalPay;
    private Double totalPenalty;
    private Double finalSalary;
    
    private LocalDateTime finalizedAt;
    private String status; // e.g. "FINALIZED"

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getTotalShifts() { return totalShifts; }
    public void setTotalShifts(Integer totalShifts) { this.totalShifts = totalShifts; }
    public Double getTotalPay() { return totalPay; }
    public void setTotalPay(Double totalPay) { this.totalPay = totalPay; }
    public Double getTotalPenalty() { return totalPenalty; }
    public void setTotalPenalty(Double totalPenalty) { this.totalPenalty = totalPenalty; }
    public Double getFinalSalary() { return finalSalary; }
    public void setFinalSalary(Double finalSalary) { this.finalSalary = finalSalary; }
    public LocalDateTime getFinalizedAt() { return finalizedAt; }
    public void setFinalizedAt(LocalDateTime finalizedAt) { this.finalizedAt = finalizedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
