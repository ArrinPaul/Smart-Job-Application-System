package com.edutech.jobportalsystem.entity;

// File: src/main/java/com/edutech/jobportalsystem/entity/User.java

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String role; // ADMIN, RECRUITER, JOB_SEEKER

    @Column(nullable = false, columnDefinition = "int default 0")
    @JsonIgnore
    private Integer failedLoginAttempts = 0;

    @JsonIgnore
    private LocalDateTime lockUntil;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean emailVerified = false;

    @Column(length = 128)
    @JsonIgnore
    private String emailVerificationToken;

    @JsonIgnore
    private LocalDateTime emailVerificationExpiry;

    @Column(length = 128)
    @JsonIgnore
    private String passwordResetToken;

    @JsonIgnore
    private LocalDateTime passwordResetExpiry;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    @JsonIgnore
    private Long tokenVersion = 0L;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean mfaEnabled = false;

    @Column(length = 64)
    @JsonIgnore
    private String mfaSecret;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean onboardingCompleted = false;

    private LocalDateTime onboardingCompletedAt;

    @Column(length = 512)
    private String fullName;

    @Column(length = 512)
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 512)
    private String companyName;

    private String website;

    @Column(length = 512)
    private String location;    
    @Column(columnDefinition = "TEXT")
    private String skills;
    
    private String profilePictureUrl;

    private String lastLoginIp;

    @Column(length = 512)
    private String lastLoginUserAgent;

    private LocalDateTime lastLoginAt;
}
