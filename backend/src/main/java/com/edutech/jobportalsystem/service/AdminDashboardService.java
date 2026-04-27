package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.Application;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.repository.ApplicationRepository;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_RECRUITER = "RECRUITER";
    private static final String ROLE_JOB_SEEKER = "JOB_SEEKER";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private HealthEndpoint healthEndpoint;

    public Map<String, Object> getDashboardSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = startOfToday.plusDays(1);
        LocalDateTime activeSince = now.minusDays(30);

        // For "recent jobs" we still need the list for the snapshot
        List<Job> recentJobs = jobRepository.findByCreatedAtAfterOrderByCreatedAtDesc(activeSince);
        
        long activeRecruiters = jobRepository.countDistinctRecruitersSince(activeSince);
        long activeApplicants = applicationRepository.countDistinctApplicantsSince(activeSince);
        // Note: This is an approximation of (Recruiters UNION Applicants). 
        // For absolute precision we'd need a more complex query, but this is much faster.
        long totalActiveUsers = activeRecruiters + activeApplicants; 

        Map<String, Long> usersByRole = new LinkedHashMap<>();
        usersByRole.put(ROLE_ADMIN, userRepository.countByRole(ROLE_ADMIN));
        usersByRole.put(ROLE_RECRUITER, userRepository.countByRole(ROLE_RECRUITER));
        usersByRole.put(ROLE_JOB_SEEKER, userRepository.countByRole(ROLE_JOB_SEEKER));

        Map<String, Long> applicationsByStatus = new HashMap<>();
        List<Object[]> statusCounts = applicationRepository.countApplicationsByStatus();
        for (Object[] row : statusCounts) {
            String status = row[0] == null ? "UNKNOWN" : (String) row[0];
            Long count = (Long) row[1];
            applicationsByStatus.put(status, count);
        }

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalUsers", userRepository.count());
        kpis.put("totalJobs", jobRepository.count());
        kpis.put("totalApplications", applicationRepository.count());
        kpis.put("activeUsers", totalActiveUsers);
        kpis.put("activeJobs", jobRepository.countByCreatedAtAfter(activeSince));
        kpis.put("jobsPostedToday", jobRepository.countByCreatedAtBetween(startOfToday, endOfToday));

        List<Map<String, Object>> recentJobsSnapshot = recentJobs.stream()
                .limit(5)
                .map(job -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", job.getId());
                    item.put("title", job.getTitle());
                    item.put("location", job.getLocation());
                    item.put("createdAt", job.getCreatedAt());
                    item.put("postedBy", job.getPostedBy() != null ? job.getPostedBy().getUsername() : null);
                    return item;
                })
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("generatedAt", now);
        response.put("kpis", kpis);
        response.put("usersByRole", usersByRole);
        response.put("applicationsByStatus", applicationsByStatus);
        response.put("recentJobs", recentJobsSnapshot);
        
        // Real-time chart data structures
        List<String> last7DaysLabels = new java.util.ArrayList<>();
        List<Long> jobTrendData = new java.util.ArrayList<>();
        List<Long> activeRecruitersTrend = new java.util.ArrayList<>();
        
        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = LocalDate.now().minusDays(i).atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1).minusNanos(1);
            
            last7DaysLabels.add(dayStart.toLocalDate().getMonth().name().substring(0, 3) + " " + dayStart.getDayOfMonth());
            jobTrendData.add(jobRepository.countByCreatedAtBetween(dayStart, dayEnd));
            activeRecruitersTrend.add(jobRepository.countDistinctRecruitersSince(dayStart) - jobRepository.countDistinctRecruitersSince(dayEnd));
        }

        response.put("jobTrends", Map.of(
            "labels", last7DaysLabels,
            "data", jobTrendData
        ));
        
        response.put("recruiterActivity", Map.of(
            "labels", last7DaysLabels,
            "recruiters", activeRecruitersTrend,
            "jobs", jobTrendData
        ));
        
        response.put("applicationFunnel", Map.of(
            "labels", List.of("Applied", "Reviewed", "Shortlisted", "Interviewed", "Offered", "Hired"),
            "data", List.of(
                applicationsByStatus.getOrDefault("APPLIED", 0L),
                applicationsByStatus.getOrDefault("REVIEWED", 0L),
                applicationsByStatus.getOrDefault("SHORTLISTED", 0L),
                applicationsByStatus.getOrDefault("INTERVIEWED", 0L),
                applicationsByStatus.getOrDefault("OFFERED", 0L),
                applicationsByStatus.getOrDefault("HIRED", 0L)
            )
        ));

        response.put("metricDefinitions", Map.of(
                "activeUsers", "Distinct users who posted jobs or applied in the last 30 days.",
                "activeJobs", "Jobs posted in the last 30 days."
        ));
        response.put("systemStatus", getSystemStatus());

        return response;
    }

    public Map<String, Object> getSystemStatus() {
        HealthComponent health = healthEndpoint.health();

        String databaseStatus = "UP";
        try {
            userRepository.count();
        } catch (Exception ex) {
            databaseStatus = "DOWN";
        }

        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("apiStatus", "UP");
        status.put("overallHealth", health.getStatus().getCode());
        status.put("databaseStatus", databaseStatus);
        status.put("uptimeSeconds", uptimeSeconds);
        status.put("serverTime", LocalDateTime.now());
        status.put("javaVersion", System.getProperty("java.version"));
        if (health instanceof Health concreteHealth) {
            status.put("healthDetails", concreteHealth.getDetails());
        } else {
            status.put("healthDetails", Map.of());
        }

        return status;
    }
}
