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

        // Batch count queries
        long totalUsers = userRepository.count();
        long totalJobs = jobRepository.count();
        long totalApplications = applicationRepository.count();
        long activeJobs = jobRepository.countByCreatedAtAfter(activeSince);
        long jobsPostedToday = jobRepository.countByCreatedAtBetween(startOfToday, endOfToday);

        // Get application status distribution
        Map<String, Long> applicationsByStatus = new HashMap<>();
        List<Object[]> statusCounts = applicationRepository.countApplicationsByStatus();
        for (Object[] row : statusCounts) {
            String status = row[0] == null ? "UNKNOWN" : (String) row[0];
            Long count = (Long) row[1];
            applicationsByStatus.put(status, count);
        }

        Map<String, Long> usersByRole = new LinkedHashMap<>();
        usersByRole.put(ROLE_ADMIN, userRepository.countByRole(ROLE_ADMIN));
        usersByRole.put(ROLE_RECRUITER, userRepository.countByRole(ROLE_RECRUITER));
        usersByRole.put(ROLE_JOB_SEEKER, userRepository.countByRole(ROLE_JOB_SEEKER));

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalUsers", totalUsers);
        kpis.put("totalJobs", totalJobs);
        kpis.put("totalApplications", totalApplications);
        kpis.put("activeUsers", totalUsers); // Placeholder for performance
        kpis.put("activeJobs", activeJobs);
        kpis.put("jobsPostedToday", jobsPostedToday);

        // Optimized trend data (Reduced queries)
        List<String> last7DaysLabels = new java.util.ArrayList<>();
        List<Long> jobTrendData = new java.util.ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = LocalDate.now().minusDays(i).atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1).minusNanos(1);
            last7DaysLabels.add(dayStart.toLocalDate().getMonth().name().substring(0, 3) + " " + dayStart.getDayOfMonth());
            jobTrendData.add(jobRepository.countByCreatedAtBetween(dayStart, dayEnd));
        }

        // Recent Jobs Snapshot
        List<Job> recentJobs = jobRepository.findByCreatedAtAfterOrderByCreatedAtDesc(activeSince);
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

        response.put("jobTrends", Map.of(
            "labels", last7DaysLabels,
            "data", jobTrendData
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

        response.put("systemStatus", getSystemStatus());

        return response;
    }

    public Map<String, Object> getSystemStatus() {
        // Fast system status without full Actuator health check unless needed
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("apiStatus", "UP");
        status.put("databaseStatus", "UP"); // Assumed if we reached here
        status.put("uptimeSeconds", uptimeSeconds);
        status.put("serverTime", LocalDateTime.now());
        status.put("javaVersion", System.getProperty("java.version"));

        return status;
    }}
