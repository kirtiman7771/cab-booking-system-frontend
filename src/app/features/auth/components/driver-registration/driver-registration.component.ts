import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/UserRole';
import { DriverService } from '../../../driver/services/driver.service';
import { DriverRegistrationRequest } from '../../models/DriverRegistrationRequest';
import { DriverRegistrationResponse } from '../../models/DriverRegistrationResponse';
import { MessageService } from '../../../../core/services/message.service';



@Component({
  selector: 'app-driver-registration',
  standalone: false,
  templateUrl: './driver-registration.component.html',
  styleUrls: ['./driver-registration.component.css']
})
export class DriverRegistrationComponent implements OnInit {
 
  registrationForm: FormGroup;
  loginForm: FormGroup;
  activeTab: 'signup' | 'login' = 'signup';
  currentStep: number = 1;
  totalSteps: number = 4;
  driverAllDetails: DriverRegistrationResponse;
 
  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService : MessageService
  ) {
    this.registrationForm = this.fb.group({
      personalDetails: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        dateOfBirth: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      }, { validator: this.passwordMatchValidator }),
      driverDetails: this.fb.group({
        licenseNumber: ['', Validators.required],
        licenseExpiry: ['', [Validators.required, this.futureDateValidator]],
        experience: ['', [Validators.required, Validators.min(1)]],
        emergencyName: ['', Validators.required],
        emergencyPhone: ['', Validators.required],
        emergencyRelation: ['', Validators.required]
      }),
      vehicleDetails: this.fb.group({
        vehicleNumber: ['', Validators.required],
        vehicleMake: ['', Validators.required],
        vehicleModel: ['', Validators.required],
        vehicleYear: ['', [Validators.required, Validators.min(2010), Validators.max(2025)]],
        vehicleColor: ['', Validators.required]
      }),
      bankingDetails: this.fb.group({
        bankAccount: ['', Validators.required],
        routingNumber: ['', Validators.required]
      })
    });
 
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }
 
  ngOnInit(): void {
 
  }
 
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value ?
      { 'passwordMismatch': true } : null;
  }
 
  // Custom Validator for future date
  futureDateValidator(control: AbstractControl): ValidationErrors | null {
    const today = new Date();
    const expiryDate = new Date(control.value);
    return expiryDate > today ? null : { 'pastDate': true };
  }
 
  // Get current step's form group for validation checks
  get currentStepGroup(): FormGroup {
    const formGroups = ['personalDetails', 'driverDetails', 'vehicleDetails', 'bankingDetails'];
    return this.registrationForm.get(formGroups[this.currentStep - 1]) as FormGroup;
  }
 
  // Calculate age from date of birth
  calculateAge(dateOfBirth: string): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
 
  get progressPercentage(): number {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }
 
  handleSignup(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.currentStepGroup.valid) {
        this.currentStep++;
      } else {
        this.currentStepGroup.markAllAsTouched();
      }
    } else {
      if (this.registrationForm.valid) {
        // 1. Prepare the payload (similar to onSubmit)
        const now = new Date().toISOString();
        const { confirmPassword, ...payload } = this.registrationForm.value;
        const fullName = `${payload.firstName} ${payload.lastName}`;
        const fullPayload : DriverRegistrationRequest = {
          ...payload
        };
 
        // 2. Call the registration API
        this.authService.registerDriver(fullPayload).subscribe({
          next: (response) => {
            this.driverAllDetails = response;
 
            // 3. Log in the user after successful registration
            this.authService.login(this.driverAllDetails.personalDetails.email, this.registrationForm.value.personalDetails.password, UserRole.DRIVER).subscribe({
              next: (loggedIn) => {
                if (loggedIn) {
                  this.messageService.sendMessage('success', 'Registration and Login Successful!');
                  this.router.navigate(['/driver/dashboard']);
                } else {
                  this.messageService.sendMessage('error', 'Login failed after registration. Please try logging in manually.');
                  this.router.navigate(['/driver-registration']);
                }
              },
              error: (err) => {
                this.messageService.sendMessage('error', 'Login failed after registration. Please try logging in manually.');
                this.router.navigate(['/driver-registration']);
              }
            });
          },
          error: (err) => {
            this.messageService.sendMessage('error', 'Registration failed. Please try again later.');
          }
        });
      } else {
        this.registrationForm.markAllAsTouched();
      }
    }
  }
 
  handleLogin(): void {
  if (this.loginForm.valid) {
    this.authService.login(this.loginForm.value.email, this.loginForm.value.password, UserRole.DRIVER).subscribe(response => {
      if (response) {
        this.messageService.sendMessage('success', 'Welcome back! Login successful.');
        this.handleSuccessfulLogin('driver');
      } else {
        this.messageService.sendMessage('error', 'Login failed. Please check your credentials and try again.');
      }
    });
  } else {
    this.loginForm.markAllAsTouched();
  }
}
 
  private handleSuccessfulLogin(userType: string): void {
    if (userType === 'rider') {
      this.router.navigate(['/rider/dashboard']);
    } else if (userType === 'driver') {
      this.router.navigate(['/driver/dashboard']);
    }
  }
}