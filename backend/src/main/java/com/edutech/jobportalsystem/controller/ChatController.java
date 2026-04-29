package com.edutech.jobportalsystem.controller;

import com.edutech.jobportalsystem.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> request, 
                                       @AuthenticationPrincipal UserDetails userDetails) {
        String message = request.get("message");
        String username = userDetails != null ? userDetails.getUsername() : "Guest";
        
        String response = chatService.getChatResponse(message, username);
        return ResponseEntity.ok(Map.of("response", response));
    }
}
