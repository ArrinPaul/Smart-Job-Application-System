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
    
    @Query("SELECT m FROM DirectMessage m WHERE (m.sender.id = :u1 AND m.receiver.id = :u2) OR (m.sender.id = :u2 AND m.receiver.id = :u1) ORDER BY m.sentAt ASC")
    List<DirectMessage> findConversation(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT m FROM DirectMessage m WHERE ((m.sender.id = :u1 AND m.receiver.id = :u2) OR (m.sender.id = :u2 AND m.receiver.id = :u1)) AND (LOWER(m.content) LIKE LOWER(:search) OR LOWER(m.attachmentName) LIKE LOWER(:search)) ORDER BY m.sentAt ASC")
    List<DirectMessage> searchConversation(@Param("u1") Long u1, @Param("u2") Long u2, @Param("search") String search);
    
    @Query("SELECT m FROM DirectMessage m WHERE m.receiver.id = :userId AND m.isRead = false")
    List<DirectMessage> findUnreadMessagesForUser(@Param("userId") Long userId);
    
    @Query("SELECT DISTINCT m.sender FROM DirectMessage m WHERE m.receiver.id = :userId")
    List<User> findSendersForUser(@Param("userId") Long userId);

    @Query("SELECT DISTINCT m.receiver FROM DirectMessage m WHERE m.sender.id = :userId")
    List<User> findReceiversForUser(@Param("userId") Long userId);
}
