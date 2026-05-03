package com.edutech.jobportalsystem.controller;

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.service.TranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class TranslationController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private TranslationService translationService;

    /**
     * Translate a specific job's content on-demand
     * POST /api/jobs/{jobId}/translate
     */
    @PostMapping("/{jobId}/translate")
    public ResponseEntity<?> translateJob(@PathVariable Long jobId) {
        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (!jobOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Job job = jobOpt.get();
        Map<String, Object> result = new HashMap<>();

        try {
            // Translate title
            String translatedTitle = translationService.translateToEnglish(job.getTitle());
            if (!translatedTitle.equals(job.getTitle())) {
                job.setTitle(translatedTitle);
            }

            // Translate description
            if (job.getDescription() != null && !job.getDescription().isBlank()) {
                String translatedDesc = translationService.translateToEnglish(job.getDescription());
                if (!translatedDesc.equals(job.getDescription())) {
                    job.setDescription(translatedDesc);
                }
            }

            // Translate required skills
            if (job.getRequiredSkills() != null && !job.getRequiredSkills().isBlank()) {
                String translatedSkills = translationService.translateToEnglish(job.getRequiredSkills());
                if (!translatedSkills.equals(job.getRequiredSkills())) {
                    job.setRequiredSkills(translatedSkills);
                }
            }

            // Translate how to apply
            if (job.getHowToApply() != null && !job.getHowToApply().isBlank()) {
                String translatedApply = translationService.translateToEnglish(job.getHowToApply());
                if (!translatedApply.equals(job.getHowToApply())) {
                    job.setHowToApply(translatedApply);
                }
            }

            jobRepository.save(job);

            result.put("success", true);
            result.put("message", "Job translated successfully");
            result.put("job", job);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * Get translation preview without saving
     * GET /api/jobs/{jobId}/translate-preview
     */
    @GetMapping("/{jobId}/translate-preview")
    public ResponseEntity<?> getTranslationPreview(@PathVariable Long jobId) {
        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (!jobOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Job job = jobOpt.get();
        Map<String, Object> preview = new HashMap<>();

        try {
            // Preview translations without saving
            String previewTitle = translationService.translateToEnglish(job.getTitle());
            String previewDesc = job.getDescription() != null ? translationService.translateToEnglish(job.getDescription()) : "";
            String previewSkills = job.getRequiredSkills() != null ? translationService.translateToEnglish(job.getRequiredSkills()) : "";
            String previewApply = job.getHowToApply() != null ? translationService.translateToEnglish(job.getHowToApply()) : "";

            preview.put("original", new HashMap<String, String>() {{
                put("title", job.getTitle());
                put("description", job.getDescription() != null ? job.getDescription() : "");
                put("requiredSkills", job.getRequiredSkills() != null ? job.getRequiredSkills() : "");
                put("howToApply", job.getHowToApply() != null ? job.getHowToApply() : "");
            }});

            preview.put("translated", new HashMap<String, String>() {{
                put("title", previewTitle);
                put("description", previewDesc);
                put("requiredSkills", previewSkills);
                put("howToApply", previewApply);
            }});

            preview.put("hasChanges", !previewTitle.equals(job.getTitle()) ||
                    (job.getDescription() != null && !previewDesc.equals(job.getDescription())) ||
                    (job.getRequiredSkills() != null && !previewSkills.equals(job.getRequiredSkills())) ||
                    (job.getHowToApply() != null && !previewApply.equals(job.getHowToApply())));

            return ResponseEntity.ok(preview);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Check translation service status
     * GET /api/translation/status
     */
    @GetMapping("/translation/status")
    public ResponseEntity<?> getTranslationStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("enabled", translationService.isConfigured());
        status.put("message", translationService.isConfigured() ? 
            "Translation service is ready" : "Translation service not configured");
        return ResponseEntity.ok(status);
    }
}
