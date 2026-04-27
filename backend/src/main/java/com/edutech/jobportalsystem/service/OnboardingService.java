package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.dto.onboarding.OnboardingStepRequest;
import com.edutech.jobportalsystem.entity.*;
import com.edutech.jobportalsystem.exception.BadRequestException;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class OnboardingService {

    private static final Logger logger = LoggerFactory.getLogger(OnboardingService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OnboardingProgressRepository onboardingProgressRepository;

    @Autowired
    private RecruiterProfileRepository recruiterProfileRepository;

    @Autowired
    private JobSeekerProfileRepository jobSeekerProfileRepository;

    // ========== STEP 1: Basic Information ==========
    @Transactional
    public Map<String, Object> saveStep1(String username, OnboardingStepRequest request) {
        logger.info("Saving onboarding step 1 for user: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Validate
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Full name is required");
        }
        if (request.getLocation() == null || request.getLocation().trim().isEmpty()) {
            throw new BadRequestException("Location is required");
        }

        // Save to user profile
        user.setFullName(request.getFullName().trim());
        user.setLocation(request.getLocation().trim());
        user.setBio(request.getBio() != null ? request.getBio().trim() : "");
        userRepository.save(user);

        // Update onboarding progress
        OnboardingProgress progress = getOrCreateProgress(user);
        progress.setStep1Completed(true);
        progress.setCurrentStep(2);
        onboardingProgressRepository.save(progress);

        logger.info("Step 1 completed for user: {}", username);
        return getOnboardingStatus(username);
    }

    // ========== STEP 2: Professional Details ==========
    @Transactional
    public Map<String, Object> saveStep2(String username, OnboardingStepRequest request) {
        logger.info("Saving onboarding step 2 for user: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Validate
        if (request.getHeadline() == null || request.getHeadline().trim().isEmpty()) {
            throw new BadRequestException("Professional headline is required");
        }

        user.setHeadline(request.getHeadline().trim());

        if ("RECRUITER".equals(user.getRole())) {
            // Recruiter: save company info
            if (request.getCompanyName() == null || request.getCompanyName().trim().isEmpty()) {
                throw new BadRequestException("Company name is required for recruiters");
            }
            user.setCompanyName(request.getCompanyName().trim());
            if (request.getCompanyWebsite() != null) {
                user.setWebsite(request.getCompanyWebsite().trim());
            }

            // Create or update recruiter profile
            RecruiterProfile profile = recruiterProfileRepository.findByUser(user)
                    .orElse(new RecruiterProfile());
            profile.setUser(user);
            profile.setCompanyName(request.getCompanyName().trim());
            profile.setCompanyWebsite(request.getCompanyWebsite() != null ? request.getCompanyWebsite().trim() : null);
            profile.setIndustry(request.getIndustry());
            profile.setCompanySize(request.getCompanySize());
            recruiterProfileRepository.save(profile);
        } else if ("JOB_SEEKER".equals(user.getRole())) {
            // Job Seeker: save skills
            if (request.getSkills() != null) {
                user.setSkills(request.getSkills().trim());
            }

            // Create or update job seeker profile
            JobSeekerProfile profile = jobSeekerProfileRepository.findByUser(user)
                    .orElse(new JobSeekerProfile());
            profile.setUser(user);
            profile.setProfessionalHeadline(request.getHeadline().trim());
            profile.setSkills(request.getSkills() != null ? request.getSkills().trim() : "");
            profile.setExperienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0);
            jobSeekerProfileRepository.save(profile);
        }

        userRepository.save(user);

        OnboardingProgress progress = getOrCreateProgress(user);
        progress.setStep2Completed(true);
        progress.setCurrentStep(3);
        onboardingProgressRepository.save(progress);

        logger.info("Step 2 completed for user: {}", username);
        return getOnboardingStatus(username);
    }

    // ========== STEP 3: Additional Details ==========
    @Transactional
    public Map<String, Object> saveStep3(String username, OnboardingStepRequest request) {
        logger.info("Saving onboarding step 3 for user: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }

        if ("JOB_SEEKER".equals(user.getRole())) {
            JobSeekerProfile profile = jobSeekerProfileRepository.findByUser(user)
                    .orElse(new JobSeekerProfile());
            profile.setUser(user);
            if (request.getCurrentCompany() != null) {
                profile.setCurrentCompany(request.getCurrentCompany().trim());
            }
            if (request.getCurrentDesignation() != null) {
                profile.setCurrentDesignation(request.getCurrentDesignation().trim());
            }
            profile.setEducation(request.getEducation());
            jobSeekerProfileRepository.save(profile);
        }

        userRepository.save(user);

        OnboardingProgress progress = getOrCreateProgress(user);
        progress.setStep3Completed(true);
        progress.setCurrentStep(4);
        onboardingProgressRepository.save(progress);

        logger.info("Step 3 completed for user: {}", username);
        return getOnboardingStatus(username);
    }

    // ========== STEP 4: Work Preferences ==========
    @Transactional
    public Map<String, Object> saveStep4(String username, OnboardingStepRequest request) {
        logger.info("Saving onboarding step 4 for user: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if ("JOB_SEEKER".equals(user.getRole())) {
            JobSeekerProfile profile = jobSeekerProfileRepository.findByUser(user)
                    .orElse(new JobSeekerProfile());
            profile.setUser(user);
            profile.setOpenToOpportunities(request.getOpenToOpportunities() != null ? request.getOpenToOpportunities() : true);
            profile.setWorkPreference(request.getWorkPreference());
            if (request.getExpectedSalaryMin() != null) {
                profile.setExpectedSalaryMin(request.getExpectedSalaryMin());
            }
            if (request.getExpectedSalaryMax() != null) {
                profile.setExpectedSalaryMax(request.getExpectedSalaryMax());
            }
            jobSeekerProfileRepository.save(profile);
        }

        OnboardingProgress progress = getOrCreateProgress(user);
        progress.setStep4Completed(true);
        progress.setCurrentStep(5);
        onboardingProgressRepository.save(progress);

        logger.info("Step 4 completed for user: {}", username);
        return getOnboardingStatus(username);
    }

    // ========== STEP 5: Complete Onboarding ==========
    @Transactional
    public Map<String, Object> completeOnboarding(String username) {
        logger.info("Completing onboarding for user: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        user.setOnboardingCompleted(true);
        user.setOnboardingCompletedAt(LocalDateTime.now());
        userRepository.save(user);

        OnboardingProgress progress = getOrCreateProgress(user);
        progress.setStep5Completed(true);
        progress.setCurrentStep(5);
        progress.setCompletedAt(LocalDateTime.now());
        onboardingProgressRepository.save(progress);

        logger.info("Onboarding completed successfully for user: {}", username);
        return Map.of(
                "message", "Onboarding completed successfully",
                "onboardingCompleted", true
        );
    }

    // ========== Helper Methods ==========
    private OnboardingProgress getOrCreateProgress(User user) {
        return onboardingProgressRepository.findByUser(user)
                .orElseGet(() -> {
                    OnboardingProgress progress = new OnboardingProgress();
                    progress.setUser(user);
                    progress.setCurrentStep(1);
                    progress.setStartedAt(LocalDateTime.now());
                    progress.setLastUpdatedAt(LocalDateTime.now());
                    return progress;
                });
    }

    public Map<String, Object> getOnboardingStatus(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        OnboardingProgress progress = onboardingProgressRepository.findByUser(user)
                .orElseGet(() -> {
                    OnboardingProgress p = new OnboardingProgress();
                    p.setUser(user);
                    p.setCurrentStep(1);
                    p.setStartedAt(LocalDateTime.now());
                    p.setLastUpdatedAt(LocalDateTime.now());
                    onboardingProgressRepository.save(p);
                    return p;
                });

        Map<String, Object> status = new HashMap<>();
        status.put("currentStep", progress.getCurrentStep());
        status.put("maxStepReached", progress.getMaxStepReached());
        status.put("completionPercentage", progress.getCompletionPercentage());
        status.put("isCompleted", progress.isCompleted());
        status.put("step1Completed", progress.getStep1Completed());
        status.put("step2Completed", progress.getStep2Completed());
        status.put("step3Completed", progress.getStep3Completed());
        status.put("step4Completed", progress.getStep4Completed());
        status.put("step5Completed", progress.getStep5Completed());
        status.put("userRole", user.getRole());

        return status;
    }

    public void skipOnboarding(String username) {
        logger.warn("User {} skipped onboarding", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        user.setOnboardingCompleted(true);
        user.setOnboardingCompletedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
