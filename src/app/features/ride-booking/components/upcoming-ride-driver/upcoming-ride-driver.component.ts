import { Component, Inject, OnInit } from '@angular/core';
import { RideRepository } from '../../services/interfaces/RideRepository';
import { RideBookingService } from '../../services/impl/ride-booking.service';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { AuthService } from '../../../auth/services/auth.service';
import { Ride } from '../../models/Ride';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';


@Component({
  selector: 'app-upcoming-ride-driver',
  standalone: false,
  templateUrl: './upcoming-ride-driver.component.html',
  styleUrl: './upcoming-ride-driver.component.css'
})
export class UpcomingRideDriverComponent implements OnInit {

  totalRides: Ride[] = [];
  constructor(
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService,
    private authService: AuthService
  ) { }


  ngOnInit(): void {
    this.fetchUpcomingRides();
  }

  getUserId(): string | number | null {
    return this.authService.getUserId();
  }

  fetchUpcomingRides() {
    const userId = this.getUserId();
    if (userId) {
      this.rideBookingService.getUpcomingRidesForDriver(userId.toString()).subscribe(rides => this.totalRides = rides);
    }
  }
}