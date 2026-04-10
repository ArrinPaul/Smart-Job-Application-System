package com.edutech.jobportalsystem.dto.job;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class JobUpsertRequest {

    @NotBlank(message = "title is required")
    @Size(max = 120, message = "title is too long")
    private String title;

    @NotBlank(message = "description is required")
    @Size(max = 5000, message = "description is too long")
    private String description;

    @NotBlank(message = "location is required")
    @Size(max = 120, message = "location is too long")
    private String location;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
