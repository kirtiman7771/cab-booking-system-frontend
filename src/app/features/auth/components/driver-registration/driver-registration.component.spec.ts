import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverRegistrationComponent } from './driver-registration.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/UserRole';

describe('DriverRegistrationComponent', () => {
  let component: DriverRegistrationComponent;
  let fixture: ComponentFixture<DriverRegistrationComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['registerDriver']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [DriverRegistrationComponent],
      providers: [
        FormBuilder,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test the custom password match validator
  describe('passwordMatchValidator', () => {
    it('should return null if passwords match', () => {
      const form = new FormBuilder().group({
        password: ['testpass123'],
        confirmPassword: ['testpass123']
      });
      expect(component.passwordMatchValidator(form)).toBeNull();
    });

    it('should return an error if passwords do not match', () => {
      const form = new FormBuilder().group({
        password: ['testpass123'],
        confirmPassword: ['mismatch']
      });
      expect(component.passwordMatchValidator(form)).toEqual({ 'passwordMismatch': true });
    });
  });

  // Test the custom future date validator
  describe('futureDateValidator', () => {
    it('should return null for a future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const control = new FormBuilder().control(futureDate.toISOString().substring(0, 10));
      expect(component.futureDateValidator(control)).toBeNull();
    });

    it('should return an error for a past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const control = new FormBuilder().control(pastDate.toISOString().substring(0, 10));
      expect(component.futureDateValidator(control)).toEqual({ 'pastDate': true });
    });
  });

  // Test the multi-step navigation logic
  describe('handleSignup', () => {
    it('should move to the next step if the current form group is valid', () => {
      // Mock a valid form for the first step
      component.registrationForm.get('personalDetails')?.setValue({
        firstName: 'Test',
        lastName: 'Driver',
        email: 'test@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        password: 'password123',
        confirmPassword: 'password123'
      });
      component.currentStep = 1;
      component.handleSignup();
      expect(component.currentStep).toBe(2);
    });

    it('should not move to the next step if the current form group is invalid', () => {
      // Set an invalid state (e.g., missing a required field)
      component.registrationForm.get('personalDetails')?.setValue({
        firstName: '', // Invalid field
        lastName: 'Driver',
        email: 'test@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        password: 'password123',
        confirmPassword: 'password123'
      });
      component.currentStep = 1;
      component.handleSignup();
      expect(component.currentStep).toBe(1);
    });
  });

  // Test the final registration process
  describe('handleSignup - final step', () => {
    let fullPayload: any;

    beforeEach(() => {
      // Set all form groups to a valid state
      component.currentStep = component.totalSteps;
      component.registrationForm.get('personalDetails')?.setValue({
        firstName: 'Test', lastName: 'Driver', email: 'test@example.com', phone: '1234567890', dateOfBirth: '1990-01-01', password: 'password123', confirmPassword: 'password123'
      });
      component.registrationForm.get('driverDetails')?.setValue({
        licenseNumber: 'A123', licenseExpiry: '2025-12-31', experience: 5, emergencyName: 'Emergency', emergencyPhone: '0987654321', emergencyRelation: 'Friend'
      });
      component.registrationForm.get('vehicleDetails')?.setValue({
        vehicleNumber: 'TN-123', vehicleMake: 'Honda', vehicleModel: 'Civic', vehicleYear: 2020, vehicleColor: 'Black'
      });
      component.registrationForm.get('bankingDetails')?.setValue({
        bankAccount: '12345', routingNumber: '67890'
      });

      fullPayload = {
        personalDetails: { firstName: 'Test', lastName: 'Driver', email: 'test@example.com', phone: '1234567890', dateOfBirth: '1990-01-01', password: 'password123', confirmPassword: 'password123' },
        driverDetails: { licenseNumber: 'A123', licenseExpiry: '2025-12-31', experience: 5, emergencyName: 'Emergency', emergencyPhone: '0987654321', emergencyRelation: 'Friend' },
        vehicleDetails: { vehicleNumber: 'TN-123', vehicleMake: 'Honda', vehicleModel: 'Civic', vehicleYear: 2020, vehicleColor: 'Black' },
        bankingDetails: { bankAccount: '12345', routingNumber: '67890' },
        name: 'Test Driver',
        role: 'driver',
        createdAt: jasmine.any(String),
        updatedAt: jasmine.any(String)
      };

      spyOn(window, 'alert');
    });

    it('should register and log in the driver on form submission', () => {
      // Mock API service calls
      apiServiceSpy.registerDriver.and.returnValue(of({ email: 'test@example.com', password: 'password123' }));
      authServiceSpy.login.and.returnValue(of(true));

      component.handleSignup();

      expect(apiServiceSpy.registerDriver).toHaveBeenCalled();
      expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'password123', UserRole.DRIVER);
      expect(window.alert).toHaveBeenCalledWith('Driver registered successfully. You are now logged in.');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
    });

    it('should alert and navigate back if login fails after registration', () => {
      // Mock API and AuthService responses
      apiServiceSpy.registerDriver.and.returnValue(of({ email: 'test@example.com', password: 'password123' }));
      authServiceSpy.login.and.returnValue(of(false));

      component.handleSignup();

      expect(apiServiceSpy.registerDriver).toHaveBeenCalled();
      expect(authServiceSpy.login).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver-registration']);
    });

    it('should alert if registration fails', () => {
      apiServiceSpy.registerDriver.and.returnValue(throwError(() => new Error('Registration failed')));

      component.handleSignup();

      expect(apiServiceSpy.registerDriver).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Registration failed. Please try again.');
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });
  });

  // Test login functionality
  describe('handleLogin', () => {
    it('should log in a user and navigate to the dashboard on successful login', () => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        userRole: UserRole.DRIVER
      });
      authServiceSpy.login.and.returnValue(of(true));

      component.handleLogin();

      expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'password123', UserRole.DRIVER);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
    });

    it('should not navigate if login fails', () => {
      component.loginForm.setValue({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });
      authServiceSpy.login.and.returnValue(of(false));

      component.handleLogin();

      expect(authServiceSpy.login).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});