package com.edutech.jobportalsystem.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class JobScraperScheduler {

    private static final Logger logger = LoggerFactory.getLogger(JobScraperScheduler.class);

    @Autowired
    private JobIngestionService jobIngestionService;

    /**
     * Runs daily at midnight to fetch new job listings.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void scheduleDailyJobScraping() {
        logger.info("Starting daily job scraping task...");
        try {
            List<Map<String, String>> scrapedJobs = scrapeHackerNewsJobs();
            
            if (scrapedJobs.isEmpty()) {
                logger.warn("Scraper returned no jobs from primary source. Falling back to simulated pool.");
                scrapedJobs = fetchNewDailyJobs();
            }
            
            jobIngestionService.ingestJobs(scrapedJobs);
            logger.info("Job scraping completed. Ingested {} roles.", scrapedJobs.size());
        } catch (Exception e) {
            logger.error("Error during scheduled job scraping", e);
        }
    }

    private List<Map<String, String>> scrapeHackerNewsJobs() {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            logger.info("Scraping Hacker News Jobs...");
            Document doc = Jsoup.connect("https://news.ycombinator.com/jobs")
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(10000)
                    .get();

            Elements jobRows = doc.select("tr.athing");
            for (Element row : jobRows) {
                Element titleElement = row.selectFirst("td.title a.storylink");
                if (titleElement != null) {
                    String fullTitle = titleElement.text();
                    String url = titleElement.absUrl("href");
                    
                    // Basic parsing: "Company (YC S21) Is Hiring Software Engineers" -> Title: Software Engineers, Location: Remote/YC
                    String title = fullTitle;
                    String location = "Remote / USA";
                    String description = "Exciting opportunity found on Hacker News Jobs. More info at: " + url;

                    if (fullTitle.contains(" is hiring ") || fullTitle.contains(" Is Hiring ")) {
                        String[] parts = fullTitle.split("(?i) is hiring ");
                        if (parts.length > 1) {
                            title = parts[1];
                            description = "Company: " + parts[0] + ". " + description;
                        }
                    }

                    jobs.add(Map.of(
                        "title", title,
                        "location", location,
                        "description", description
                    ));
                    
                    if (jobs.size() >= 10) break; // Limit to 10 for safety
                }
            }
        } catch (IOException e) {
            logger.error("Failed to scrape HN Jobs: {}", e.getMessage());
        }
        return jobs;
    }

    private List<Map<String, String>> fetchNewDailyJobs() {
        List<Map<String, String>> jobs = new ArrayList<>();
        int dayOfWeek = java.time.LocalDate.now().getDayOfWeek().getValue();
        
        // Expanded simulation pool
        if (dayOfWeek % 3 == 0) {
            jobs.add(Map.of(
                "title", "Senior Site Reliability Engineer (SRE)",
                "location", "Remote - North America",
                "description", "Manage high-scale Kubernetes clusters and automate infrastructure with Terraform and Go. Focus on 99.99% uptime for global media streaming services."
            ));
            jobs.add(Map.of(
                "title", "Frontend Lead (React 19)",
                "location", "London / Hybrid",
                "description", "Lead a team of 5 engineers to rebuild our core dashboard using React 19 and Server Components. Focus on web vitals and accessible design systems."
            ));
        } else if (dayOfWeek % 3 == 1) {
            jobs.add(Map.of(
                "title", "Staff Data Engineer",
                "location", "San Francisco / Remote",
                "description", "Architect petabyte-scale data pipelines using Spark, Snowflake, and dbt. Drive data quality initiatives across the entire engineering org."
            ));
            jobs.add(Map.of(
                "title", "Cybersecurity Analyst (SOC)",
                "location", "Washington, DC",
                "description", "Monitor and respond to security threats in real-time. Experience with SIEM tools, network forensics, and incident response protocols required."
            ));
        } else {
            jobs.add(Map.of(
                "title", "Product Designer (UX/UI)",
                "location", "Austin, TX / Remote",
                "description", "Design intuitive interfaces for our next-gen fintech platform. Focus on user research, wireframing, and high-fidelity prototyping using Figma."
            ));
            jobs.add(Map.of(
                "title", "Mobile Developer (Flutter)",
                "location", "Berlin, Germany",
                "description", "Build cross-platform mobile applications for a growing e-commerce startup. Focus on performance, animations, and clean architecture."
            ));
        }
        
        return jobs;
    }
}
