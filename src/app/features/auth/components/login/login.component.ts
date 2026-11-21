import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserRegistrationComponent } from '../user-registration/user-registration.component';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/UserRole';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  public UserRole = UserRole;
  private roleMapping: { [key in UserRole]: 'rider' | 'driver' } = {
    [UserRole.RIDER]: 'rider',
    [UserRole.DRIVER]: 'driver'
  };
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    public dialogRef: MatDialogRef<LoginComponent>,
    private dialog: MatDialog,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      userRole: [UserRole.RIDER, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password, userRole } = this.loginForm.value;

      this.authService.login(email, password, userRole as UserRole).subscribe({
        next: (success) => {
          if (success) {
            const feRole = this.roleMapping[userRole as UserRole];
            this.handleSuccessfulLogin(feRole);

          }

          else {
            // If the BE login failed (e.g., 401), show the alert.
            // All complex credential checking is now handled by the BE.
            this.showInvalidCredentialsAlert();
          }
        },
        error: (err) => {
          console.error('Login error:', err);
          this.showInvalidCredentialsAlert();
        }
      });
    }
  }

  private handleSuccessfulLogin(userType: 'rider' | 'driver'): void {
    this.dialogRef.close();
    if (userType === 'rider') {
      this.router.navigate(['/rider/dashboard']);
    } else if (userType === 'driver') {
      this.router.navigate(['/driver/dashboard']);
    }
  }

  private showInvalidCredentialsAlert(): void {
    this.messageService.sendMessage('error', 'Invalid email or password. Please try again.');
  }

  closeLogin(): void {
    this.dialogRef.close();
  }

  registerAsRider(): void {
    this.dialogRef.close();
    this.dialog.open(UserRegistrationComponent);
  }
}