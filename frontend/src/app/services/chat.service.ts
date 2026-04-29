import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatOpenSubject = new BehaviorSubject<boolean>(false);
  chatOpen$ = this.chatOpenSubject.asObservable();

  private jobContextSubject = new BehaviorSubject<any>(null);
  jobContext$ = this.jobContextSubject.asObservable();

  toggleChat(): void {
    this.chatOpenSubject.next(!this.chatOpenSubject.value);
  }

  openChat(): void {
    this.chatOpenSubject.next(true);
  }

  closeChat(): void {
    this.chatOpenSubject.next(false);
    this.jobContextSubject.next(null); // Clear context when closed
  }

  setJobContext(job: any): void {
    this.jobContextSubject.next(job);
    this.openChat();
  }

  getJobContext(): any {
    return this.jobContextSubject.value;
  }

  isChatOpen(): boolean {
    return this.chatOpenSubject.value;
  }
}
