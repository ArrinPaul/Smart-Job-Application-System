package com.edutech.jobportalsystem.controller;

import com.edutech.jobportalsystem.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> request, 
                                       @AuthenticationPrincipal UserDetails userDetails) {
        String message = request.get("message");
        String jobIdStr = request.get("jobId");
        Long jobId = (jobIdStr != null && !jobIdStr.isBlank()) ? Long.parseLong(jobIdStr) : null;
        
        String username = userDetails != null ? userDetails.getUsername() : "Guest";
        
        String response = chatService.getChatResponse(message, username, jobId);
        return ResponseEntity.ok(Map.of("response", response));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(List.of());
        }
        try {
            return ResponseEntity.ok(chatService.getChatHistory(userDetails.getUsername()));
        } catch (Exception e) {
            System.err.println("Error fetching chat history: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }
}
