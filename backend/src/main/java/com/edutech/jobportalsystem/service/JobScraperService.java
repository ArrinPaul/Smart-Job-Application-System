package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Service for scraping jobs from multiple job portals (Indeed, Internshala, etc.)
 * and normalizing them into the job portal database.
 */
@Service
public class JobScraperService {

    private static final Logger logger = LoggerFactory.getLogger(JobScraperService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    private static final String SYSTEM_USER = "SYSTEM_SCRAPER";
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    /**
     * Schedule job scraping to run every 6 hours (21600000 ms)
     * Can be adjusted based on desired update frequency
     */
    @Scheduled(fixedRate = 21600000, initialDelay = 60000)
    public void scheduledScraping() {
        logger.info("Starting scheduled job scraping task");
        try {
            scrapeIndeed("Java Developer", "Remote");
            scrapeInternshala("Software Engineer", "Remote");
        } catch (Exception e) {
            logger.error("Error during scheduled scraping", e);
        }
    }

    /**
     * Scrape jobs from Indeed
     */
    public List<Job> scrapeIndeed(String query, String location) {
        List<Job> scrapedJobs = new ArrayList<>();
        try {
            // Construct Indeed search URL
            String query_encoded = query.replace(" ", "+");
            String location_encoded = location.replace(" ", "+");
            String url = String.format(
                    "https://www.indeed.com/jobs?q=%s&l=%s&limit=50",
                    query_encoded, location_encoded
            );

            logger.info("Scraping Indeed: {}", url);

            // Fetch and parse the page
            Document doc = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .timeout((int) TimeUnit.SECONDS.toMillis(10))
                    .get();

            // Extract job listings
            Elements jobCards = doc.select("div.job_seen_beacon");

            for (Element card : jobCards) {
                try {
                    String title = card.select("h2.jobTitle span").text();
                    String company = card.select("span.companyName").text();
                    String location_text = card.select("div.companyLocation").text();
                    String snippet = card.select("div.job-snippet ul li").text();

                    if (!title.isEmpty() && !company.isEmpty()) {
                        Job job = normalizeJob(title, company, location_text, snippet, "Indeed");
                        scrapedJobs.add(job);
                    }
                } catch (Exception e) {
                    logger.debug("Error parsing Indeed job card: {}", e.getMessage());
                }
            }

            // Save to database
            List<Job> savedJobs = saveScrapedJobs(scrapedJobs);
            logger.info("Scraped and saved {} jobs from Indeed", savedJobs.size());

        } catch (IOException e) {
            logger.error("Error scraping Indeed: {}", e.getMessage());
        }
        return scrapedJobs;
    }

    /**
     * Scrape jobs from Internshala
     */
    public List<Job> scrapeInternshala(String query, String location) {
        List<Job> scrapedJobs = new ArrayList<>();
        try {
            String url = "https://internshala.com/jobs";

            logger.info("Scraping Internshala: {}", url);

            Document doc = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .timeout((int) TimeUnit.SECONDS.toMillis(10))
                    .get();

            // Extract job listings from Internshala job cards
            Elements jobCards = doc.select("div.internship_card");

            for (Element card : jobCards) {
                try {
                    String title = card.select("h3.job-internship-name a").text();
                    String company = card.select("p.company-name a").text();
                    String location_text = card.select("p.location").text();
                    String profile = card.select("p.profile-name").text();

                    if (!title.isEmpty() && !company.isEmpty()) {
                        Job job = normalizeJob(title, company, location_text, profile, "Internshala");
                        scrapedJobs.add(job);
                    }
                } catch (Exception e) {
                    logger.debug("Error parsing Internshala job card: {}", e.getMessage());
                }
            }

            List<Job> savedJobs = saveScrapedJobs(scrapedJobs);
            logger.info("Scraped and saved {} jobs from Internshala", savedJobs.size());

        } catch (IOException e) {
            logger.error("Error scraping Internshala: {}", e.getMessage());
        }
        return scrapedJobs;
    }

    /**
     * Normalize scraped job data into Job entity
     */
    private Job normalizeJob(String title, String company, String location, String description, String source) {
        Job job = new Job();

        // Clean and normalize title
        job.setTitle(sanitizeText(title));

        // Set company as description if location is empty
        if (location == null || location.isBlank()) {
            location = company;
        }
        job.setLocation(sanitizeText(location));

        // Clean description
        job.setDescription(sanitizeText(description));

        // Set posted_by to SYSTEM_SCRAPER user
        Optional<User> systemUser = userRepository.findByUsername(SYSTEM_USER);
        if (systemUser.isPresent()) {
            job.setPostedBy(systemUser.get());
        } else {
            // Create SYSTEM_SCRAPER user if it doesn't exist
            User scraper = new User();
            scraper.setUsername(SYSTEM_USER);
            scraper.setEmail("scraper@system.local");
            scraper.setPassword(""); // No password for system user
            scraper.setRole("SYSTEM");
            scraper.setEmailVerified(true);
            User savedScraper = userRepository.save(scraper);
            job.setPostedBy(savedScraper);
        }

        job.setCreatedAt(LocalDateTime.now());
        job.setSource(source); // Track which portal this came from

        return job;
    }

    /**
     * Save scraped jobs to database, avoiding duplicates
     */
    private List<Job> saveScrapedJobs(List<Job> jobs) {
        List<Job> savedJobs = new ArrayList<>();
        for (Job job : jobs) {
            try {
                // Check if job already exists (by title + location + source)
                boolean exists = jobRepository.findAll().stream()
                        .anyMatch(j -> j.getTitle().equalsIgnoreCase(job.getTitle())
                                && j.getLocation().equalsIgnoreCase(job.getLocation())
                                && j.getSource() != null
                                && j.getSource().equalsIgnoreCase(job.getSource()));

                if (!exists) {
                    Job saved = jobRepository.save(job);
                    savedJobs.add(saved);
                    logger.debug("Saved job: {} from {}", job.getTitle(), job.getSource());
                }
            } catch (Exception e) {
                logger.warn("Error saving job {}: {}", job.getTitle(), e.getMessage());
            }
        }
        return savedJobs;
    }

    /**
     * Sanitize text by removing HTML, extra whitespace, and control characters
     */
    private String sanitizeText(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        return text
                .replaceAll("<[^>]+>", "") // Remove HTML tags
                .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "") // Remove control chars
                .replaceAll("\\s+", " ") // Collapse whitespace
                .trim();
    }

    /**
     * Manually trigger scraping (can be called via admin endpoint)
     */
    public void triggerScraping() {
        logger.info("Manual scraping triggered");
        scheduledScraping();
    }

    /**
     * Get scraping statistics
     */
    public ScrapingStats getScrapingStats() {
        long totalScrapedJobs = jobRepository.findAll().stream()
                .filter(j -> j.getSource() != null && !j.getSource().isEmpty())
                .count();

        long fromIndeed = jobRepository.findAll().stream()
                .filter(j -> "Indeed".equals(j.getSource()))
                .count();

        long fromInternshala = jobRepository.findAll().stream()
                .filter(j -> "Internshala".equals(j.getSource()))
                .count();

        return new ScrapingStats(totalScrapedJobs, fromIndeed, fromInternshala);
    }

    /**
     * Statistics class for scraping metrics
     */
    public static class ScrapingStats {
        public long totalScrapedJobs;
        public long fromIndeed;
        public long fromInternshala;

        public ScrapingStats(long totalScrapedJobs, long fromIndeed, long fromInternshala) {
            this.totalScrapedJobs = totalScrapedJobs;
            this.fromIndeed = fromIndeed;
            this.fromInternshala = fromInternshala;
        }
    }
}
