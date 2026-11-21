import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PayementComponent } from '../../payment/components/payement/payement.component';
import { RideHistoryComponent } from '../components/ride-history/ride-history.component';
import { UserDashboardComponent } from '../components/user-dashboard/user-dashboard.component';
import { UserProfileComponent } from '../components/user-profile/user-profile.component';
import { UpcomingRideComponent } from '../../ride-booking/components/upcoming-ride/upcoming-ride.component';

const routes: Routes = [
  { path: 'dashboard', component: UserDashboardComponent },
  { path: 'history', component: RideHistoryComponent },
  { path: 'payment', component: PayementComponent },
  { path: 'upcoming-ride', component: UpcomingRideComponent },
  { path: 'profile', component: UserProfileComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RiderRoutingModule { }