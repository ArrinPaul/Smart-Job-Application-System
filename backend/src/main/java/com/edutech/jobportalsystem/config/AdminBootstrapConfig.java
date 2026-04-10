package com.edutech.jobportalsystem.config;

import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrapConfig {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapConfig.class);

    @Bean
    public CommandLineRunner bootstrapAdminUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.bootstrap.enabled:false}") boolean enabled,
            @Value("${app.admin.bootstrap.username:admin}") String username,
            @Value("${app.admin.bootstrap.email:admin@example.com}") String email,
            @Value("${app.admin.bootstrap.password:}") String password
    ) {
        return args -> {
            if (!enabled) {
                logger.info("Admin bootstrap is disabled");
                return;
            }

            if (password == null || password.isBlank()) {
                logger.error("Admin bootstrap is enabled but no password is configured. Skipping bootstrap user creation.");
                return;
            }

            if (userRepository.existsByUsername(username)) {
                logger.info("Admin bootstrap skipped: user {} already exists", username);
                return;
            }

            User admin = new User();
            admin.setUsername(username);
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole("ADMIN");

            userRepository.save(admin);
            logger.warn("Bootstrap admin account created. Username: {}", username);
        };
    }
}
