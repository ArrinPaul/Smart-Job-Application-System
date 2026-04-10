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
            @Value("${app.admin.bootstrap.enabled:true}") boolean enabled,
            @Value("${app.admin.bootstrap.username:admin}") String username,
            @Value("${app.admin.bootstrap.email:admin@jobportal.local}") String email,
            @Value("${app.admin.bootstrap.password:Admin@123}") String password
    ) {
        return args -> {
            if (!enabled) {
                logger.info("Admin bootstrap is disabled");
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
            logger.warn("Default admin account created. Username: {}. Please change the password after first login.", username);
        };
    }
}
