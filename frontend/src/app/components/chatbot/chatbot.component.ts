import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Message {
  text: string;
  html?: SafeHtml;
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
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  messages: Message[] = [];
  isLoading = false;
  isLoggedIn = false;

  suggestions = [
    'Recommend some jobs for me',
    'How can I improve my resume?',
    'What are the latest remote jobs?',
    'Show me high paying jobs'
  ];

  constructor(
    private httpService: HttpService, 
    private authService: AuthService,
    private chatService: ChatService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (this.isLoggedIn) {
        this.loadHistory();
      } else {
        this.resetChat();
      }
    });

    this.chatService.chatOpen$.subscribe(isOpen => {
      this.isOpen = isOpen;
      if (isOpen) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadHistory() {
    this.httpService.getChatHistory().subscribe({
      next: (history) => {
        if (history && history.length > 0) {
          this.messages = [];
          history.forEach(msg => {
            this.messages.push({
              text: msg.message,
              sender: 'user',
              timestamp: new Date(msg.createdAt)
            });
            this.messages.push({
              text: msg.response,
              html: this.renderMarkdown(msg.response),
              sender: 'bot',
              timestamp: new Date(msg.createdAt)
            });
          });
        } else {
          this.resetChat();
        }
      },
      error: () => this.resetChat()
    });
  }

  resetChat() {
    this.messages = [
      { 
        text: 'Hello! I am your AI Career Assistant. How can I help you today?', 
        html: this.renderMarkdown('Hello! I am your AI Career Assistant. How can I help you today?'),
        sender: 'bot', 
        timestamp: new Date() 
      }
    ];
  }

  renderMarkdown(text: string): SafeHtml {
    const rawHtml = marked.parse(text) as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  toggleChat() {
    this.chatService.toggleChat();
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
          html: this.renderMarkdown(res.response),
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Chat error:', err);
        const errorMsg = 'Sorry, I am having trouble connecting right now. Please try again later.';
        this.messages.push({
          text: errorMsg,
          html: this.renderMarkdown(errorMsg),
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }
}
