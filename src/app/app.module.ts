import { inject, InjectionToken, NgModule, Provider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, provideHttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogActions, MatDialogContent } from "@angular/material/dialog";
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { environment } from '../environment/environment';
import { RideRepository } from './features/ride-booking/services/interfaces/RideRepository';
import { MockRideApiService } from './features/ride-booking/services/impl/mock-ride-api.service';
import { RideApiService } from './features/ride-booking/services/impl/ride-api.service';
import { CarSelectionComponent } from './features/ride-booking/components/car-selection/car-selection.component';
import { ConfirmedRideScreenComponent } from './features/ride-booking/components/confirmed-ride-screen/confirmed-ride-screen.component';
import { DriverDetailsComponent } from './features/ride-booking/components/driver-details/driver-details.component';
import { RideBookModalContainerComponent } from './features/ride-booking/components/ride-book-modal-container/ride-book-modal-container.component';
import { RideDetailsComponent } from './features/ride-booking/components/ride-details/ride-details.component';
import { UnassignedRidesComponent } from './features/ride-booking/components/unassigned-ride/unassigned-ride.component';
import { UpcomingRideDriverComponent } from './features/ride-booking/components/upcoming-ride-driver/upcoming-ride-driver.component';
import { UpcomingRideComponent } from './features/ride-booking/components/upcoming-ride/upcoming-ride.component';
import { RideBookingHomeComponent } from './features/ride-booking/components/ride-booking-home/ride-booking-home.component';
import { SpringBootApiService } from './features/ride-booking/services/impl/spring-boot-api.service';
import { RideBookingService } from './features/ride-booking/services/impl/ride-booking.service';
import { RIDE_BOOKING_SERVICE_TOKEN, RIDE_REPOSITORY_TOKEN } from './features/ride-booking/services/tokens/RepositoryTokens';
import { DriverRegistrationComponent } from './features/auth/components/driver-registration/driver-registration.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { UserRegistrationComponent } from './features/auth/components/user-registration/user-registration.component';
import { DriverAvailabilityComponent } from './features/driver/components/driver-availability/driver-availability.component';
import { DriverProfileComponent } from './features/driver/components/driver-profile/driver-profile.component';
import { DriverRideDashboardComponent } from './features/driver/components/driver-ride-dashboard/driver-ride-dashboard.component';
import { DriverRideHistoryComponent } from './features/driver/components/driver-ride-history/driver-ride-history.component';
import { PayementComponent } from './features/payment/components/payement/payement.component';
import { PaymentReceiptComponent } from './features/payment/components/payment-receipt/payment-receipt.component';
import { RatingSubmissionComponent } from './features/rating-and-feedback/components/rating-submission/rating-submission.component';
import { RideHistoryComponent } from './features/rider/components/ride-history/ride-history.component';
import { UserDashboardComponent } from './features/rider/components/user-dashboard/user-dashboard.component';
import { UserProfileComponent } from './features/rider/components/user-profile/user-profile.component';
import { AboutComponent } from './shared/about/about.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LandingPageComponent } from './shared/landing-page/landing-page.component';
import { LoadingScreenComponent } from './shared/loading-screen/loading-screen.component';
import { NavBarComponent } from './shared/nav-bar/nav-bar.component';
import { ServicesComponent } from './shared/services/services.component';
import { ToastComponent } from './shared/toast/toast.component';
import { MessageService } from './core/services/message.service';
import { JwtInterceptor } from './core/interceptors/jwt-interceptor.interceptor';
import { ApiMessageInterceptor } from './core/interceptors/api-message.interceptor';
import { ErrorComponent } from './shared/error/error.component';
import { ConfirmationModalComponent } from './shared/components/confirmation-modal/confirmation-modal.component';

export function getRideRepositoryProvider(): Provider {
  const useClass =
    environment.repositoryType === 'json'
      ? RideApiService
      : environment.repositoryType === 'mock'
        ? MockRideApiService
        : SpringBootApiService;

  return {
    provide: RIDE_REPOSITORY_TOKEN,
    useClass
  };
}

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    NavBarComponent,
    AboutComponent,
    ServicesComponent,
    FooterComponent,
    LoginComponent,
    RideHistoryComponent,
    UserRegistrationComponent,
    UserProfileComponent,
    DriverRegistrationComponent,
    DriverProfileComponent,
    DriverAvailabilityComponent,
    DriverRideDashboardComponent,
    RideBookingHomeComponent,
    PayementComponent,
    PaymentReceiptComponent,
    RatingSubmissionComponent,
    UserDashboardComponent,
    CarSelectionComponent,
    ConfirmedRideScreenComponent,
    RideBookModalContainerComponent,
    DriverDetailsComponent,
    RideDetailsComponent,
    UnassignedRidesComponent,
    LoadingScreenComponent,
    UnassignedRidesComponent,
    UpcomingRideComponent,
    UpcomingRideDriverComponent,
    DriverRideHistoryComponent,
    ToastComponent,
    ErrorComponent,
    ConfirmationModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogContent,
    MatFormField,
    MatLabel,
    MatSelect,
    MatDialogActions,
    MatOption,
    MatTooltip
],
  providers: [
    provideHttpClient(),
    MessageService,
    getRideRepositoryProvider(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: HttpErrorRetryInterceptor,
    //   multi: true
    // },
    {
      provide: RIDE_BOOKING_SERVICE_TOKEN,
      useClass: RideBookingService
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiMessageInterceptor,
      multi: true
    }

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
