package com.edutech.jobportalsystem.repository;

// File: ./src/main/java/com/edutech/jobportalsystem/repository/UserRepository.java

import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailVerificationToken(String token);

    Optional<User> findByPasswordResetToken(String token);

    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);

    long countByRole(String role);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(:query) OR LOWER(u.fullName) LIKE LOWER(:query) OR LOWER(u.email) LIKE LOWER(:query)")
    java.util.List<User> searchUsers(@org.springframework.data.repository.query.Param("query") String query);
}
