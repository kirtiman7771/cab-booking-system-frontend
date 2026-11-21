// ride-details.component.ts
import { Component, Input, OnInit, OnDestroy, signal, effect, Inject, inject } from '@angular/core';
import { Router, UrlSerializer } from '@angular/router';
import { Subscription } from 'rxjs';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { RideRepository } from '../../services/interfaces/RideRepository';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RideBookingService } from '../../services/impl/ride-booking.service';
import { InternetUtils } from '../../../../core/utils/InternetUtils';
import { RIDE_BOOKING_SERVICE_TOKEN, RIDE_REPOSITORY_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { AuthService } from '../../../auth/services/auth.service';
import { MessageService } from '../../../../core/services/message.service';
import { ConfirmationModalService } from '../../../../shared/services/confirmation-modal.service';
import { MatDialog } from '@angular/material/dialog';
import { RatingSubmissionComponent } from '../../../rating-and-feedback/components/rating-submission/rating-submission.component';

@Component({
  selector: 'app-ride-details',
  standalone: false,
  templateUrl: './ride-details.component.html',
  styleUrls: ['./ride-details.component.css']
})
export class RideDetailsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) rideId!: string;
  ride: Ride | null = null;
  driverId: string | null | undefined = null;
  driverDetailsLoading: boolean = false;
  userType: string | null = 'rider';
  userId: string | string | null = null;
  rideStatus = RideStatus;
  private rideUpdateSubscription: Subscription | null = null;
  isCancelling = false;
  isMarkingCompleted = false;
  isAcceptingRide = false;
  isStartingRide = false;

  // Separate signals for success and error messages
  private successMessage = signal<string | null>(null);
  private errorMessage = signal<string | null>(null);

  constructor(
    private snackbarService: MessageService,
    private authService: AuthService,
    private confirmationModal: ConfirmationModalService,
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService,
    private matDialog: MatDialog
  ) {
    this.userId = this.authService.getUserId();

    // Separate side-effects (effects) for success and error
    effect(() => {
      const msg = this.successMessage();
      if (msg) {
        this.snackbarService.sendMessage('success', msg);
        this.successMessage.set(null); // clear after showing
      }
    });

    effect(() => {
      const msg = this.errorMessage();
      if (msg) {
        this.snackbarService.sendMessage('error', msg);
        this.errorMessage.set(null); // clear after showing
      }
    });
  }

  ngOnInit(): void {
    this.fetchRideDetails(this.rideId);
    this.userType = localStorage.getItem('userType');
  }

  fetchRideDetails(rideId: string): void {
    this.rideUpdateSubscription = this.rideBookingService.getRideById(rideId)
      .subscribe((ride) => {
        if (ride) {
          this.ride = ride as Ride;
          let rideStatus = (ride as Ride).status;
          const isFinished = [
            RideStatus.Completed,
            RideStatus.CancelledByUser,
          ].includes(rideStatus);
          if (!isFinished) {
            this.driverId = this.ride.driverId;
            this.driverDetailsLoading = !this.driverId;
          } else {
            this.driverId = null;
            this.driverDetailsLoading = false;
            this.ngOnDestroy();
          }
        } else {
          this.ride = null;
          this.errorMessage.set('Ride details not found or an error occurred.');
          this.ngOnDestroy();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.rideUpdateSubscription) {
      this.rideUpdateSubscription.unsubscribe();
    }
  }

  private isAbleToConfirm(): boolean {
    const userId = this.authService.getUserId();
    if (!InternetUtils.IsOnline()) {
      this.errorMessage.set("Please connect to the Internet");
      return false;
    } else if (!userId) {
      this.errorMessage.set("You are logged out");
      return false;
    }
    return true;
  }

  // Updated method using modal service
  showCancelConfirmation(): void {
    if (!this.isAbleToConfirm() || !this.ride) return;
    this.confirmationModal.confirm({
      title: 'Confirm Cancellation',
      message: 'Are you sure you want to cancel this ride?',
      warning: 'Cancellation fees may apply depending on ride status.',
      confirmText: 'Cancel Ride',
      cancelText: 'Keep Ride',
      confirmButtonClass: 'btn-danger-gradient',
      headerClass: 'danger-gradient',
      icon: 'fas fa-exclamation-triangle'
    }).subscribe(result => {
      if (result.confirmed) {
        this.cancelRide();
      }
    });
  }

  cancelRide(): void {
    if (!this.ride) return;

    this.isCancelling = true;
    const cancelObservable = this.userType === 'driver'
      ? this.rideBookingService.cancelRideByDriver(this.ride.rideId)
      : this.rideBookingService.cancelRideByUser(this.ride.rideId);
    cancelObservable.subscribe({
      next: () => {
        if (this.ride) {
          this.ride.status = this.userType === 'driver'
            ? RideStatus.CancelledByDriver
            : RideStatus.CancelledByUser;
        }
        this.isCancelling = false;
        this.driverDetailsLoading = false;
        this.successMessage.set('Ride cancelled successfully!');
        if (this.userType !== 'driver') {
          this.ngOnDestroy();
        }
      },
      error: (err) => {
        console.error('Failed to cancel ride:', err);
        this.errorMessage.set('Failed to cancel ride. Please try again.');
        this.isCancelling = false;
      }
    });
  }

  showMarkCompletedConfirmation(): void {
    if (!this.isAbleToConfirm() || !this.ride) return;
    this.confirmationModal.confirm({
      title: 'Confirm Completion',
      message: 'Has the passenger reached the drop-off location safely?',
      warning: 'This will finalize the ride and calculate the final fare.',
      confirmText: 'Mark Complete',
      cancelText: 'Go Back',
      confirmButtonClass: 'btn-success-gradient',
      headerClass: 'success-gradient',
      icon: 'fas fa-check-circle'
    }).subscribe(result => {
      if (result.confirmed) {
        this.markAsCompleted();
      }
    });
  }

  markAsCompleted(): void {
    if (!this.ride) return;
    this.isMarkingCompleted = true;
    this.rideBookingService.markAsCompleted(this.ride.rideId).subscribe({
      next: () => {
        if (this.ride) this.ride.status = RideStatus.Completed;
        this.isMarkingCompleted = false;
        this.successMessage.set('Ride marked as completed!');
      },
      error: (err) => {
        console.error('Failed to mark ride as completed:', err);
        this.errorMessage.set('Failed to mark ride as completed. Please try again.');
        this.isMarkingCompleted = false;
      }
    });
  }

  showAcceptConfirmation(): void {
    if (!this.isAbleToConfirm() || this.userType !== 'driver' || !this.ride) return;
    this.confirmationModal.confirm({
      title: 'Accept Ride',
      message: 'Confirm you\'re available to take this ride.',
      warning: 'The rider will be notified immediately.',
      confirmText: 'Accept',
      cancelText: 'Decline',
      confirmButtonClass: 'btn-primary-gradient',
      headerClass: 'primary-gradient',
      icon: 'fas fa-handshake'
    }).subscribe(result => {
      if (result.confirmed) {
        this.acceptRide();
      }
    });
  }

  acceptRide(): void {
    if (!this.ride) return;
    const driverId = this.authService.getUserId();
    this.isAcceptingRide = true;
    this.rideBookingService.assignDriver(this.ride.rideId, driverId.toString()).subscribe({
      next: () => {
        if (this.ride) {
          this.ride.status = RideStatus.ConfirmedByDriver;
          this.ride.driverId = driverId!;
        }
        this.isAcceptingRide = false;
        this.successMessage.set('Ride accepted successfully!');
      },
      error: (err) => {
        console.error('Failed to accept ride: ', err);
        this.errorMessage.set(`Failed to accept to ride: ${err.error.error}`);
        this.isAcceptingRide = false;
      }
    });
  }

  showStartConfirmation(): void {
    if (!this.isAbleToConfirm() || this.userType !== 'driver' || !this.ride) return;
    this.confirmationModal.confirm({
      title: 'Start Ride',
      message: 'Is the passenger in the vehicle and ready to go?',
      warning: 'This will begin tracking the ride journey.',
      confirmText: 'Start',
      cancelText: 'Not Ready',
      confirmButtonClass: 'btn-info-gradient',
      headerClass: 'info-gradient',
      icon: 'fas fa-play-circle'
    }).subscribe(result => {
      if (result.confirmed) {
        this.startRide();
      }
    });
  }

  startRide(): void {
    if (!this.ride) return;
    this.isStartingRide = true;
    this.rideBookingService.startRide(this.ride.rideId).subscribe({
      next: () => {
        if (this.ride) {
          this.ride.status = RideStatus.Ongoing;
        }
        this.isStartingRide = false;
        this.successMessage.set('Ride started successfully!');
      },
      error: (err) => {
        console.error('Failed to start ride:', err);
        this.errorMessage.set(`Failed to start ride, ${err.error.error}`);
        this.isStartingRide = false;
      }
    });
  }

  goToPayment(): void {
    if (!this.isAbleToConfirm() || !this.ride) return;
    const routePath = `driver/payment-page/${this.rideId}`;
    window.open(routePath, '_blank');
  }

  openReviewModal() {
    this.matDialog.open(RatingSubmissionComponent, {
      data: {...this.ride, rating: null},
      width: '500px'
    });
  }

  determineStatusText(status: RideStatus): string {
    switch (status) {
      case RideStatus.LookingForDriver:
        return 'Looking for Driver';
      case RideStatus.Ongoing:
        return 'Ride in Progress';
      case RideStatus.Completed:
        return 'Completed';
      case RideStatus.CancelledByUser:
        return this.userType == 'rider' ? 'Cancelled by You' : 'Cancelled by User';
      case RideStatus.CancelledByDriver:
        return 'Cancelled by Driver';
      case RideStatus.ConfirmedByDriver:
        if (this.userType == 'driver') {
          return this.ride.driverId == this.userId ? 'Confirmed by You' : 'Confirmed by Other';
        }
        return 'Confirmed by Driver';
      default:
        return 'Unknown Status';
    }
  }
}