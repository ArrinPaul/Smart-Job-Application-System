package com.edutech.jobportalsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "recruiter_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecruiterProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "company_name", length = 255)
    private String companyName;
    
    @Column(name = "company_website", length = 255)
    private String companyWebsite;
    
    @Column(name = "company_logo_url", length = 512)
    private String companyLogoUrl;
    
    @Column(length = 100)
    private String industry;
    
    @Column(name = "company_size", length = 50)
    private String companySize;
    
    @Column(nullable = false)
    private Boolean verified = false;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
