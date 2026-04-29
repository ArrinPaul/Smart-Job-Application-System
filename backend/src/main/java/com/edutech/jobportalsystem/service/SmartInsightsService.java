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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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

    @Autowired
    private AIService aiService;

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

        // Compute skill importance weights based on job corpus (IDF-like)
        Map<String, Double> skillWeights = computeSkillWeights();

        double totalRequiredWeight = 0.0;
        double matchedWeight = 0.0;
        List<String> matchingSkills = new ArrayList<>();

        for (String req : requiredSkills) {
            String key = req.toLowerCase();
            double w = skillWeights.getOrDefault(key, 1.0);
            totalRequiredWeight += w;
            if (fullUserContext.contains(key)) {
                matchedWeight += w;
                matchingSkills.add(req);
            }
        }

        List<String> missingSkills = requiredSkills.stream()
                .filter(skill -> !matchingSkills.contains(skill))
                .collect(Collectors.toList());

        int skillsScore = 0;
        if (totalRequiredWeight > 0) {
            double pct = matchedWeight / totalRequiredWeight;
            skillsScore = (int) Math.round(pct * 50.0); // Skills are 50% of the score
        } else if (!requiredSkills.isEmpty()) {
            skillsScore = 25; // neutral
        }

        // Calculate other components using existing helpers
        int experienceScore = 0;
        if (profile != null && job.getExperienceRequired() != null) {
            int userExp = profile.getExperienceYears() != null ? profile.getExperienceYears() : 0;
            // Experience is 25% of the score
            experienceScore = (int) (calculateExperienceContribution(userExp, job.getExperienceRequired()) * 25.0 / 25.0);
        }

        // Location is 15% of the score
        int locationContribution = calculateLocationContribution(user.getLocation(), profile, job);
        int locationScore = (int) (locationContribution * 15.0 / 10.0);

        // Title match is 10%
        int titleScore = 0;
        if (profile != null && profile.getCurrentDesignation() != null) {
            titleScore = (int) (scoreJobTitleSimilarity(profile.getCurrentDesignation(), job.getTitle()) * 10.0 / 15.0);
        }

        int score = Math.min(100, skillsScore + experienceScore + locationScore + titleScore);

        Map<String, Object> insights = new LinkedHashMap<>();
        insights.put("jobTitle", job.getTitle());
        insights.put("company", job.getCompanyName());
        insights.put("compatibilityScore", score);
        insights.put("matchLevel", getMatchLevel(score));
        insights.put("topMatches", matchingSkills.stream().limit(6).collect(Collectors.toList()));
        insights.put("improvementAreas", missingSkills.stream().limit(5).collect(Collectors.toList()));
        
        // AI powered insights
        String aiPrompt = String.format(
            "Analyze this job match and provide 3-4 professional, actionable career tips.\n" +
            "Job Role: %s at %s\n" +
            "Match Score: %d/100 (%s)\n" +
            "Candidate's Matching Skills: %s\n" +
            "Key Missing Skills: %s\n" +
            "Advice should focus on how to bridge the gap and stand out.",
            job.getTitle(), job.getCompanyName(), score, getMatchLevel(score),
            String.join(", ", matchingSkills), String.join(", ", missingSkills)
        );
        String aiRecommendations = aiService.generateContent(aiPrompt);
        insights.put("aiInsights", aiRecommendations);
        
        insights.put("recommendations", generateRecommendations(score, missingSkills, job, profile));

        // Add weighted skill importance for display
        List<Map<String, Object>> skillWeightsList = requiredSkills.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("skill", s);
            map.put("weight", skillWeights.getOrDefault(s.toLowerCase(), 1.0));
            return map;
        }).collect(Collectors.toList());
        insights.put("requiredSkillsWeighted", skillWeightsList);

        // Similar jobs (same company or similar title)
        List<Job> similar = findSimilarJobs(job);
        insights.put("similarJobs", similar.stream().limit(5).map(j -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", j.getId());
            map.put("title", j.getTitle());
            map.put("company", j.getCompanyName());
            map.put("slug", j.getSlug());
            return map;
        }).collect(Collectors.toList()));

        return insights;
    }

    private Map<String, Double> computeSkillWeights() {
        List<Job> activeJobs = jobRepository.findByIsActiveTrue();
        Map<String, Integer> freq = new HashMap<>();
        for (Job j : activeJobs) {
            String skills = j.getRequiredSkills();
            if (skills != null) {
                for (String s : skills.split(",")) {
                    String key = s.trim().toLowerCase();
                    if (!key.isEmpty()) freq.put(key, freq.getOrDefault(key, 0) + 1);
                }
            }
        }
        int total = Math.max(1, activeJobs.size());
        Map<String, Double> weights = new HashMap<>();
        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            double w = Math.log((double) total / (e.getValue() + 1)) + 1.0;
            weights.put(e.getKey(), w);
        }
        return weights;
    }

    private int calculateExperienceContribution(int userExp, Integer reqExp) {
        if (reqExp == null) return 0;
        if (userExp >= reqExp) return 25;
        int diff = reqExp - userExp;
        if (diff <= 1) return 23;
        if (diff <= 2) return 20;
        if (diff <= 3) return 15;
        return 0;
    }

    private int calculateLocationContribution(String userLocation, JobSeekerProfile profile, Job job) {
        if ((profile != null && profile.getWorkPreference() != null && job.getWorkType() != null) || (userLocation != null && job.getLocation() != null)) {
            return scoreLocationMatch(userLocation, profile != null ? profile.getWorkPreference() : null, job.getLocation(), job.getWorkType());
        }
        return 0;
    }

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

    private int scoreJobTitleSimilarity(String userTitle, String jobTitle) {
        if (userTitle == null || userTitle.isEmpty() || jobTitle == null || jobTitle.isEmpty()) {
            return 0;
        }

        String userTitleLower = userTitle.toLowerCase();
        String jobTitleLower = jobTitle.toLowerCase();

        if (userTitleLower.equals(jobTitleLower)) {
            return 15;
        }

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

    private List<Job> findSimilarJobs(Job job) {
        List<Job> result = new ArrayList<>();
        try {
            Pageable p = PageRequest.of(0, 6);
            if (job.getCompanyName() != null && !job.getCompanyName().isBlank()) {
                Optional<Job> same = jobRepository.findFirstByTitleIgnoreCaseAndCompanyNameIgnoreCase(job.getTitle(), job.getCompanyName());
                same.ifPresent(j -> { if (!j.getId().equals(job.getId())) result.add(j); });
            }
            // Fallback: find by title keywords
            String title = job.getTitle() != null ? job.getTitle().split("\\s+")[0] : "";
            if (!title.isEmpty()) {
                List<Job> found = jobRepository.findByTitleContainingIgnoreCase(title, p);
                for (Job j : found) {
                    if (!j.getId().equals(job.getId())) result.add(j);
                }
            }
        } catch (Exception e) {
            logger.warn("Error finding similar jobs: {}", e.getMessage());
        }
        return result;
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
