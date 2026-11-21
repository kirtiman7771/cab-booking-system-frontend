import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

export interface ApiMessage {
  type: 'success' | 'error';
  text: string;
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messageSubject = new BehaviorSubject<ApiMessage | null>(null);

  sendMessage(type: 'success' | 'error', text: string): void {
    const message: ApiMessage = {
      type,
      text,
      isVisible: true
    };
    this.messageSubject.next(message);
  }
   
  getMessage(): Observable<ApiMessage> {
    return this.messageSubject.asObservable();
  }

  clearMessage(): void {
    this.messageSubject.next(null);
  }

  dismissMessage(): void {
    const currentMessage = this.messageSubject.value;
  }  if (currentMessage) {
      this.messageSubject.next({
      ...currentMessage,
      isVisible: false
      });

    }
}