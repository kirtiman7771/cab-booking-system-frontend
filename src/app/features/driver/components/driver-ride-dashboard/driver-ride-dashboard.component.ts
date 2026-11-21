import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { DriverService } from '../../services/driver.service';
import { DriverDashboardModel } from '../../models/driverDashboardModel';

@Component({
  selector: 'app-driver-ride-dashboard',
  standalone: false,
  templateUrl: './driver-ride-dashboard.component.html',
  styleUrl: './driver-ride-dashboard.component.css',
})
export class DriverRideDashboardComponent implements OnInit {
  userName: string = 'Driver';
  dashboardData!: DriverDashboardModel;
  newRideRequests: any[] = [];
  user: any;
  goalsAchievedCount: number = 0;
  constructor(
    private authService: AuthService,
    private router: Router,
    private driverService: DriverService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.name;
      this.loadDashboardData(user.userId);
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadDashboardData(userId: string): void {
    this.driverService.getDriverDashboardDetails(userId).subscribe((data: DriverDashboardModel) => {
      if (data) {
        this.dashboardData = data;

        this.dashboardData.earningChange = 0;
        this.dashboardData.rideChange = 0;
        this.dashboardData.hoursOnline = 0.0;
        this.dashboardData.hoursOnlineThisWeek = 0.0;

        const earningsCompletion = (data.weeklyEarningsAchieved / data.weeklyEarningsGoal) * 100;
        const ridesCompletion = (data.weeklyRidesAchieved / data.weeklyRidesGoal) * 100;
        const ratingCompletion = (data.ratingMaintenanceAchieved / data.ratingMaintenanceGoal) * 100;
        const acceptanceCompletion = (data.acceptanceRateAchieved / data.acceptanceRateGoal) * 100;

        this.dashboardData.weeklyGoals = {
          earnings: {
            current: data.weeklyEarningsAchieved,
            goal: data.weeklyEarningsGoal,
            completion: Math.min(100, earningsCompletion)
          },
          rides: {
            current: data.weeklyRidesAchieved,
            goal: data.weeklyRidesGoal,
            completion: Math.min(100, ridesCompletion)
          },
          rating: {
            current: data.ratingMaintenanceAchieved,
            goal: data.ratingMaintenanceGoal,
            completion: Math.min(100, ratingCompletion)
          },
          acceptance: {
            current: data.acceptanceRateAchieved,
            goal: data.acceptanceRateGoal,
            completion: Math.min(100, acceptanceCompletion)
          },
        };
        let achieved = 0;
        const goals = this.dashboardData.weeklyGoals;

        if (goals.earnings.completion >= 100) achieved++;
        if (goals.rides.completion >= 100) achieved++;
        if (goals.rating.completion >= 100) achieved++;
        if (goals.acceptance.completion >= 100) achieved++;

        this.goalsAchievedCount = achieved;
      }
    });

  }





  acceptRide(rideId: number): void {
    console.log(`Driver accepted ride request with ID: ${rideId}`);
    this.newRideRequests = this.newRideRequests.filter(r => r.id !== rideId);
  }
  logout() {
    this.authService.logout();
  }
}