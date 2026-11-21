import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DriverRegistrationComponent } from './features/auth/components/driver-registration/driver-registration.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { UserRegistrationComponent } from './features/auth/components/user-registration/user-registration.component';
import { DriverProfileComponent } from './features/driver/components/driver-profile/driver-profile.component';
import { DriverRideDashboardComponent } from './features/driver/components/driver-ride-dashboard/driver-ride-dashboard.component';
import { DriverRideHistoryComponent } from './features/driver/components/driver-ride-history/driver-ride-history.component';
import { PayementComponent } from './features/payment/components/payement/payement.component';
import { UnassignedRidesComponent } from './features/ride-booking/components/unassigned-ride/unassigned-ride.component';
import { UpcomingRideDriverComponent } from './features/ride-booking/components/upcoming-ride-driver/upcoming-ride-driver.component';
import { UpcomingRideComponent } from './features/ride-booking/components/upcoming-ride/upcoming-ride.component';
import { RideHistoryComponent } from './features/rider/components/ride-history/ride-history.component';
import { UserDashboardComponent } from './features/rider/components/user-dashboard/user-dashboard.component';
import { UserProfileComponent } from './features/rider/components/user-profile/user-profile.component';
import { AboutComponent } from './shared/about/about.component';
import { ContactComponent } from './shared/contact/contact.component';
import { LandingPageComponent } from './shared/landing-page/landing-page.component';
import { RideBookingHomeComponent } from './features/ride-booking/components/ride-booking-home/ride-booking-home.component';
import { ErrorComponent } from './shared/error/error.component';
import { ServicesComponent } from './shared/services/services.component';


const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: UserRegistrationComponent },
  { path: 'driver-registration', component: DriverRegistrationComponent },
  { path: 'registration', component: UserRegistrationComponent },
  { path: 'rider-login', component: LoginComponent },
  { path: 'driver-login', component: LoginComponent },
  { path: 'services', component: ServicesComponent},

  // { path: 'ride-book', component: RideBookingHomeComponent },



  // Rider Routes
  {
    path: 'rider',
    canActivate: [AuthGuard],
    data: { role: 'rider' },
    loadChildren: () => import('./features/rider/rider-routing/rider-routing.module').then(m => m.RiderRoutingModule)
  },


  // Driver Routes
{
    path: 'driver',
    canActivate: [AuthGuard],
    data: { role: 'driver' },
    loadChildren: () => import('./features/driver/driver-routing/driver-routing.module').then(m => m.DriverRoutingModule)
  },

  { path: '**', component:ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }