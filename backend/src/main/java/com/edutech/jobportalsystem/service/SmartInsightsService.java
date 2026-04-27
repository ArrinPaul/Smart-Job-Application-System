package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.Resume;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.ResumeRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartInsightsService {

    private static final Logger logger = LoggerFactory.getLogger(SmartInsightsService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Match a user's resume against a specific job and return insights.
     */
    public Map<String, Object> getMatchInsights(Long jobId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        Optional<Resume> resumeOpt = resumeRepository.findByOwner(user);
        if (resumeOpt.isEmpty()) {
            return Map.of("error", "No resume found. Please upload a resume first to get insights.");
        }

        Resume resume = resumeOpt.get();
        // For a real implementation, we would use an LLM or a library to extract text from PDF/Doc
        // Here we simulate the analysis based on keywords.
        String jobTitle = job.getTitle().toLowerCase();
        String jobDesc = job.getDescription().toLowerCase();
        String resumeName = resume.getFileName().toLowerCase();

        int score = calculateMatchScore(jobTitle, jobDesc, resumeName);
        List<String> matchingSkills = identifyMatchingSkills(jobDesc, resumeName);
        List<String> missingSkills = identifyMissingSkills(jobDesc, matchingSkills);

        Map<String, Object> insights = new LinkedHashMap<>();
        insights.put("jobTitle", job.getTitle());
        insights.put("compatibilityScore", score);
        insights.put("matchLevel", getMatchLevel(score));
        insights.put("topMatches", matchingSkills);
        insights.put("improvementAreas", missingSkills);
        insights.put("recommendations", generateRecommendations(score, missingSkills));
        
        return insights;
    }

    private int calculateMatchScore(String title, String desc, String resume) {
        int score = 40; // Base score
        if (resume.contains("resume") || resume.contains("cv")) score += 5;
        
        // Simple keyword simulation
        String[] keywords = {"java", "python", "javascript", "ai", "cloud", "aws", "data", "engineer", "scientist", "mlops", "react", "spring"};
        for (String kw : keywords) {
            if (desc.contains(kw) && (resume.contains(kw) || Math.random() > 0.7)) {
                score += 5;
            }
        }
        
        return Math.min(score, 100);
    }

    private List<String> identifyMatchingSkills(String desc, String resume) {
        String[] skills = {"Java", "Python", "SQL", "Cloud", "Agile", "Microservices", "API", "React", "Docker", "Kubernetes"};
        return Arrays.stream(skills)
                .filter(skill -> desc.contains(skill.toLowerCase()))
                .limit(4)
                .collect(Collectors.toList());
    }

    private List<String> identifyMissingSkills(String desc, List<String> matches) {
        String[] allPossible = {"Terraform", "Jenkins", "Machine Learning", "Big Data", "System Design", "Security"};
        List<String> missing = new ArrayList<>();
        for (String s : allPossible) {
            if (desc.contains(s.toLowerCase()) && !matches.contains(s)) {
                missing.add(s);
            }
        }
        if (missing.isEmpty()) missing.add("Advanced Certifications");
        return missing.stream().limit(3).collect(Collectors.toList());
    }

    private String getMatchLevel(int score) {
        if (score >= 85) return "Excellent Match";
        if (score >= 70) return "Strong Match";
        if (score >= 50) return "Fair Match";
        return "Low Match - Needs Optimization";
    }

    private List<String> generateRecommendations(int score, List<String> missing) {
        List<String> recs = new ArrayList<>();
        if (score < 70) {
            recs.add("Highlight more experience with " + (missing.isEmpty() ? "industry-specific tools" : missing.get(0)));
            recs.add("Quantify your achievements with data (e.g., 'Improved performance by 20%')");
        } else {
            recs.add("Your resume is well-aligned. Focus on cultural fit in your application.");
        }
        recs.add("Tailor your summary to mention the specific job title.");
        return recs;
    }
}
