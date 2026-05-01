import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../services/message.service';
import { DirectMessage } from '../models/message.model';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { HttpService } from '../services/http.service';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription, switchMap, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-layout">
      <!-- Contacts Sidebar -->
      <aside class="contacts-sidebar">
        <header class="sidebar-header">
          <h2>Conversations</h2>
          <div class="search-bar">
            <input type="text" [(ngModel)]="contactSearch" (input)="onContactSearch()" placeholder="Search people..." class="search-input">
          </div>
        </header>
        
        <div class="contacts-scrollbox">
          <!-- Existing Contacts -->
          <div *ngFor="let contact of filteredContacts()" 
               class="contact-card" 
               [class.selected]="selectedContact?.id === contact.id"
               (click)="selectContact(contact)">
            <div class="avatar-wrap">
              <div class="user-avatar">
                {{ contact.fullName?.charAt(0) || contact.username.charAt(0) }}
              </div>
              <div class="status-dot online"></div>
            </div>
            <div class="contact-details">
              <div class="contact-name-row">
                <span class="name">{{ contact.fullName || contact.username }}</span>
              </div>
              <span class="role-tag">{{ contact.role?.replace('_', ' ') || 'Member' }}</span>
            </div>
          </div>

          <!-- Global Search Results (New People) -->
          <div *ngIf="globalSearchResults.length > 0" class="global-results">
            <h3 class="section-title">New People</h3>
            <div *ngFor="let user of globalSearchResults" 
                 class="contact-card new-person" 
                 (click)="selectContact(user)">
              <div class="avatar-wrap">
                <div class="user-avatar mini-avatar">
                  {{ user.fullName?.charAt(0) || user.username.charAt(0) }}
                </div>
              </div>
              <div class="contact-details">
                <span class="name">{{ user.fullName || user.username }}</span>
                <span class="role-tag">{{ user.role?.replace('_', ' ') }}</span>
              </div>
            </div>
          </div>
          
          <div *ngIf="contacts.length === 0 && globalSearchResults.length === 0" class="empty-contacts">
            <div class="empty-icon">💬</div>
            <p>No conversations yet. Search for people to start chatting!</p>
          </div>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="chat-main">
        <ng-container *ngIf="selectedContact; else noChatSelected">
          <header class="chat-main-header">
            <div class="header-user">
              <div class="user-avatar mini">
                {{ selectedContact.fullName?.charAt(0) || selectedContact.username.charAt(0) }}
              </div>
              <div class="header-info">
                <h4>{{ selectedContact.fullName || selectedContact.username }}</h4>
                <p>{{ selectedContact.role?.replace('_', ' ') }}</p>
              </div>
            </div>
            <div class="header-search">
              <div class="search-wrapper">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search in chat..." class="inline-search">
              </div>
            </div>
          </header>

          <div class="messages-viewport" #scrollContainer>
            <div class="chat-day-divider">
              <span>Today</span>
            </div>

            <div *ngFor="let msg of messages" class="msg-row" 
                 [class.mine]="msg.sender.id === currentUserId">
              <div class="msg-bubble">
                <div class="msg-content">{{ msg.content }}</div>
                
                <!-- Attachment Display -->
                <div *ngIf="msg.attachmentUrl" class="msg-attachment">
                  <div class="attachment-info">
                    <span class="file-icon">📄</span>
                    <div class="file-meta">
                      <span class="file-name">{{ msg.attachmentName }}</span>
                      <span class="file-type">{{ msg.attachmentType }}</span>
                    </div>
                  </div>
                  <a [href]="getDownloadUrl(msg)" [download]="msg.attachmentName" class="download-link">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path>
                    </svg>
                  </a>
                </div>

                <div class="msg-meta">
                  <span class="msg-time">{{ msg.sentAt | date:'h:mm a' }}</span>
                  <span class="msg-status" *ngIf="msg.sender.id === currentUserId">
                    <svg *ngIf="msg.isRead" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="read-icon">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                    </svg>
                    <svg *ngIf="!msg.isRead" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="unread-icon">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"></path>
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div class="typing-row" *ngIf="isOtherTyping">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span class="typing-text">{{ selectedContact.fullName || selectedContact.username }} is typing...</span>
            </div>
          </div>

          <footer class="chat-footer">
            <div class="job-context-alert" *ngIf="selectedJobId">
              <span class="context-icon">💼</span>
              <span>Regarding Job ID: #{{ selectedJobId }}</span>
              <button class="clear-context" (click)="selectedJobId = null">✕</button>
            </div>
            
            <div class="input-area-wrap">
              <input type="file" #fileInput (change)="onFileSelected($event)" style="display: none">
              <button class="util-btn" (click)="triggerFileUpload()" [disabled]="isUploading">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>

              <div class="input-container">
                <textarea 
                  [(ngModel)]="newMessage" 
                  (keydown.enter)="$event.preventDefault(); sendMessage()" 
                  (input)="onTyping()"
                  placeholder="Write your message..." 
                  class="message-textarea"
                  rows="1"
                ></textarea>
                <button class="action-btn send" (click)="sendMessage()" [disabled]="!newMessage.trim() && !isUploading">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </footer>
        </ng-container>

        <ng-template #noChatSelected>
          <div class="empty-state">
            <div class="empty-illustration">
              <svg viewBox="0 0 24 24" width="120" height="120" fill="none" stroke="var(--border)" stroke-width="0.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3>Select a conversation</h3>
            <p>Pick a person from the left to start chatting about opportunities.</p>
          </div>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    :host {
      --sidebar-width: 340px;
      --chat-bg: #fffcf8;
      --bubble-mine: #bb3e2d;
      --bubble-theirs: #f0e6d7;
      --border-color: #e8dfd1;
    }

    .messages-layout {
      display: grid;
      grid-template-columns: var(--sidebar-width) 1fr;
      height: calc(100vh - 72px);
      background: white;
      overflow: hidden;
    }

    /* Sidebar */
    .contacts-sidebar {
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      background: #faf7f2;
    }

    .sidebar-header {
      padding: 24px;
      background: white;
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-header h2 {
      font-size: 1.25rem;
      margin: 0 0 16px;
      color: #1f1d18;
    }

    .search-input {
      width: 100%;
      padding: 10px 16px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: #fdfaf6;
      font-size: 0.9rem;
      outline: none;
    }

    .contacts-scrollbox {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .contact-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 4px;
    }

    .contact-card:hover {
      background: #f0e9dd;
    }

    .contact-card.selected {
      background: #bb3e2d;
      color: white;
    }

    .section-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #9c9181;
      letter-spacing: 1px;
      margin: 20px 12px 10px;
    }

    .mini-avatar {
      width: 36px !important;
      height: 36px !important;
      font-size: 0.9rem !important;
    }

    .avatar-wrap {
      position: relative;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #bb3e2d;
      color: white;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 1.2rem;
      box-shadow: 0 4px 10px rgba(187, 62, 45, 0.15);
    }

    .contact-card.selected .user-avatar {
      background: white;
      color: #bb3e2d;
    }

    .status-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 3px solid #faf7f2;
      background: #10b981;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .name {
      font-weight: 700;
      font-size: 0.95rem;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .role-tag {
      font-size: 0.75rem;
      opacity: 0.7;
      text-transform: capitalize;
    }

    /* Main Chat Area */
    .chat-main {
      display: flex;
      flex-direction: column;
      background: var(--chat-bg);
      position: relative;
    }

    .chat-main-header {
      padding: 16px 32px;
      background: white;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }

    .header-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-search {
      margin-left: auto;
      margin-right: 20px;
    }

    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f4efe6;
      padding: 6px 12px;
      border-radius: 100px;
      border: 1px solid var(--border-color);
    }

    .inline-search {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.85rem;
      width: 150px;
    }

    .user-avatar.mini {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }

    .header-info h4 {
      margin: 0;
      font-size: 1rem;
    }

    .header-info p {
      margin: 0;
      font-size: 0.8rem;
      color: #655f51;
      text-transform: capitalize;
    }

    .messages-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chat-day-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
      position: relative;
    }

    .chat-day-divider::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 1px;
      background: var(--border-color);
      z-index: 1;
    }

    .chat-day-divider span {
      background: var(--chat-bg);
      padding: 0 16px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #9c9181;
      z-index: 2;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .msg-row {
      display: flex;
      margin-bottom: 4px;
    }

    .msg-row.mine {
      justify-content: flex-end;
    }

    .msg-bubble {
      max-width: 65%;
      padding: 12px 16px;
      border-radius: 20px;
      font-size: 0.95rem;
      position: relative;
      box-shadow: 0 2px 8px rgba(31, 29, 24, 0.04);
    }

    .mine .msg-bubble {
      background: var(--bubble-mine);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .msg-row:not(.mine) .msg-bubble {
      background: var(--bubble-theirs);
      color: #1f1d18;
      border-bottom-left-radius: 4px;
    }

    .msg-attachment {
      margin-top: 10px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .msg-row:not(.mine) .msg-attachment {
      background: white;
    }

    .attachment-info {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }

    .file-icon { font-size: 1.5rem; }
    .file-meta { display: flex; flex-direction: column; overflow: hidden; }
    .file-name { font-weight: 700; font-size: 0.85rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
    .file-type { font-size: 0.7rem; opacity: 0.7; }

    .download-link {
      color: inherit;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .download-link:hover { opacity: 1; }

    .msg-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      margin-top: 4px;
      font-size: 0.7rem;
      opacity: 0.7;
    }

    .read-icon { color: #10b981; }
    .unread-icon { opacity: 0.5; }

    /* Typing Indicator */
    .typing-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      margin-top: 4px;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      background: #e8e1d5;
      padding: 10px 14px;
      border-radius: 20px;
      border-bottom-left-radius: 4px;
    }

    .typing-indicator span {
      width: 6px;
      height: 6px;
      background: #8e8474;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(1) { animation-delay: 0s; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .typing-text {
      font-size: 0.8rem;
      color: #9c9181;
      font-style: italic;
    }

    .chat-footer {
      padding: 24px 32px;
      background: white;
      border-top: 1px solid var(--border-color);
    }

    .job-context-alert {
      background: #fcf6e8;
      border: 1px solid #f0e0c0;
      padding: 8px 16px;
      border-radius: 10px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      color: #856404;
    }

    .clear-context {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.5;
    }

    .input-area-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .util-btn {
      background: none;
      border: none;
      color: #655f51;
      cursor: pointer;
      padding: 10px;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .util-btn:hover {
      background: #f4efe6;
      color: #bb3e2d;
    }

    .input-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16px;
      background: #fdfaf6;
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 8px 8px 8px 20px;
    }

    .message-textarea {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      resize: none;
      font-family: inherit;
      padding: 10px 0;
      max-height: 120px;
    }

    .action-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn.send {
      background: #bb3e2d;
      color: white;
    }

    .action-btn.send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
      color: #9c9181;
    }

    .empty-illustration {
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .empty-state h3 {
      color: #1f1d18;
      margin: 0 0 8px;
    }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  contacts: User[] = [];
  selectedContact: User | null = null;
  messages: DirectMessage[] = [];
  newMessage: string = '';
  searchQuery: string = '';
  contactSearch: string = '';
  globalSearchResults: User[] = [];
  currentUserId: number | null;

  private pollSubscription?: Subscription;
  private typingSub?: Subscription;
  isOtherTyping: boolean = false;
  selectedJobId: number | null = null;
  isUploading: boolean = false;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private httpService: HttpService,
    private route: ActivatedRoute
  ) {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadContacts();
    
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        const userId = +params['userId'];
        this.selectedJobId = params['jobId'] ? +params['jobId'] : null;
        this.selectContactById(userId);
      }
    });

    this.pollSubscription = interval(2000).pipe(
      switchMap(() => {
        if (this.selectedContact && document.visibilityState === 'visible') {
          if (this.searchQuery.trim()) return of(null);
          return this.messageService.getConversation(this.selectedContact.id);
        }
        return of(null);
      })
    ).subscribe(msgs => {
      if (msgs && (msgs.length > this.messages.length || this.anyUnread(msgs))) {
        this.messages = msgs;
        this.scrollToBottom();
      }
    });

    this.typingSub = interval(3000).pipe(
      switchMap(() => {
        if (this.selectedContact && document.visibilityState === 'visible') {
          return this.messageService.isTyping(this.selectedContact.id);
        }
        return of({ isTyping: false });
      })
    ).subscribe(status => {
      this.isOtherTyping = status.isTyping;
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
    this.typingSub?.unsubscribe();
  }

  private anyUnread(msgs: DirectMessage[]): boolean {
    return msgs.some(m => m.receiver.id === this.currentUserId && !m.isRead);
  }

  filteredContacts(): User[] {
    if (!this.contactSearch.trim()) return this.contacts;
    const query = this.contactSearch.toLowerCase();
    return this.contacts.filter(c => 
      (c.fullName && c.fullName.toLowerCase().includes(query)) || 
      c.username.toLowerCase().includes(query) ||
      (c.role && c.role.toLowerCase().includes(query))
    );
  }

  onContactSearch(): void {
    if (this.contactSearch.trim().length >= 2) {
      this.messageService.searchUsers(this.contactSearch).subscribe(users => {
        this.globalSearchResults = users.filter(u => 
          u.id !== this.currentUserId && 
          !this.contacts.some(c => c.id === u.id)
        );
      });
    } else {
      this.globalSearchResults = [];
    }
  }

  onSearch(): void {
    this.loadMessages();
  }

  onTyping(): void {
    if (this.selectedContact) {
      this.messageService.setTyping(this.selectedContact.id).subscribe();
    }
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      this.sendMessage(undefined, file.type, file.name, base64Data);
      this.isUploading = false;
      this.fileInput.nativeElement.value = '';
    };
    reader.readAsDataURL(file);
  }

  loadContacts(): void {
    this.messageService.getContacts().subscribe(contacts => {
      this.contacts = contacts;
      if (this.selectedContact && !this.contacts.some(c => c.id === this.selectedContact?.id)) {
        this.contacts.unshift(this.selectedContact);
      }
    });
  }

  selectContact(contact: User): void {
    this.selectedContact = contact;
    this.searchQuery = '';
    this.contactSearch = '';
    this.globalSearchResults = [];
    this.loadMessages();
    if (!this.contacts.some(c => c.id === contact.id)) {
      this.contacts.unshift(contact);
    }
  }

  private selectContactById(userId: number): void {
    this.httpService.getUserById(userId).subscribe(user => {
      this.selectContact(user);
    });
  }

  loadMessages(): void {
    if (!this.selectedContact) return;
    this.messageService.getConversation(this.selectedContact.id, this.searchQuery).subscribe(messages => {
      this.messages = messages;
      this.scrollToBottom();
    });
  }

  getDownloadUrl(msg: DirectMessage): string {
    if (msg.attachmentUrl && msg.attachmentUrl.startsWith('/api')) {
      return `${environment.apiUrl.replace('/api', '')}${msg.attachmentUrl}`;
    }
    return msg.attachmentUrl || '#';
  }

  sendMessage(attachmentUrl?: string, attachmentType?: string, attachmentName?: string, attachmentData?: string): void {
    if (!this.selectedContact) return;
    if (!this.newMessage.trim() && !attachmentData) return;
    
    const content = this.newMessage || (attachmentName ? `Sent an attachment: ${attachmentName}` : '');
    this.newMessage = '';
    
    this.messageService.sendMessage(
      this.selectedContact.id, 
      content, 
      this.selectedJobId || undefined,
      attachmentUrl,
      attachmentType,
      attachmentName,
      attachmentData
    ).subscribe(msg => {
      this.messages.push(msg);
      this.scrollToBottom();
      this.selectedJobId = null; 
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
