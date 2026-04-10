package com.edutech.jobportalsystem.dto.job;

import jakarta.validation.constraints.NotNull;

public class ApplyJobRequest {

    @NotNull(message = "jobId is required")
    private Long jobId;

    private Long resumeId;

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public Long getResumeId() {
        return resumeId;
    }

    public void setResumeId(Long resumeId) {
        this.resumeId = resumeId;
    }
}
