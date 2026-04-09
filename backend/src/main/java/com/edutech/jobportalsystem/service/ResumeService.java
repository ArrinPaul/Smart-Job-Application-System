package com.edutech.jobportalsystem.service;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/service/ResumeService.java

import com.edutech.jobportalsystem.entity.Resume;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.BadRequestException;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.ResumeRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@Service
@Transactional
public class ResumeService {
    private static final Logger logger = LoggerFactory.getLogger(ResumeService.class);
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_TYPES = {"application/pdf", "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"};

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    public Resume uploadResume(MultipartFile file, String ownerUsername) {
        logger.info("Resume upload request from user: {}", ownerUsername);
        
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty or missing");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds 5MB limit");
        }
        
        if (!isValidFileType(file.getContentType())) {
            throw new BadRequestException("Only PDF and Word documents are allowed");
        }
        
        User owner = userRepository.findByUsername(ownerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", ownerUsername));

        Resume resume = resumeRepository.findByOwner(owner).orElse(new Resume());
        
        try {
            resume.setFileName(file.getOriginalFilename());
            resume.setFileType(file.getContentType());
            resume.setData(file.getBytes());
            resume.setOwner(owner);
            Resume savedResume = resumeRepository.save(resume);
            logger.info("Resume uploaded successfully for user: {}", ownerUsername);
            return savedResume;
        } catch (IOException e) {
            logger.error("Failed to upload resume for user: {}", ownerUsername, e);
            throw new BadRequestException("Failed to upload resume: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Resume getResumeByUsername(String username) {
        logger.debug("Fetching resume for user: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return resumeRepository.findByOwner(user)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "owner", username));
    }
    
    private boolean isValidFileType(String contentType) {
        if (contentType == null) {
            return false;
        }
        for (String allowedType : ALLOWED_TYPES) {
            if (contentType.equals(allowedType)) {
                return true;
            }
        }
        return false;
    }
}
