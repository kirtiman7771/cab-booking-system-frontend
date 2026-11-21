import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiMessage, MessageService } from '../../core/services/message.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent implements OnInit, OnDestroy {


  currentMessage: ApiMessage | null = null;
  private messageSubscription: Subscription = new Subscription();


  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
    this.messageSubscription = this.messageService.getMessage().subscribe(message => {
      this.currentMessage = message;

      if (message) {
        setTimeout(() => {
          this.hideMessage();
        }, 10000); 
      }
    });
  }

  hideMessage(): void {
    this.messageService.dismissMessage();
    this.currentMessage.isVisible = false;
  }

  ngOnDestroy(): void {
    this.messageSubscription.unsubscribe();
   
    
  }
}
