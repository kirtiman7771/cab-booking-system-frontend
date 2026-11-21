// confirmation-modal.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmationConfig {
  title: string;
  message: string;
  warning?: string;
  confirmText: string;
  cancelText: string;
  confirmButtonClass: string;
  headerClass: string;
  icon: string;
}

export interface ConfirmationResult {
  confirmed: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationModalService {
  private confirmationSubject = new Subject<ConfirmationResult>();
  private configSubject = new Subject<ConfirmationConfig | null>();

  config$ = this.configSubject.asObservable();
  
  private isModalOpen = false;

  confirm(config: ConfirmationConfig): Observable<ConfirmationResult> {
    // Prevent multiple modals from opening simultaneously
    if (this.isModalOpen) {
      return new Observable(observer => {
        observer.error({ confirmed: false, error: 'Modal already open' });
        observer.complete();
      });
    }

    this.isModalOpen = true;
    this.configSubject.next(config);
    
    return new Observable(observer => {
      const subscription = this.confirmationSubject.subscribe(result => {
        this.isModalOpen = false;
        observer.next(result);
        observer.complete();
        this.configSubject.next(null); // Close modal
      });
      
      return () => {
        subscription.unsubscribe();
        this.isModalOpen = false;
      };
    });
  }

  handleConfirm(data?: any): void {
    this.confirmationSubject.next({ confirmed: true, data });
  }

  handleCancel(): void {
    this.isModalOpen = false;
    this.confirmationSubject.next({ confirmed: false });
  }

  close(): void {
    this.isModalOpen = false;
    this.configSubject.next(null);
  }
}