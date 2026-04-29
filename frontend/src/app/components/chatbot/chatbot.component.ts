import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../../services/http.service';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  isOpen = false;
  userInput = '';
  messages: Message[] = [
    { text: 'Hello! I am your AI Career Assistant. How can I help you today?', sender: 'bot', timestamp: new Date() }
  ];
  isLoading = false;

  suggestions = [
    'Recommend some jobs for me',
    'How can I improve my resume?',
    'What are the latest remote jobs?',
    'Show me high paying jobs'
  ];

  constructor(private httpService: HttpService) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage(text?: string) {
    const messageText = text || this.userInput.trim();
    if (!messageText) return;

    // Add user message
    this.messages.push({
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    });

    if (!text) this.userInput = '';
    this.isLoading = true;

    // Send to backend
    this.httpService.sendMessage(messageText).subscribe({
      next: (res) => {
        this.messages.push({
          text: res.response,
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Chat error:', err);
        this.messages.push({
          text: 'Sorry, I am having trouble connecting right now. Please try again later.',
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }
}
