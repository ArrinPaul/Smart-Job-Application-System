package com.edutech.jobportalsystem;

// File: src/main/java/com/edutech/jobportalsystem/JobPortalSystemApplication.java

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JobPortalSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(JobPortalSystemApplication.class, args);
    }
}
