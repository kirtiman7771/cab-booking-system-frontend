import { Component, OnInit } from '@angular/core';
import { RiderAllDetails } from '../../models/riderAllDetails';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RiderService } from '../../services/rider.service';
import { RiderProfile } from '../../models/RiderProfile';
import { RiderUpdateProfile } from '../../models/RiderUpdateProfile';
import { Router } from '@angular/router';
import { MessageService } from '../../../../core/services/message.service';



@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {

  userId: string = '';
  userDetails!: RiderAllDetails;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private auth: AuthService,
    private riderApiService: RiderService,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      const authUser = JSON.parse(savedUser);
      this.userId = authUser.userId;
    }

    if (this.userId) {
      const riderId = this.userId
      this.riderApiService.getRiderAllDetails(riderId).subscribe({
        next: (res) => {
          this.userDetails = res;
        },
        error: (err) => {
          this.messageService.sendMessage('error', 'Failed to load user profile. Please try again later.');
        }
      });
    }
  }

  updateProfile(): void {
    if (!this.userDetails.firstName || !this.userDetails.phone) {
      this.messageService.sendMessage('error', 'First Name and Phone are required fields.');
      return;
    }

    const profileData: RiderUpdateProfile = {
      firstName: this.userDetails.firstName,
      lastName: this.userDetails.lastName,
      phone: this.userDetails.phone,
    };
    const riderId = this.userId
    this.riderApiService.updateUserProfile(riderId, profileData).subscribe({
      next: (res) => {
        this.messageService.sendMessage('success', 'Profile Updated Successfully!');
      },
      error: (err) => {
        this.messageService.sendMessage('error', 'Failed to update profile. Please try again.');
      }
    });
  }



  logout() {
    this.auth.logout();
  }



  confirmDeleteAccount(): void {
    if (this.userId) {
      this.riderApiService.deleteRiderAccount(this.userId).subscribe({
        next: () => {
          this.messageService.sendMessage('success', 'Your account has been successfully deleted!');
          this.logout();
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.messageService.sendMessage('error', 'Failed to delete account. Please try again later.');
        }
      });
    } else {
      this.messageService.sendMessage('error', 'User ID not found. Cannot delete account.');
    }
  }


}
