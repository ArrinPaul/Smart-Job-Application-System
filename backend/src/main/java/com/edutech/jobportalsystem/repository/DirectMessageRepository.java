package com.edutech.jobportalsystem.repository;

import com.edutech.jobportalsystem.entity.DirectMessage;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    
    @Query("SELECT m FROM DirectMessage m WHERE (m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1) ORDER BY m.sentAt ASC")
    List<DirectMessage> findConversation(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT m FROM DirectMessage m WHERE ((m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1)) AND (LOWER(m.content) LIKE LOWER(:search) OR LOWER(m.attachmentName) LIKE LOWER(:search)) ORDER BY m.sentAt ASC")
    List<DirectMessage> searchConversation(@Param("user1") User user1, @Param("user2") User user2, @Param("search") String search);
    
    @Query("SELECT m FROM DirectMessage m WHERE m.receiver = :user AND m.isRead = false")
    List<DirectMessage> findUnreadMessagesForUser(@Param("user") User user);
    
    @Query("SELECT DISTINCT CASE WHEN m.sender = :user THEN m.receiver ELSE m.sender END FROM DirectMessage m WHERE m.sender = :user OR m.receiver = :user")
    List<User> findContactsForUser(@Param("user") User user);
}
