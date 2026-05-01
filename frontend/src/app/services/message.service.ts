import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DirectMessage } from '../models/message.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  sendMessage(receiverId: number, content: string, jobId?: number, attachmentUrl?: string, attachmentType?: string, attachmentName?: string, attachmentData?: string): Observable<DirectMessage> {
    return this.http.post<DirectMessage>(`${this.apiUrl}/send`, { 
      receiverId, content, jobId, attachmentUrl, attachmentType, attachmentName, attachmentData 
    });
  }

  getAttachmentUrl(messageId: number): string {
    return `${this.apiUrl}/attachment/${messageId}`;
  }

  getConversation(otherUserId: number, search?: string): Observable<DirectMessage[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<DirectMessage[]>(`${this.apiUrl}/conversation/${otherUserId}`, { params });
  }

  setTyping(receiverId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/typing`, { receiverId });
  }

  isTyping(senderId: number): Observable<{ isTyping: boolean }> {
    return this.http.get<{ isTyping: boolean }>(`${this.apiUrl}/typing/${senderId}`);
  }

  getContacts(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/contacts`);
  }

  getUnreadMessages(): Observable<DirectMessage[]> {
    return this.http.get<DirectMessage[]>(`${this.apiUrl}/unread`);
  }

  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search-users`, { params: { query } });
  }
}
