package com.edutech.jobportalsystem.controller;

import com.edutech.jobportalsystem.entity.Resume;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.ResumeRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import com.edutech.jobportalsystem.service.ResumeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/resume")
public class ResumeController {

    private static final Logger logger = LoggerFactory.getLogger(ResumeController.class);

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> downloadResume(@PathVariable Long id) {
        logger.info("Downloading resume ID: {}", id);
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", id));

        enforceResumeAccess(resume.getOwner().getId());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resume.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resume.getFileName() + "\"")
                .body(resume.getData());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Resume>> getUserResume(@PathVariable Long userId) {
        logger.info("Fetching resume metadata for user ID: {}", userId);
        enforceResumeAccess(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        return resumeRepository.findByOwner(user)
                .map(resume -> ResponseEntity.ok(Collections.singletonList(resume)))
                .orElse(ResponseEntity.ok(Collections.emptyList()));
    }

    private void enforceResumeAccess(Long ownerUserId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));
        boolean isRecruiter = authentication.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_RECRUITER".equals(auth.getAuthority()));

        if (isAdmin || isRecruiter) {
            return;
        }

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (!currentUser.getId().equals(ownerUserId)) {
            throw new ResourceNotFoundException("Resume", "owner", ownerUserId);
        }
    }
}
