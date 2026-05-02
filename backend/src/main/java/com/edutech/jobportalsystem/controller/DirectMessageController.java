package com.edutech.jobportalsystem.controller;

import com.edutech.jobportalsystem.entity.DirectMessage;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.UserRepository;
import com.edutech.jobportalsystem.service.DirectMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import java.util.Base64;

@RestController
@RequestMapping("/messages")
public class DirectMessageController {

    @Autowired
    private DirectMessageService messageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.edutech.jobportalsystem.repository.DirectMessageRepository messageRepository;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> request,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        User sender = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Long receiverId = Long.parseLong(request.get("receiverId").toString());
        String content = request.get("content").toString();
        
        Object jobIdObj = request.get("jobId");
        Long jobId = jobIdObj != null ? Long.parseLong(jobIdObj.toString()) : null;

        String attachmentUrl = request.get("attachmentUrl") != null ? request.get("attachmentUrl").toString() : null;
        String attachmentType = request.get("attachmentType") != null ? request.get("attachmentType").toString() : null;
        String attachmentName = request.get("attachmentName") != null ? request.get("attachmentName").toString() : null;
        
        byte[] attachmentData = null;
        if (request.get("attachmentData") != null) {
            String base64Data = request.get("attachmentData").toString();
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }
            attachmentData = Base64.getDecoder().decode(base64Data);
        }

        DirectMessage message = messageService.sendMessage(sender.getId(), receiverId, content, jobId, attachmentUrl, attachmentType, attachmentName, attachmentData);
        
        // If we have data but no URL, set a relative URL for downloading
        if (attachmentData != null && (attachmentUrl == null || attachmentUrl.startsWith("data:"))) {
            message.setAttachmentUrl("/api/messages/attachment/" + message.getId());
            message = messageRepository.save(message);
        }
        
        return ResponseEntity.ok(message);
    }

    @GetMapping("/attachment/{messageId}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long messageId,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        DirectMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Security check: only sender or receiver can download
        if (!message.getSender().getId().equals(currentUser.getId()) && 
            !message.getReceiver().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }

        if (message.getAttachmentData() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(message.getAttachmentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + message.getAttachmentName() + "\"")
                .body(message.getAttachmentData());
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<?> getConversation(@PathVariable Long otherUserId,
                                           @RequestParam(required = false) String search,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(messageService.getConversation(currentUser.getId(), otherUserId, search));
    }

    @PostMapping("/typing")
    public ResponseEntity<?> setTyping(@RequestBody Map<String, Object> request,
                                     @AuthenticationPrincipal UserDetails userDetails) {
        User sender = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long receiverId = Long.parseLong(request.get("receiverId").toString());
        messageService.setTyping(sender.getId(), receiverId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/typing/{senderId}")
    public ResponseEntity<?> isTyping(@PathVariable Long senderId,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(java.util.Map.of("isTyping", messageService.isTyping(currentUser.getId(), senderId)));
    }

    @GetMapping("/contacts")
    public ResponseEntity<?> getContacts(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(messageService.getContacts(currentUser.getId()));
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnread(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(List.of());
        }
        try {
            User currentUser = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found: " + userDetails.getUsername()));
            
            return ResponseEntity.ok(messageService.getUnreadMessages(currentUser.getId()));
        } catch (Exception e) {
            // Log the error and return empty instead of 500 to keep the UI clean while debugging
            System.err.println("Error fetching unread messages: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/search-users")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(userRepository.searchUsers("%" + query.trim() + "%"));
    }
}
