// confirmation-modal.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConfirmationConfig, ConfirmationModalService } from '../../services/confirmation-modal.service';

@Component({
  selector: 'app-confirmation-modal',
  template: `
    <div class="modal-backdrop" *ngIf="config" (click)="onBackdropClick()"></div>
    
    <div class="modal-container" *ngIf="config">
      <div class="modal-content">
        <div class="modal-header" [ngClass]="config.headerClass">
          <h5 class="modal-title">
            <i [class]="config.icon"></i>
            {{ config.title }}
          </h5>
          <button type="button" class="btn-close btn-close-white" (click)="onCancel()"></button>
        </div>
        
        <div class="modal-body">
          <p class="modal-text">{{ config.message }}</p>
          <p class="modal-warning" *ngIf="config.warning">
            <i class="fas fa-info-circle"></i>
            {{ config.warning }}
          </p>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">
            {{ config.cancelText }}
          </button>
          <button type="button" [class]="'btn ' + config.confirmButtonClass" (click)="onConfirm()">
            <i [class]="config.icon"></i>
            {{ config.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      animation: fadeIn 0.2s ease-in-out;
    }

    .modal-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      width: 90%;
      max-width: 500px;
      animation: slideIn 0.3s ease-out;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.5rem;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.8;
    }

    .btn-close:hover {
      opacity: 1;
    }

    .modal-body {
      padding: 2rem 1.5rem;
    }

    .modal-text {
      font-size: 1rem;
      color: #333;
      margin-bottom: 1rem;
    }

    .modal-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      font-size: 0.9rem;
      color: #856404;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      background-color: #f8f9fa;
    }

    .btn {
      padding: 0.5rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-outline-secondary {
      background: white;
      border: 1px solid #ddd;
      color: #666;
    }

    .btn-outline-secondary:hover {
      background: #f8f9fa;
    }

    .btn-danger-gradient {
      background: linear-gradient(135deg, #dc3545, #c82333);
      color: white;
    }

    .btn-success-gradient {
      background: linear-gradient(135deg, #28a745, #218838);
      color: white;
    }

    .btn-primary-gradient {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
    }

    .btn-info-gradient {
      background: linear-gradient(135deg, #17a2b8, #117a8b);
      color: white;
    }

    .danger-gradient {
      background: linear-gradient(135deg, #dc3545, #c82333);
    }

    .success-gradient {
      background: linear-gradient(135deg, #28a745, #218838);
    }

    .primary-gradient {
      background: linear-gradient(135deg, #007bff, #0056b3);
    }

    .info-gradient {
      background: linear-gradient(135deg, #17a2b8, #117a8b);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -60%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }
  `],
  standalone: false
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  config: ConfirmationConfig | null = null;
  private subscription?: Subscription;

  constructor(private modalService: ConfirmationModalService) {}

  ngOnInit(): void {
    this.subscription = this.modalService.config$.subscribe(config => {
      this.config = config;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onConfirm(): void {
    this.modalService.handleConfirm();
  }

  onCancel(): void {
    this.modalService.handleCancel();
  }

  onBackdropClick(): void {
    this.onCancel();
  }
}