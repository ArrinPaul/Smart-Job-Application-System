package com.edutech.jobportalsystem.entity;

// File: src/main/java/com/edutech/jobportalsystem/entity/Application.java

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @Column(nullable = false)
    private String status; // APPLIED, SHORTLISTED, PHONE_SCREEN, TECHNICAL_INTERVIEW, ON_SITE_INTERVIEW, OFFER_EXTENDED, HIRED, REJECTED, HOLD

    @Column(nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    @Column(columnDefinition = "TEXT")
    private String internalNotes;

    private LocalDateTime interviewDate;
    
    private String interviewLocation; // URL or physical location

    private Integer aiMatchScore;

    @Column(columnDefinition = "TEXT")
    private String recruiterFeedback;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = "APPLIED";
        }
        this.appliedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
