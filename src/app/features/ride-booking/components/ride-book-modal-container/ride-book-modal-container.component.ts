import { Component, effect, EventEmitter, Inject, Output, signal, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RIDE_BOOKING_SERVICE_TOKEN, RIDE_REPOSITORY_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { MessageService } from '../../../../core/services/message.service';


@Component({
  selector: 'app-ride-book-modal-container',
  standalone: false,
  templateUrl: './ride-book-modal-container.component.html',
  styleUrl: './ride-book-modal-container.component.css'
})
export class RideBookModalContainerComponent implements OnInit, OnDestroy {

  @Output() close = new EventEmitter<void>();

  errorMessage = signal<string>('');
  headerMessage = signal<string>('Choose Your Ride')
  showConfirmScreen: boolean = false;
  showCarData: boolean = true;
  rideId: string = '';

  // private stateSubscription!: Subscription;
  private bookedRideSubscription!: Subscription;

  constructor(
    private snackBarService: MessageService,
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService
  ) {

    effect(() => {
      const error = this.errorMessage();
      if (error.length > 0) {
        snackBarService.sendMessage('error', error);
      }
    });
  }

  ngOnInit(): void {

    this.bookedRideSubscription = this.rideBookingService.bookedRide$.subscribe(ride => {
      if(ride) {
        this.rideId = ride.rideId;
        this.showConfirmScreenFn();
      }
    })
  }

  ngOnDestroy(): void {
    if(this.bookedRideSubscription) {
      this.bookedRideSubscription.unsubscribe();
    }
  }

  closeModal(): void {
    this.rideBookingService.resetBookingState();
    this.close.emit();
  }

  // Method to close the modal when clicking outside of the content
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  showPaymentMethodFn(): void {
    this.showCarData = false;
    this.showConfirmScreen = false;
    this.updateHeaderMessage();
  }

  showCarDataFn(): void {
    this.showConfirmScreen = false;
    this.showCarData = true;
    this.updateHeaderMessage();
  }

  showConfirmScreenFn(): void {
    this.showCarData = false;
    this.showConfirmScreen = true;
    this.updateHeaderMessage();
  }

  updateHeaderMessage(): void {
    if (this.showCarData) {
      this.headerMessage.set("Choose Your Ride");
    } else {
      this.headerMessage.set("Details");
    }
  }
}