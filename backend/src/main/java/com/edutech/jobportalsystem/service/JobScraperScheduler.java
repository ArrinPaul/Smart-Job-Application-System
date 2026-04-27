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
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class JobScraperScheduler {

    private static final Logger logger = LoggerFactory.getLogger(JobScraperScheduler.class);

    @Autowired
    private JobIngestionService jobIngestionService;

    private final RestTemplate restTemplate = new RestTemplate();

    @Scheduled(cron = "0 0 0 * * *")
    public void scheduleDailyJobScraping() {
        logger.info("Starting SUPREME REAL-WORLD job scraping task (Target: 500+)...");
        List<Map<String, String>> allJobs = new ArrayList<>();
        
        try {
            // Source 1: Remotive (Increased limit)
            allJobs.addAll(fetchRemotiveJobs(600));

            // Source 2: Arbeitnow (Increased pagination)
            allJobs.addAll(fetchArbeitnowJobs(5, 500));

            // Source 3: We Work Remotely
            allJobs.addAll(scrapeWeWorkRemotely(300));
            
            // Source 4: Hacker News (Deep Pagination)
            allJobs.addAll(scrapeHackerNewsJobs(10));
            
            // Source 5: Remote.co
            allJobs.addAll(scrapeRemoteCo(200));

            if (allJobs.isEmpty()) {
                logger.error("Scrapers failed to find data.");
            } else {
                jobIngestionService.ingestJobs(allJobs);
                logger.info("Supreme Ingestion Success! {} REAL roles with links added.", allJobs.size());
            }
        } catch (Exception e) {
            logger.error("Scraping error", e);
        }
    }

    private List<Map<String, String>> fetchRemotiveJobs(int limit) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            String url = "https://remotive.com/api/remote-jobs";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("jobs")) {
                List<Map<String, Object>> jobsList = (List<Map<String, Object>>) response.get("jobs");
                for (Map<String, Object> jobData : jobsList) {
                    String cleanDesc = Jsoup.parse((String) jobData.get("description")).text();
                    if (cleanDesc.length() > 800) cleanDesc = cleanDesc.substring(0, 800) + "...";
                    
                    jobs.add(Map.of(
                        "title", (String) jobData.get("title"),
                        "location", jobData.get("candidate_required_location") != null ? (String) jobData.get("candidate_required_location") : "Remote",
                        "applicationLink", (String) jobData.get("url"),
                        "description", "### ROLE OVERVIEW\n" + cleanDesc + "\n\n" +
                                       "### JOB SPECIFICS\n" +
                                       "• **Company:** " + jobData.get("company_name") + "\n" +
                                       "• **Category:** " + jobData.get("category") + "\n" +
                                       "• **Type:** " + (jobData.get("job_type") != null ? jobData.get("job_type") : "Full-time") + "\n\n" +
                                       "### HOW TO APPLY\n" +
                                       "Please click the link below to apply directly on Remotive."
                    ));
                    if (jobs.size() >= limit) break;
                }
            }
        } catch (Exception e) { logger.error("Remotive failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> fetchArbeitnowJobs(int pages, int limit) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            for (int p = 1; p <= pages; p++) {
                String url = "https://www.arbeitnow.com/api/job-board-api?page=" + p;
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);
                if (response != null && response.containsKey("data")) {
                    List<Map<String, Object>> jobsList = (List<Map<String, Object>>) response.get("data");
                    for (Map<String, Object> jobData : jobsList) {
                        jobs.add(Map.of(
                            "title", (String) jobData.get("title"),
                            "location", (String) jobData.get("location"),
                            "applicationLink", (String) jobData.get("url"),
                            "description", "### ROLE SUMMARY\nDiscover this high-impact opportunity at **" + jobData.get("company_name") + "**. This role involves working with cross-functional teams to drive innovation.\n\n" +
                                           "### KEY HIGHLIGHTS\n" +
                                           "• **Remote Status:** Verified " + (jobData.get("remote") != null ? "Remote" : "Hybrid/Office") + "\n" +
                                           "• **Source:** Arbeitnow European Job Board\n\n" +
                                           "### APPLICATION\n" +
                                           "Access the direct application portal via the link below."
                        ));
                        if (jobs.size() >= limit) break;
                    }
                }
                Thread.sleep(500); // Politeness
                if (jobs.size() >= limit) break;
            }
        } catch (Exception e) { logger.error("Arbeitnow failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> scrapeWeWorkRemotely(int limit) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://weworkremotely.com/remote-jobs").timeout(20000).get();
            Elements jobLinks = doc.select("section.jobs article ul li a[href^=/remote-jobs/]");
            for (Element a : jobLinks) {
                if (a.selectFirst("span.title") == null) continue;
                String company = a.selectFirst("span.company").text();
                String title = a.selectFirst("span.title").text();
                String region = a.selectFirst("span.region") != null ? a.selectFirst("span.region").text() : "Remote";
                
                jobs.add(Map.of(
                    "title", title,
                    "location", region,
                    "applicationLink", a.absUrl("href"),
                    "description", "### POSITION AT " + company.toUpperCase() + "\n" +
                                   "An exciting opportunity for a **" + title + "** to join a remote-first organization.\n\n" +
                                   "### CORE DETAILS\n" +
                                   "• **Company:** " + company + "\n" +
                                   "• **Location:** " + region + "\n" +
                                   "• **Source:** Verified We Work Remotely"
                ));
                if (jobs.size() >= limit) break;
            }
        } catch (Exception e) { logger.error("WWR failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> scrapeRemoteCo(int limit) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://remote.co/remote-jobs/it")
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(20000).get();
            Elements cards = doc.select("a.job_listing");
            for (Element card : cards) {
                Element titleElement = card.selectFirst("h3");
                if (titleElement != null) {
                    jobs.add(Map.of(
                        "title", titleElement.text(),
                        "location", "Remote",
                        "applicationLink", card.absUrl("href"),
                        "description", "### REMOTE.CO LISTING\nProfessional IT role sourced from Remote.co. " +
                                       "Full details and specific technical requirements are hosted on the employer's official portal."
                    ));
                }
                if (jobs.size() >= limit) break;
            }
        } catch (Exception e) { logger.error("Remote.co failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> scrapeHackerNewsJobs(int maxPages) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            for (int i = 1; i <= maxPages; i++) {
                Document doc = Jsoup.connect("https://news.ycombinator.com/jobs" + (i > 1 ? "?p=" + i : "")).timeout(10000).get();
                Elements rows = doc.select("tr.athing");
                if (rows.isEmpty()) break;
                for (Element row : rows) {
                    Element a = row.selectFirst("td.title a.storylink");
                    if (a != null) {
                        jobs.add(Map.of(
                            "title", a.text(),
                            "location", "Remote Friendly / Global",
                            "applicationLink", a.absUrl("href"),
                            "description", "### STARTUP ROLE (HN/YC)\n" + a.text() + "\n\n" +
                                           "### HIGHLIGHTS\n" +
                                           "• **Source:** Y Combinator / Hacker News\n" +
                                           "• **Ecosystem:** High-growth tech startup"
                        ));
                    }
                }
                Thread.sleep(1500);
                if (jobs.size() >= 200) break;
            }
        } catch (Exception e) { logger.error("HN failed: {}", e.getMessage()); }
        return jobs;
    }
}
