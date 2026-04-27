package com.edutech.jobportalsystem.task;

import com.edutech.jobportalsystem.service.JobScraperScheduler;
import com.edutech.jobportalsystem.service.JobIngestionService;
import com.edutech.jobportalsystem.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("supabase")
public class SupabaseCleanAndScrapeTask {

    @Autowired
    private JobScraperScheduler jobScraperScheduler;

    @Autowired
    private JobIngestionService jobIngestionService;

    @Autowired
    private JobRepository jobRepository;

    @MockBean
    private JavaMailSender mailSender;

    @Test
    void cleanAndScrapeOnSupabase() {
        System.out.println("Starting cleanup process...");
        jobIngestionService.deleteAllJobs();
        
        long countAfterDelete = jobRepository.count();
        System.out.println("Jobs in Supabase after deletion: " + countAfterDelete);
        
        System.out.println("Executing ENHANCED scrape with application links and detailed descriptions...");
        jobScraperScheduler.scheduleDailyJobScraping();
        
        long finalCount = jobRepository.count();
        System.out.println("Final job count in Supabase: " + finalCount);
        System.out.println("Successfully refreshed database with enhanced data.");
    }
}
