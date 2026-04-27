package com.edutech.jobportalsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String location;

    @Column(name = "job_type")
    private String jobType; // e.g., Full-time, Part-time

    @Column(name = "work_type")
    private String workType; // e.g., Remote, On-site, Hybrid

    @Column(name = "experience_required")
    private Integer experienceRequired;

    @Column(name = "required_skills", columnDefinition = "TEXT")
    private String requiredSkills;

    @Column(name = "education_required")
    private String educationRequired;

    @Column(name = "salary_min", precision = 12, scale = 2)
    private java.math.BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 12, scale = 2)
    private java.math.BigDecimal salaryMax;

    @Column(name = "salary_currency")
    private String salaryCurrency = "INR";

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "application_link")
    private String applicationLink;

    @Column(unique = true)
    private String slug;

    @ManyToOne
    @JoinColumn(name = "recruiter_id", nullable = false)
    private User postedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isActive == null) this.isActive = true;
    }

    // Explicit getters to match service expectations if Lombok is acting up
    public String getJobTitle() { return title; }
    public String getCompanyName() { 
        return (postedBy != null && postedBy.getCompanyName() != null) 
            ? postedBy.getCompanyName() 
            : "Unknown Company"; 
    }
}
