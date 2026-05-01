package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.DirectMessage;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.DirectMessageRepository;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;

@Service
public class DirectMessageService {

    @Autowired
    private DirectMessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    private final Map<Long, TypingInfo> typingStatus = new ConcurrentHashMap<>();

    private static class TypingInfo {
        Long receiverId;
        Instant lastTyped;

        TypingInfo(Long receiverId, Instant lastTyped) {
            this.receiverId = receiverId;
            this.lastTyped = lastTyped;
        }
    }

    @Transactional
    public DirectMessage sendMessage(Long senderId, Long receiverId, String content, Long jobId, String attachmentUrl, String attachmentType, String attachmentName, byte[] attachmentData) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));
        
        Job job = null;
        if (jobId != null) {
            job = jobRepository.findById(jobId).orElse(null);
        }

        DirectMessage message = DirectMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .job(job)
                .attachmentUrl(attachmentUrl)
                .attachmentType(attachmentType)
                .attachmentName(attachmentName)
                .attachmentData(attachmentData)
                .isRead(false)
                .build();

        return messageRepository.save(message);
    }

    public List<DirectMessage> getConversation(Long user1Id, Long user2Id, String search) {
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<DirectMessage> conversation;
        if (search != null && !search.trim().isEmpty()) {
            conversation = messageRepository.searchConversation(user1, user2, "%" + search + "%");
        } else {
            conversation = messageRepository.findConversation(user1, user2);
        }
        
        // Mark as read if user1 is the receiver
        conversation.stream()
                .filter(m -> m.getReceiver().getId().equals(user1Id) && !m.getIsRead())
                .forEach(m -> {
                    m.setIsRead(true);
                    messageRepository.save(m);
                });
                
        return conversation;
    }

    public void setTyping(Long userId, Long receiverId) {
        typingStatus.put(userId, new TypingInfo(receiverId, Instant.now()));
    }

    public boolean isTyping(Long userId, Long senderId) {
        TypingInfo info = typingStatus.get(senderId);
        if (info != null && info.receiverId.equals(userId)) {
            // Typing status expires after 4 seconds
            if (Instant.now().isBefore(info.lastTyped.plusSeconds(4))) {
                return true;
            } else {
                typingStatus.remove(senderId);
            }
        }
        return false;
    }

    public List<User> getContacts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.findContactsForUser(user);
    }

    public List<DirectMessage> getUnreadMessages(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.findUnreadMessagesForUser(user);
    }
}
