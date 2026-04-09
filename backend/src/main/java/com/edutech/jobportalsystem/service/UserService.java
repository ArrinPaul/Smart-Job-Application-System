package com.edutech.jobportalsystem.service;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/service/UserService.java

import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.BadRequestException;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.debug("Loading user for auth: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }

    public User registerUser(User user) {
        logger.info("Processing registration for user: {}", user.getUsername());
        if (userRepository.existsByUsername(user.getUsername())) {
            logger.warn("Registration failed: Username {} taken", user.getUsername());
            throw new BadRequestException("Username already taken");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            logger.warn("Registration failed: Email {} taken", user.getEmail());
            throw new BadRequestException("Email already registered");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        logger.info("User {} registered successfully", savedUser.getUsername());
        return savedUser;
    }

    public List<User> getAllUsers() {
        logger.debug("Fetching all users from database");
        return userRepository.findAll();
    }

    public User getUserByUsername(String username) {
        logger.debug("Fetching user by username: {}", username);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }
}
