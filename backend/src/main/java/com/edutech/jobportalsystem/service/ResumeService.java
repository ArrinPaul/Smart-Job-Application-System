package com.edutech.jobportalsystem.service;

// File: ./src/main/java/com/edutech/jobportalsystem/service/ResumeService.java

import com.edutech.jobportalsystem.entity.Resume;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.ResumeRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@Service
public class ResumeService {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    public Resume uploadResume(MultipartFile file, String ownerUsername) {
        User owner = userRepository.findByUsername(ownerUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Resume resume = resumeRepository.findByOwner(owner).orElse(new Resume());
        
        try {
            resume.setFileName(file.getOriginalFilename());
            resume.setFileType(file.getContentType());
            resume.setData(file.getBytes());
            resume.setOwner(owner);
            return resumeRepository.save(resume);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store resume data", e);
        }
    }

    public Resume getResumeByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return resumeRepository.findByOwner(user)
                .orElseThrow(() -> new RuntimeException("No resume found for this user"));
    }
}
