import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatOpenSubject = new BehaviorSubject<boolean>(false);
  chatOpen$ = this.chatOpenSubject.asObservable();

  toggleChat(): void {
    this.chatOpenSubject.next(!this.chatOpenSubject.value);
  }

  openChat(): void {
    this.chatOpenSubject.next(true);
  }

  closeChat(): void {
    this.chatOpenSubject.next(false);
  }

  isChatOpen(): boolean {
    return this.chatOpenSubject.value;
  }
}
