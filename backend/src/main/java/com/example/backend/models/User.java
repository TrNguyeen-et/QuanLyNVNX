package com.example.backend.models;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty; // Thêm import này
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) // Chỉ cho phép ghi (để nhận mật khẩu lúc tạo/sửa)
    private String password;
    
    private String role; // ADMIN, MANAGER, STAFF
    private String status; //ACTIVE, ON_LEAVE, RESIGNED
    private String fullName;
    private Double salary;
    private String workShift; //SHIFT 1: 6 AM - 14 PM, SHIFT 2: 14 PM - 22 PM
    private String workDays; // Ngày trong tuần (Sunday, Monday,...) 
    private String position; // Nhiệm vụ (Ví dụ: Nhân viên bãi 1, Nhân viên quẹt thẻ)
    private String email;    // Email để nhận thông báo

    // Explicit getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
    public String getFullName() { return fullName; }
    public Double getSalary() { return salary; }
    public String getWorkShift() { return workShift; }
    public String getWorkDays() { return workDays; }
    public String getPosition() { return position; }
    public String getEmail() { return email; }

    // Explicit setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setRole(String role) { this.role = role; }
    public void setStatus(String status) { this.status = status; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setSalary(Double salary) { this.salary = salary; }
    public void setWorkShift(String workShift) { this.workShift = workShift; }
    public void setWorkDays(String workDays) { this.workDays = workDays; }
    public void setPosition(String position) { this.position = position; }
    public void setEmail(String email) { this.email = email; }
}