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
    
    @Column(length = 255)
    private String companyName;
    
    @Column(length = 255)
    private String companyWebsite;
    
    @Column(length = 512)
    private String companyLogoUrl;
    
    @Column(length = 100)
    private String industry;
    
    @Column(length = 50)
    private String companySize;
    
    @Column(nullable = false)
    private Boolean verified = false;
    
    private LocalDateTime verifiedAt;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
