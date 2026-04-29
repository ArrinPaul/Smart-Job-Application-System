package com.edutech.jobportalsystem.dto.job;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobRecommendationDTO {
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private String location;
    private String workType;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private Integer matchPercentage;
    private List<String> matchReasons;
    private String aiExplanation;
    private String slug;
}
