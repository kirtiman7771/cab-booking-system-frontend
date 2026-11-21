import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { Ride } from '../../models/Ride';
import { RIDE_BOOKING_SERVICE_TOKEN, RIDE_REPOSITORY_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { AuthService } from '../../../auth/services/auth.service';


@Component({
  selector: 'app-upcoming-ride',
  standalone: false,
  templateUrl: './upcoming-ride.component.html',
  styleUrl: './upcoming-ride.component.css'
})
export class UpcomingRideComponent implements OnInit, OnDestroy {
  upcomingRides: Ride[] = [];
  loading = true;
  private rideUpdate$ = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.fetchUpcomingRides();

    this.subscriptions.add(
      this.rideUpdate$.subscribe(() => this.fetchUpcomingRides())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  fetchUpcomingRides(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.rideBookingService.getUpcomingRidesForUser(userId.toString()).subscribe({
      next: (rides) => {
        this.upcomingRides = rides;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch upcoming rides:', err);
        this.loading = false;
      }
    });
  }
}