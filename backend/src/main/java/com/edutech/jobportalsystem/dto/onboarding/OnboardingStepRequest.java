package com.edutech.jobportalsystem.dto.onboarding;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStepRequest {
    
    // Step 1: Basic Information
    private String fullName;
    private String location;
    private String bio;
    
    // Step 2: Professional Details
    private String headline;
    private String skills;
    private String companyName;
    private String companyWebsite;
    private String industry;
    private String companySize;
    private Integer experienceYears;
    
    // Step 3: Additional Details
    private String currentCompany;
    private String currentDesignation;
    private String education;
    
    // Step 4: Work Preferences
    private Boolean openToOpportunities;
    private String workPreference;
    private BigDecimal expectedSalaryMin;
    private BigDecimal expectedSalaryMax;
    private String salaryCurrency;
}
