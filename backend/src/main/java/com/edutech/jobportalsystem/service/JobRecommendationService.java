package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.dto.job.JobRecommendationDTO;
import com.edutech.jobportalsystem.entity.*;
import com.edutech.jobportalsystem.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class JobRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(JobRecommendationService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobSeekerProfileRepository jobSeekerProfileRepository;

    /**
     * Get job recommendations for a specific user
     * @param userId User ID
     * @param limit Maximum number of recommendations to return
     * @return List of recommended jobs with match scores
     */
    public List<JobRecommendationDTO> getRecommendationsForUser(Long userId, int limit) {
        logger.info("Fetching job recommendations for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Only recommend to job seekers
        if (!user.getRole().equals("JOB_SEEKER")) {
            logger.warn("User {} is not a job seeker", userId);
            return Collections.emptyList();
        }

        // Get user's job seeker profile
        JobSeekerProfile profile = jobSeekerProfileRepository.findByUserId(userId)
                .orElse(null);

        // Get all active jobs
        List<Job> allJobs = jobRepository.findAll().stream()
                .filter(job -> job.getIsActive())
                .collect(Collectors.toList());

        // Score each job and filter by minimum threshold
        List<JobRecommendationDTO> recommendations = allJobs.stream()
                .map(job -> scoreJobForUser(user, profile, job))
                .filter(rec -> rec.getMatchPercentage() >= 50) // Minimum 50% match
                .sorted(Comparator.comparingInt(JobRecommendationDTO::getMatchPercentage).reversed())
                .limit(limit)
                .collect(Collectors.toList());

        logger.info("Found {} recommendations for user {}", recommendations.size(), userId);
        return recommendations;
    }

    /**
     * Score a specific job for a user
     * @param user The user
     * @param profile The user's job seeker profile (can be null)
     * @param job The job to score
     * @return Recommendation with match percentage and explanation
     */
    private JobRecommendationDTO scoreJobForUser(User user, JobSeekerProfile profile, Job job) {
        int totalScore = 0;
        int maxScore = 0;
        List<String> matchReasons = new ArrayList<>();

        // 1. SKILLS MATCH (25 points max)
        if (profile != null && profile.getSkills() != null && !profile.getSkills().isEmpty()) {
            int skillsScore = scoreSkillsMatch(profile.getSkills(), job.getRequiredSkills());
            totalScore += skillsScore;
            maxScore += 25;
            if (skillsScore > 0) {
                matchReasons.add("Skills match (" + (skillsScore * 4) + "%)");
            }
        } else {
            maxScore += 25;
        }

        // 2. EXPERIENCE LEVEL (20 points max)
        if (profile != null && profile.getExperienceYears() != null) {
            int experienceScore = scoreExperienceMatch(profile.getExperienceYears(), job.getExperienceRequired());
            totalScore += experienceScore;
            maxScore += 20;
            if (experienceScore > 0) {
                matchReasons.add("Experience match (" + (experienceScore * 5) + "%)");
            }
        } else {
            maxScore += 20;
        }

        // 3. JOB TITLE/DESIGNATION SIMILARITY (15 points max)
        if (profile != null && profile.getCurrentDesignation() != null) {
            int titleScore = scoreJobTitleSimilarity(profile.getCurrentDesignation(), job.getJobTitle());
            totalScore += titleScore;
            maxScore += 15;
            if (titleScore > 0) {
                matchReasons.add("Role match (" + Math.round((titleScore / 15.0) * 100) + "%)");
            }
        } else {
            maxScore += 15;
        }

        // 4. SALARY EXPECTATIONS (15 points max)
        if (profile != null && profile.getExpectedSalaryMin() != null && profile.getExpectedSalaryMax() != null) {
            int salaryScore = scoreSalaryMatch(profile.getExpectedSalaryMin(), profile.getExpectedSalaryMax(), job.getSalaryMin(), job.getSalaryMax());
            totalScore += salaryScore;
            maxScore += 15;
            if (salaryScore > 0) {
                matchReasons.add("Salary match (" + (salaryScore * Math.round(100.0 / 15)) + "%)");
            }
        } else {
            maxScore += 15;
        }

        // 5. LOCATION/WORK PREFERENCE (10 points max)
        if (profile != null && profile.getWorkPreference() != null && user.getLocation() != null) {
            int locationScore = scoreLocationMatch(user.getLocation(), profile.getWorkPreference(), job.getLocation(), job.getWorkType());
            totalScore += locationScore;
            maxScore += 10;
            if (locationScore > 0) {
                matchReasons.add("Location/work type match (" + (locationScore * 10) + "%)");
            }
        } else {
            maxScore += 10;
        }

        // 6. EDUCATION (10 points max)
        if (profile != null && profile.getEducation() != null) {
            int educationScore = scoreEducationMatch(profile.getEducation(), job.getEducationRequired());
            totalScore += educationScore;
            maxScore += 10;
            if (educationScore > 0) {
                matchReasons.add("Education match (" + (educationScore * 10) + "%)");
            }
        } else {
            maxScore += 10;
        }

        // Calculate percentage
        int matchPercentage = maxScore > 0 ? Math.round((totalScore * 100) / (float) maxScore) : 0;
        matchPercentage = Math.min(100, matchPercentage); // Cap at 100%

        return new JobRecommendationDTO(
                job.getId(),
                job.getJobTitle(),
                job.getCompanyName(),
                job.getLocation(),
                job.getWorkType(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                matchPercentage,
                matchReasons
        );
    }

    /**
     * Score skills match (0-25 points)
     */
    private int scoreSkillsMatch(String userSkills, String requiredSkills) {
        if (userSkills == null || userSkills.isEmpty() || requiredSkills == null || requiredSkills.isEmpty()) {
            return 0;
        }

        String[] userSkillsArray = userSkills.toLowerCase().split(",");
        String[] requiredSkillsArray = requiredSkills.toLowerCase().split(",");

        Set<String> userSkillSet = new HashSet<>();
        for (String skill : userSkillsArray) {
            userSkillSet.add(skill.trim());
        }

        int matchedCount = 0;
        for (String required : requiredSkillsArray) {
            String requiredTrimmed = required.trim();
            if (userSkillSet.stream().anyMatch(s -> s.contains(requiredTrimmed) || requiredTrimmed.contains(s))) {
                matchedCount++;
            }
        }

        // Percentage of required skills matched
        int percentage = (int) Math.round((matchedCount * 100.0) / requiredSkillsArray.length);
        return (int) Math.round((percentage / 100.0) * 25); // Convert to 0-25 scale
    }

    /**
     * Score experience match (0-20 points)
     */
    private int scoreExperienceMatch(Integer userYears, Integer requiredYears) {
        if (userYears == null || requiredYears == null) {
            return 0;
        }

        if (userYears >= requiredYears) {
            return 20; // Perfect match
        }

        // Partial credit for being close
        int yearsDifference = requiredYears - userYears;
        if (yearsDifference <= 1) {
            return 18; // Almost there
        } else if (yearsDifference <= 2) {
            return 15;
        } else if (yearsDifference <= 3) {
            return 10;
        }
        return 0;
    }

    /**
     * Score job title similarity (0-15 points)
     */
    private int scoreJobTitleSimilarity(String userTitle, String jobTitle) {
        if (userTitle == null || userTitle.isEmpty() || jobTitle == null || jobTitle.isEmpty()) {
            return 0;
        }

        String userTitleLower = userTitle.toLowerCase();
        String jobTitleLower = jobTitle.toLowerCase();

        // Exact match
        if (userTitleLower.equals(jobTitleLower)) {
            return 15;
        }

        // Partial match - check for key words
        String[] userWords = userTitleLower.split("\\s+");
        String[] jobWords = jobTitleLower.split("\\s+");

        int matchedWords = 0;
        for (String userWord : userWords) {
            for (String jobWord : jobWords) {
                if (userWord.equals(jobWord) && userWord.length() > 2) {
                    matchedWords++;
                    break;
                }
            }
        }

        if (matchedWords > 0) {
            return Math.min(15, matchedWords * 5);
        }

        return 0;
    }

    /**
     * Score salary match (0-15 points)
     */
    private int scoreSalaryMatch(Long userMin, Long userMax, Long jobMin, Long jobMax) {
        if (userMin == null || userMax == null || jobMin == null || jobMax == null) {
            return 0;
        }

        // Check if job salary range overlaps with user expectations
        if (jobMax >= userMin && jobMin <= userMax) {
            return 15; // Good match
        }

        // Partial credit if close
        if (jobMax >= userMin - (userMin * 0.2) || jobMin <= userMax + (userMax * 0.2)) {
            return 8; // Close but not perfect
        }

        return 0;
    }

    /**
     * Score location and work type match (0-10 points)
     */
    private int scoreLocationMatch(String userLocation, String userWorkPreference, String jobLocation, String jobWorkType) {
        int score = 0;

        // Work type match (remote, on-site, hybrid)
        if (userWorkPreference != null && jobWorkType != null) {
            String prefLower = userWorkPreference.toLowerCase();
            String jobTypeLower = jobWorkType.toLowerCase();

            if (jobTypeLower.contains("remote") && prefLower.contains("remote")) {
                score += 5;
            } else if (jobTypeLower.contains("on-site") && prefLower.contains("on-site")) {
                score += 5;
            } else if (jobTypeLower.contains("hybrid")) {
                score += 5; // Hybrid works for any preference
            }
        }

        // Location match
        if (userLocation != null && jobLocation != null) {
            String userLocLower = userLocation.toLowerCase();
            String jobLocLower = jobLocation.toLowerCase();

            if (userLocLower.contains(jobLocLower) || jobLocLower.contains(userLocLower)) {
                score += 5;
            }
        }

        return Math.min(10, score);
    }

    /**
     * Score education match (0-10 points)
     */
    private int scoreEducationMatch(String userEducation, String requiredEducation) {
        if (userEducation == null || userEducation.isEmpty() || requiredEducation == null || requiredEducation.isEmpty()) {
            return 0;
        }

        String userEdLower = userEducation.toLowerCase();
        String reqEdLower = requiredEducation.toLowerCase();

        // Check for key education levels
        if (reqEdLower.contains("phd") && userEdLower.contains("phd")) {
            return 10;
        } else if (reqEdLower.contains("master") && (userEdLower.contains("master") || userEdLower.contains("phd"))) {
            return 10;
        } else if (reqEdLower.contains("bachelor") && 
                   (userEdLower.contains("bachelor") || userEdLower.contains("master") || userEdLower.contains("phd"))) {
            return 8;
        } else if (!reqEdLower.contains("required")) {
            // If not explicitly required, give partial credit
            return 5;
        }

        return 0;
    }
}
