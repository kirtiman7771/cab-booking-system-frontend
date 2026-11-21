import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PayementComponent } from '../../payment/components/payement/payement.component';
import { UnassignedRidesComponent } from '../../ride-booking/components/unassigned-ride/unassigned-ride.component';
import { DriverProfileComponent } from '../components/driver-profile/driver-profile.component';
import { DriverRideDashboardComponent } from '../components/driver-ride-dashboard/driver-ride-dashboard.component';
import { DriverRideHistoryComponent } from '../components/driver-ride-history/driver-ride-history.component';
import { UpcomingRideDriverComponent } from '../../ride-booking/components/upcoming-ride-driver/upcoming-ride-driver.component';


const routes: Routes = [
  { path: 'dashboard', component: DriverRideDashboardComponent },
  { path: 'history', component: DriverRideHistoryComponent },
  { path: 'payment', component: PayementComponent },
  { path: 'profile', component: DriverProfileComponent },
  { path: 'unassigned-rides', component: UnassignedRidesComponent },
  { path: 'upcoming-ride', component: UpcomingRideDriverComponent },
  { path: 'payment-page/:rideId', component: PayementComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriverRoutingModule { }