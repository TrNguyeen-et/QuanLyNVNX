package com.example.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidents")
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // ID của nhân viên báo cáo
    private LocalDateTime reportTime; // Thời gian ghi nhận
    private String content; // Nội dung sự cố (Mất thẻ, va quẹt xe...)

    // --- GETTER VÀ SETTER THỦ CÔNG ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDateTime getReportTime() { return reportTime; }
    public void setReportTime(LocalDateTime reportTime) { this.reportTime = reportTime; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}