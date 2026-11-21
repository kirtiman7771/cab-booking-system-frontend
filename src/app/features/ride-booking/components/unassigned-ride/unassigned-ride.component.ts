import { Component, Inject, OnInit } from '@angular/core';
import { Ride } from '../../models/Ride';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RIDE_BOOKING_SERVICE_TOKEN, RIDE_REPOSITORY_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { AuthService } from '../../../auth/services/auth.service';
import { MessageService } from '../../../../core/services/message.service';



@Component({
  selector: 'app-unassigned-rides',
  standalone: false,
  templateUrl: './unassigned-ride.component.html',
  styleUrl: './unassigned-ride.component.css'
})
export class UnassignedRidesComponent implements OnInit{
  totalRides: Ride[] = [];
  userType: string | null = 'driver';

  constructor(
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService, 
    private authService: AuthService, 
    private snackBarService: MessageService
  ) {
  }

  ngOnInit(): void {
    this.getTotalRides()
  }

  getTotalRides() {
    this.userType = localStorage.getItem('userType');
    if (this.userType && this.userType == 'driver') {
      this.rideBookingService.getUnassignedRides().subscribe(rides => {
        // console.log("Got rides: " + rides);
        rides.forEach(value => console.log(value) )
        this.totalRides = rides;
      })
    }
  }

}
