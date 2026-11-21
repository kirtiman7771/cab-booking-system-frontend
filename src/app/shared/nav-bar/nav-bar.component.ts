import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { finalize, Observable } from 'rxjs';
import { LoginComponent } from '../../features/auth/components/login/login.component';
import { UserRegistrationComponent } from '../../features/auth/components/user-registration/user-registration.component';
import { AuthService } from '../../features/auth/services/auth.service';
import { DriverService } from '../../features/driver/services/driver.service';
import { MessageService } from '../../core/services/message.service';
import { LoaderService } from '../../core/services/loader.service';


@Component({
  selector: 'app-nav-bar',
  standalone: false,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  isDropdownOpen: boolean = false;
  isLoggedIn: boolean = false;
  isLoggedIn$!: Observable<boolean>;
  userType$!: Observable<'rider' | 'driver' | null>;
  isDriverAvailable: boolean = false;
  private driverId: string | null = null;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService,
    private driverService: DriverService,
    private messageService: MessageService,
    private loaderService: LoaderService
  ) { }

  userName = "";
  driverName = "";
  ngOnInit(): void {
    this.userType$ = this.authService.userType$
    this.isLoggedIn$ = this.authService.isLoggedIn$
    this.authService.isLoggedIn$.subscribe(loggedIn => {
      if (loggedIn) {

        const users = this.authService.getUser();

        const driver = this.authService.getDriver(); 
        if (users) {

          this.userName = users.name || users.email || 'User';
        } else {
          this.userName = 'User';
        }

        if (driver) {
          this.driverName = driver.email || 'Driver';

          this.driverId = driver.userId;
        } else {
          this.driverName = 'Driver';
          this.driverId = null;
        }


      } else {
        this.userName = '';
        this.driverName = '';
        this.driverId = null;
        this.isDriverAvailable = false;
      }
    });
  }
  toggleDropdown() {
    console.log('dropdown opens')
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  loginAs(role: string) {
    if (role === 'rider') {
      this.router.navigate(['/rider-login']);
    }

    else if (role === 'driver') {
      this.router.navigate(['/driver-registraion']);
    }

    this.isDropdownOpen = false;
  }

  openUserLogin() {
    this.dialog.open(LoginComponent, {
    });
  }

  openUserRegistration() {
    this.dialog.open(UserRegistrationComponent, {
    });
  }

  openDriverLogin() {
    this.dialog.open(LoginComponent, {
      width: '400px',
      height: '400px'
    });
  }

  logout() {
    this.authService.logout();
  }


  onStatusChange(event: any): void {
    const isChecked = event.target.checked;
    this.isDriverAvailable = isChecked;
    const newStatus = isChecked ? 'AVAILABLE' : 'UNAVAILABLE';
    if (this.driverId) {
      this.driverService.updateDriverStatus(this.driverId, newStatus)

        .subscribe({
          next: (response) => {
            this.messageService.sendMessage('success', `Status updated to ${newStatus}`);
          },
          error: (err) => {
            console.error('Error updating driver status:', err);
            this.messageService.sendMessage('error', 'Failed to update status.'); 
            this.isDriverAvailable = !isChecked;
          }
        });
    } else {
      console.warn('Cannot update status: Driver ID is missing.');
      this.messageService.sendMessage('error', 'Driver not recognized. Please log in.'); 
      this.isDriverAvailable = false;
    }
  }
}
