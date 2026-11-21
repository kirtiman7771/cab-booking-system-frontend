import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Ride } from '../../../ride-booking/models/Ride';
import { RiderService } from '../../services/rider.service';
import { CarTypesCount, RiderAllDetails } from '../../models/riderAllDetails';


@Component({
  selector: 'app-user-dashboard',
  standalone: false,
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDashboardComponent {
  userName: string = 'User';
  dashboardData: RiderAllDetails = null;
  carTypesCount: CarTypesCount = {};
  bookingForm: FormGroup;
  rideRequestMessage: string = '';
  carTypePercentages: { type: string, count: number, percentage: number, color: string }[] = [];
  private carTypeColors: { [key: string]: string } = {
    'Mini': '#3498db',
    'Luxury': '#9b59b6',
    'E-Rickshaw': '#1abc9c',
    'Micro': '#f1c40f',
    'Prime SUV': '#e74c3c',
    'Prime Sedan': '#2ecc71',
  };
  totalCarRides: number = 0;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private riderService: RiderService,
    // private cd: ChangeDetectorRef
  ) {
    this.bookingForm = this.fb.group({
      pickupLocation: ['', Validators.required],
      dropLocation: ['', Validators.required],
      scheduleForLater: [false]
    });
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.loadDashboardData(user.userId);
    } else {
      this.router.navigate(['/login']);
    }
  }

loadDashboardData(userId: string): void {
    this.riderService.getRiderAllDetails(userId).subscribe({
      next: (data) => {
        if (data) {
          this.dashboardData = data;
        }
      },
      error: (err) => {
        console.error('Failed to load dashboard details:', err);
        this.dashboardData = null; 
      }
    });

    this.riderService.getCarTypesCountById(userId).subscribe({
      next: (data) => {
        if (data) {
          this.carTypesCount = data;
          this.calculateCarTypeChartData();
        }
      },
      error: (err) => {
        console.error('Failed to load car types count:', err);
        this.carTypesCount = {}; 
      }
    });
  }

  calculateCarTypeChartData(): void {
    const counts = this.carTypesCount;
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    this.totalCarRides = total;
    this.carTypePercentages = []; 

    if (total === 0) {
      return; 
    }

    for (const type in counts) {
      if (counts.hasOwnProperty(type)) {
        this.carTypePercentages.push({
          type: type,
          count: counts[type],
          percentage: (counts[type] / total) * 100,
          color: this.carTypeColors[type] || '#7f8c8d'
        });
      }
    }

    this.carTypePercentages.sort((a, b) => b.count - a.count);
  }

  getConicGradient(): string {
    if (this.totalCarRides === 0) {
      return 'none';
    }

    let gradientString = 'conic-gradient(';
    let currentAngle = 0;

    this.carTypePercentages.forEach((item, index) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + item.percentage;

      gradientString += `${item.color} ${startAngle}% ${endAngle}%`;

      if (index < this.carTypePercentages.length - 1) {
        gradientString += ', ';
      }
      currentAngle = endAngle;
    });

    gradientString += ')';
    return gradientString;
  }

  logout() {
    this.authService.logout();
  }
}