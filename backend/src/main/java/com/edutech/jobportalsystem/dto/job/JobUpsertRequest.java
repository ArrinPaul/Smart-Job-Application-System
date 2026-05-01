package com.edutech.jobportalsystem.dto.job;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class JobUpsertRequest {

    @NotBlank(message = "title is required")
    @Size(max = 120, message = "title is too long")
    private String title;

    @NotBlank(message = "description is required")
    @Size(max = 10000, message = "description is too long")
    private String description;

    @NotBlank(message = "location is required")
    @Size(max = 120, message = "location is too long")
    private String location;

    private String jobType;
    private String workType;
    private Integer experienceRequired;
    private String requiredSkills;
    private String educationRequired;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String salaryCurrency;
    private String applicationLink;
    private String companyName;
    private String howToApply;

    // Getters and Setters

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }

    public String getWorkType() { return workType; }
    public void setWorkType(String workType) { this.workType = workType; }

    public Integer getExperienceRequired() { return experienceRequired; }
    public void setExperienceRequired(Integer experienceRequired) { this.experienceRequired = experienceRequired; }

    public String getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(String requiredSkills) { this.requiredSkills = requiredSkills; }

    public String getEducationRequired() { return educationRequired; }
    public void setEducationRequired(String educationRequired) { this.educationRequired = educationRequired; }

    public BigDecimal getSalaryMin() { return salaryMin; }
    public void setSalaryMin(BigDecimal salaryMin) { this.salaryMin = salaryMin; }

    public BigDecimal getSalaryMax() { return salaryMax; }
    public void setSalaryMax(BigDecimal salaryMax) { this.salaryMax = salaryMax; }

    public String getSalaryCurrency() { return salaryCurrency; }
    public void setSalaryCurrency(String salaryCurrency) { this.salaryCurrency = salaryCurrency; }

    public String getApplicationLink() { return applicationLink; }
    public void setApplicationLink(String applicationLink) { this.applicationLink = applicationLink; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getHowToApply() { return howToApply; }
    public void setHowToApply(String howToApply) { this.howToApply = howToApply; }
}
