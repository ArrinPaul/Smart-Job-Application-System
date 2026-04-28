package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.Resume;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.entity.JobSeekerProfile;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.ResumeRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import com.edutech.jobportalsystem.repository.JobSeekerProfileRepository;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartInsightsService {

    private static final Logger logger = LoggerFactory.getLogger(SmartInsightsService.class);
    private final Tika tika = new Tika();

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobSeekerProfileRepository profileRepository;

    /**
     * Match a user's resume and profile against a specific job and return insights.
     */
    public Map<String, Object> getMatchInsights(Long jobId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        JobSeekerProfile profile = profileRepository.findByUser(user).orElse(null);
        Optional<Resume> resumeOpt = resumeRepository.findByOwner(user);

        String resumeContent = "";
        if (resumeOpt.isPresent()) {
            try {
                resumeContent = tika.parseToString(new ByteArrayInputStream(resumeOpt.get().getData()));
            } catch (Exception e) {
                logger.error("Failed to parse resume for user {}: {}", username, e.getMessage());
            }
        }

        // Combine profile skills and resume content for broader matching
        String userSkills = profile != null ? (profile.getSkills() != null ? profile.getSkills() : "") : "";
        String fullUserContext = (userSkills + " " + resumeContent).toLowerCase();
        
        String requiredSkillsStr = job.getRequiredSkills() != null ? job.getRequiredSkills() : "";
        List<String> requiredSkills = Arrays.stream(requiredSkillsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        List<String> matchingSkills = requiredSkills.stream()
                .filter(skill -> fullUserContext.contains(skill.toLowerCase()))
                .collect(Collectors.toList());

        List<String> missingSkills = requiredSkills.stream()
                .filter(skill -> !fullUserContext.contains(skill.toLowerCase()))
                .collect(Collectors.toList());

        int score = calculateMatchScore(job, profile, matchingSkills, requiredSkills.size());

        Map<String, Object> insights = new LinkedHashMap<>();
        insights.put("jobTitle", job.getTitle());
        insights.put("compatibilityScore", score);
        insights.put("matchLevel", getMatchLevel(score));
        insights.put("topMatches", matchingSkills.stream().limit(6).collect(Collectors.toList()));
        insights.put("improvementAreas", missingSkills.stream().limit(5).collect(Collectors.toList()));
        insights.put("recommendations", generateRecommendations(score, missingSkills, job, profile));
        
        return insights;
    }

    private int calculateMatchScore(Job job, JobSeekerProfile profile, List<String> matchingSkills, int totalRequired) {
        int score = 0;
        
        // 1. Skills Match (60% weight)
        if (totalRequired > 0) {
            score += (int) ((matchingSkills.size() * 60.0) / totalRequired);
        } else {
            score += 30; // Default if no specific skills listed
        }

        // 2. Experience Match (30% weight)
        if (profile != null && job.getExperienceRequired() != null) {
            int userExp = profile.getExperienceYears() != null ? profile.getExperienceYears() : 0;
            int reqExp = job.getExperienceRequired();
            
            if (userExp >= reqExp) {
                score += 30;
            } else if (userExp >= reqExp - 2) {
                score += 15;
            }
        }

        // 3. Location/Work Type Match (10% weight)
        if (profile != null && job.getWorkType() != null && profile.getWorkPreference() != null) {
            if (job.getWorkType().equalsIgnoreCase(profile.getWorkPreference())) {
                score += 10;
            } else if (job.getWorkType().equalsIgnoreCase("Hybrid") || job.getWorkType().equalsIgnoreCase("Remote")) {
                score += 5;
            }
        }

        return Math.min(score, 100);
    }

    private String getMatchLevel(int score) {
        if (score >= 85) return "Excellent Match";
        if (score >= 70) return "Strong Match";
        if (score >= 50) return "Fair Match";
        return "Low Match - Needs Optimization";
    }

    private List<String> generateRecommendations(int score, List<String> missing, Job job, JobSeekerProfile profile) {
        List<String> recs = new ArrayList<>();
        
        if (!missing.isEmpty()) {
            recs.add("Update your profile to highlight experience with: " + String.join(", ", missing.stream().limit(3).collect(Collectors.toList())));
        }

        if (profile != null && job.getExperienceRequired() != null) {
            int userExp = profile.getExperienceYears() != null ? profile.getExperienceYears() : 0;
            if (userExp < job.getExperienceRequired()) {
                recs.add("The role requires " + job.getExperienceRequired() + " years of experience, but your profile shows " + userExp + ". Emphasize relevant projects.");
            }
        }

        if (score < 70) {
            recs.add("Consider taking a certification or course in " + (missing.isEmpty() ? "related technologies" : missing.get(0)));
        }

        if (recs.isEmpty()) {
            recs.add("Your profile is a great match! Ensure your cover letter highlights your recent success in " + job.getTitle());
        }

        return recs;
    }
}
