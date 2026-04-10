package com.edutech.jobportalsystem.dto.job;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateApplicationStatusRequest {

    @NotBlank(message = "status is required")
    @Pattern(regexp = "^(APPLIED|SHORTLISTED|REJECTED|HIRED)$", message = "Invalid application status")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
