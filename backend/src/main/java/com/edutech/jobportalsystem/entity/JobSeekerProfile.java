package com.edutech.jobportalsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_seeker_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobSeekerProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(length = 255)
    private String professionalHeadline;
    
    @Column(columnDefinition = "TEXT")
    private String skills;
    
    private Integer experienceYears = 0;
    
    @Column(length = 255)
    private String currentCompany;
    
    @Column(length = 255)
    private String currentDesignation;
    
    @Column(columnDefinition = "TEXT")
    private String education;
    
    @Column(nullable = false)
    private Integer profileCompletionPercentage = 0;
    
    @Column(nullable = false)
    private Boolean openToOpportunities = true;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal expectedSalaryMin;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal expectedSalaryMax;
    
    @Column(length = 10)
    private String salaryCurrency = "INR";
    
    @Column(length = 50)
    private String workPreference;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public void setProfileCompletionPercentage(Integer profileCompletionPercentage) { 
        this.profileCompletionPercentage = Math.min(100, Math.max(0, profileCompletionPercentage)); 
    }
}
