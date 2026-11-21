import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { FormBuilder, Validators, FormGroup, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/UserRole';
import { RiderRegistrationRequest } from '../../models/RiderRegistrationRequest';
import { MessageService } from '../../../../core/services/message.service';


@Component({
  selector: 'app-user-registration',
  standalone: false,
  templateUrl: './user-registration.component.html',
  styleUrl: './user-registration.component.css'
})
export class UserRegistrationComponent {

  registrationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private matDialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    public dialogRef: MatDialogRef<UserRegistrationComponent>,
  ) {
    this.registrationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator: ValidatorFn = (form: AbstractControl): { [key: string]: any } | null => {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'mismatch': true };
    }
    return null;
  }

  loginAsRider() {
    this.dialogRef.close();
    this.matDialog.open(LoginComponent);
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      const now = new Date().toISOString();

      const { confirmPassword, ...payload } = this.registrationForm.value;
      const fullName = `${this.registrationForm.value.firstName} ${this.registrationForm.value.lastName}`;
      const fullPayload: RiderRegistrationRequest = {
        ...payload
        // name: fullName,
        // role: 'rider',
        // createdAt: now,
        // updatedAt: now
      };
      this.authService.registerRider(fullPayload).subscribe({
        next: (response: any) => {
          const registerUser = response;
          this.authService.login(registerUser.email, this.registrationForm.value.passwordHash, UserRole.RIDER).subscribe({
            next: (loggedIn) => {
              if (loggedIn) {
                this.messageService.sendMessage('success', 'Registration and login successful!');
                this.matDialog.closeAll();
                this.router.navigate(['/rider/dashboard']);
              } else {
                this.messageService.sendMessage('error', 'Login failed after registration. Please try logging in manually.');
                this.router.navigate(['/login']);
              }
            },
            error: (err) => {
              this.messageService.sendMessage('error', 'Login failed after registration. Please try logging in manually.');
              this.router.navigate(['/login']);
            }
          });
        },
        error: (err) => {
          this.messageService.sendMessage('error', 'Registration failed. Please try again later.');
        }
      });
    }
  }


  closeDialog() {
    this.matDialog.closeAll();
  }
}