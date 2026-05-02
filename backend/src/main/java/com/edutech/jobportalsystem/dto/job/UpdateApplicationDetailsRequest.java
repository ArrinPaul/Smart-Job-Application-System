package com.edutech.jobportalsystem.dto.job;

import java.time.LocalDateTime;

public class UpdateApplicationDetailsRequest {

    private String status;
    private String internalNotes;
    private LocalDateTime interviewDate;
    private String interviewLocation;
    private String recruiterFeedback;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }

    public LocalDateTime getInterviewDate() { return interviewDate; }
    public void setInterviewDate(LocalDateTime interviewDate) { this.interviewDate = interviewDate; }

    public String getInterviewLocation() { return interviewLocation; }
    public void setInterviewLocation(String interviewLocation) { this.interviewLocation = interviewLocation; }

    public String getRecruiterFeedback() { return recruiterFeedback; }
    public void setRecruiterFeedback(String recruiterFeedback) { this.recruiterFeedback = recruiterFeedback; }
}
