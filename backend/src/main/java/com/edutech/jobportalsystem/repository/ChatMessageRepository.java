package com.edutech.jobportalsystem.repository;

import com.edutech.jobportalsystem.entity.ChatMessage;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    List<ChatMessage> findByUserOrderByCreatedAtAsc(User user);
}
