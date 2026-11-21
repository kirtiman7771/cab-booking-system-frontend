import { Component, effect, Inject, Input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RideBookingService } from '../../services/impl/ride-booking.service';
import { RideStatus } from '../../models/RideStatus';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';

@Component({
  selector: 'app-confirmed-ride-screen',
  standalone: false,
  templateUrl: './confirmed-ride-screen.component.html',
  styleUrl: './confirmed-ride-screen.component.css'
})
export class ConfirmedRideScreenComponent implements OnInit {
  @Input({ required: true }) rideId!: string;

  rideStatus = signal(RideStatus.LookingForDriver);
  showConfirmation: boolean = false;

  constructor(router: Router,
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService
  ) {
    effect(() => {
      let status = this.rideStatus();

      // If cancelled, hide confirmation immediately and exit the effect.
      if (status === RideStatus.CancelledByUser || status === RideStatus.CancelledByDriver) {
        this.showConfirmation = false;
        return;
      }

      if (status === RideStatus.ConfirmedByDriver) {
        this.showConfirmation = true;

        setTimeout(() => {
          // Check status again before hiding, in case it was cancelled during the 3s delay.
          let currentStatus = this.rideStatus();
          if (currentStatus !== RideStatus.CancelledByUser && currentStatus !== RideStatus.CancelledByDriver) {
            this.showConfirmation = false;
          }
        }, 3000);
      }
    })
  }
  ngOnInit(): void {
    this.rideBookingService.getRideStatus(this.rideId).subscribe({
      next: (status) => {
        this.rideStatus.set(status);
      }
    })
  }
  
}