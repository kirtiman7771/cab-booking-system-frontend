import { Component, Inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RideBookingService } from '../../services/impl/ride-booking.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { InternetUtils } from '../../../../core/utils/InternetUtils';
import { RideFormData } from '../../models/RideFormData';
import { Location } from '../../models/Locations';
import { RideFormStateService } from '../../services/ride-form-state.service';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { AuthService } from '../../../auth/services/auth.service';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-ride-booking-home',
  standalone: false,
  templateUrl: './ride-booking-home.component.html',
  styleUrls: ['./ride-booking-home.component.css']
})
export class RideBookingHomeComponent implements OnInit {
  isOnline: boolean = true;
  isLocationsSame: boolean = false;
  isFieldsEmpty: boolean = false;
  bookingMessage: string = '';
  isLoading: boolean = false;
  showCarModal = false;
  locationData: Location = new Location();
  isLoggedIn: Boolean = false;

  constructor(
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService,
    private snackBarService: MessageService,
    private rideFormStateService: RideFormStateService,
    private authService: AuthService
  ) { 
    authService.isLoggedIn$.subscribe(value => this.isLoggedIn = value)
  }

  ngOnInit(): void {
    
  }

  async onBookRideClick(): Promise<void> {
  this.isLoading = true;

  try {
    this.isFieldsEmpty = this.locationData.isAnyFieldEmpty();
    this.isLocationsSame = this.locationData.isStartAndDestinationSame();
    this.isOnline = InternetUtils.IsOnline();

    if (this.isFieldsEmpty) {
      this.snackBarService.sendMessage('error', "Fields cannot be empty");
      return;
    }

    if (this.isLocationsSame) {
      this.snackBarService.sendMessage('error', "Start and destination cannot be the same");
      return;
    }

    if (!this.isOnline) {
      this.snackBarService.sendMessage('error', "You are offline. Please check your internet connection.");
      return;
    }

    if (!this.isLoggedIn) {
      this.bookingMessage = 'User not logged in. Please log in to book a ride.';
      this.snackBarService.sendMessage('error', this.bookingMessage);
      return;
    }

    const hasTwoRides = await firstValueFrom(this.rideBookingService.checkIfTwoRidesActive());

    if (hasTwoRides) {
      this.snackBarService.sendMessage('error', "You cannot book more than two rides at a time.");
      this.bookingMessage = "You have an active ride already. Please complete it first.";
      return;
    }

    this.rideFormStateService.setLocation(this.locationData);


    this.openCarModal();

  } catch (err) {
    this.snackBarService.sendMessage('error', "An error occurred. Please try again later.");
    console.error('Error checking active rides:', err);
  } finally {
    // ✅ Ensure loading is turned off no matter what
    this.isLoading = false;
  }
}

  openCarModal(): void {
    this.showCarModal = true;
  }

  closeCarModal(): void {
    this.showCarModal = false;
    this.rideBookingService.resetBookingState();
  }
}