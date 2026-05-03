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
    
    @Column(name = "professional_headline", length = 512)
    private String professionalHeadline;
    
    @Column(columnDefinition = "TEXT")
    private String skills;
    
    @Column(name = "experience_years")
    private Integer experienceYears = 0;
    
    @Column(name = "current_company", length = 512)
    private String currentCompany;
    
    @Column(name = "current_designation", length = 512)
    private String currentDesignation;
    
    @Column(columnDefinition = "TEXT")
    private String education;
    
    @Column(name = "profile_completion_percentage", nullable = false)
    private Integer profileCompletionPercentage = 0;
    
    @Column(name = "open_to_opportunities", nullable = false)
    private Boolean openToOpportunities = true;
    
    @Column(name = "expected_salary_min", precision = 12, scale = 2)
    private BigDecimal expectedSalaryMin;
    
    @Column(name = "expected_salary_max", precision = 12, scale = 2)
    private BigDecimal expectedSalaryMax;
    
    @Column(name = "salary_currency", length = 10)
    private String salaryCurrency = "INR";
    
    @Column(name = "work_preference", length = 50)
    private String workPreference;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public void setProfileCompletionPercentage(Integer profileCompletionPercentage) { 
        this.profileCompletionPercentage = Math.min(100, Math.max(0, profileCompletionPercentage)); 
    }
}
