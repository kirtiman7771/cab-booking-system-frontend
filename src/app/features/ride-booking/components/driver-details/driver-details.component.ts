import { Component, Input, OnInit, OnChanges, SimpleChanges, Inject } from '@angular/core';
import { RideRepository } from '../../services/interfaces/RideRepository';
import { RIDE_BOOKING_SERVICE_TOKEN, RIDE_REPOSITORY_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { DriverDetails } from '../../models/DriverDetails';


@Component({
  selector: 'app-driver-details',
  standalone: false,
  templateUrl: './driver-details.component.html',
  styleUrls: ['./driver-details.component.css']
})
export class DriverDetailsComponent implements OnInit, OnChanges {
  @Input() driverId!: string | number;
  driverDetails: DriverDetails | null = null; 
  loading = true;

  constructor(
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService
  ) {}

  ngOnInit(): void {
    if (this.driverId) {
      this.fetchDriverDetails(this.driverId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driverId'] && changes['driverId'].currentValue) {
      this.fetchDriverDetails(changes['driverId'].currentValue);
    }
  }

  fetchDriverDetails(id: string | number): void {
    this.loading = true;
    this.rideBookingService.getDriverDetailsById(id.toString()).subscribe({
      next: (driverDetails) => {
        if(driverDetails != null) {
          this.driverDetails = driverDetails;
        this.loading = false;

        }
      },
      error: (err) => {
        console.error('Error fetching driver details:', err);
        this.loading = false;
      }
    });
  }

}