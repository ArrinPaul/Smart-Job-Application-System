package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.JobSeekerProfile;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.JobSeekerProfileRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private AIService aiService;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobSeekerProfileRepository profileRepository;

    public String getChatResponse(String message, String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        JobSeekerProfile profile = user != null ? profileRepository.findByUser(user).orElse(null) : null;
        List<Job> recentJobs = jobRepository.findTop5ByIsActiveTrueOrderByCreatedAtDesc();

        StringBuilder context = new StringBuilder();
        context.append("You are a helpful Career Assistant for the Smart Job Portal.\n");
        
        if (user != null) {
            context.append("Current User: ").append(user.getUsername()).append("\n");
            context.append("Location: ").append(user.getLocation() != null ? user.getLocation() : "Unknown").append("\n");
        }
        
        if (profile != null) {
            context.append("Skills: ").append(profile.getSkills()).append("\n");
            context.append("Experience: ").append(profile.getExperienceYears()).append(" years\n");
            context.append("Current Designation: ").append(profile.getCurrentDesignation()).append("\n");
        }

        context.append("\nRecent Job Openings:\n");
        for (Job job : recentJobs) {
            context.append("- ").append(job.getTitle()).append(" at ").append(job.getCompanyName()).append(" (").append(job.getLocation()).append(")\n");
        }

        context.append("\nUser message: ").append(message).append("\n");
        context.append("\nAssistant: ");

        return aiService.generateContent(context.toString());
    }
}
