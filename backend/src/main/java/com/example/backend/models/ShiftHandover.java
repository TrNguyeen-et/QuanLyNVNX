package com.example.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_handovers")
public class ShiftHandover {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "from_assignment_id")
    private ShiftAssignment fromAssignment;

    @ManyToOne
    @JoinColumn(name = "to_user_id")
    private User toUser;

    private String notes;
    private LocalDateTime handoverTime;
    
    // GETTER SETTER
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ShiftAssignment getFromAssignment() { return fromAssignment; }
    public void setFromAssignment(ShiftAssignment fromAssignment) { this.fromAssignment = fromAssignment; }

    public User getToUser() { return toUser; }
    public void setToUser(User toUser) { this.toUser = toUser; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getHandoverTime() { return handoverTime; }
    public void setHandoverTime(LocalDateTime handoverTime) { this.handoverTime = handoverTime; }
}
