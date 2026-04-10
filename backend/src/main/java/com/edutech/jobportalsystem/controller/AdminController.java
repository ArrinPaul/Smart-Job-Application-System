package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/AdminController.java

import com.edutech.jobportalsystem.service.JobService;
import com.edutech.jobportalsystem.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private JobService jobService;

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        logger.info("Admin request: fetching all users");
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/jobs")
    public ResponseEntity<?> getAllJobs() {
        logger.info("Admin request: fetching all jobs");
        return ResponseEntity.ok(jobService.getAllJobs());
    }
}
