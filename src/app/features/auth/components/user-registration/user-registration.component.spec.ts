import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { UserRegistrationComponent } from './user-registration.component';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { MessageService } from '../../../../core/services/message.service';
import { LoginComponent } from '../login/login.component';
import { UserRole } from '../../models/UserRole';
import { RiderRegistrationRequest } from '../../models/RiderRegistrationRequest';


// Mock Data
const mockRiderPayload: RiderRegistrationRequest = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '1234567890',
  passwordHash: 'validpassword123',
};
const mockRegistrationResponse = { 
    ...mockRiderPayload, 
    userId: '123', 
    role: 'RIDER',
    createdAt: new Date().toISOString()
};

describe('UserRegistrationComponent (Jasmine)', () => {
  let component: UserRegistrationComponent;
  let fixture: ComponentFixture<UserRegistrationComponent>;
  // Spies
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    // 1. Create Jasmine Spy Objects
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['registerRider', 'login']);
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll', 'open']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['sendMessage']);
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['']); // Minimal mock if not used directly

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [UserRegistrationComponent],
      providers: [
        FormBuilder,
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Helper to set valid form data including matching passwords
    const setValidForm = () => {
        component.registrationForm.setValue({
            firstName: mockRiderPayload.firstName,
            lastName: mockRiderPayload.lastName,
            email: mockRiderPayload.email,
            phone: mockRiderPayload.phone,
            passwordHash: mockRiderPayload.passwordHash,
            confirmPassword: mockRiderPayload.passwordHash,
        });
    };
    component['setValidForm'] = setValidForm; // Attach to component for use in tests
  });

  // -------------------------------------------------------------------
  // --- Form Initialization & Validation Tests ---
  // -------------------------------------------------------------------

  it('should create and initialize the registration form', () => {
  expect(component).toBeTruthy();
  expect(component.registrationForm).toBeDefined();
  
  // Check that controls exist
  expect(component.registrationForm.controls['firstName']).toBeDefined();
  
  // Check for minLength validator on passwordHash
  component.registrationForm.controls['passwordHash'].setValue('12345'); // 5 chars
  expect(component.registrationForm.controls['passwordHash'].errors?.['minlength']).toBeTruthy(); 
  
  // Check for email validator on email
  component.registrationForm.controls['email'].setValue('not-an-email');
  expect(component.registrationForm.controls['email'].errors?.['email']).toBeTruthy();
  
  // Reset email control for subsequent tests
  component.registrationForm.controls['email'].setValue('');
});

  it('should be invalid when required fields are empty', () => {
    expect(component.registrationForm.valid).toBeFalsy();
    component.registrationForm.controls['firstName'].setValue('Test');
    expect(component.registrationForm.valid).toBeFalsy();
  });

  it('should be invalid when password is too short', () => {
    component['setValidForm']();
    component.registrationForm.controls['passwordHash'].setValue('short');
    component.registrationForm.controls['confirmPassword'].setValue('short');
    
    expect(component.registrationForm.valid).toBeFalsy();
    expect(component.registrationForm.controls['passwordHash'].errors?.['minlength']).toBeTruthy();
  });

  it('should validate the form when all inputs are valid', () => {
    component['setValidForm']();
    expect(component.registrationForm.valid).toBeTruthy();
    expect(component.registrationForm.errors).toBeNull();
  });
  
  // -------------------------------------------------------------------
  // --- Custom Password Match Validator Tests ---
  // -------------------------------------------------------------------

  it('should return null when passwords match', () => {
    component.registrationForm.controls['passwordHash'].setValue('testpass');
    component.registrationForm.controls['confirmPassword'].setValue('testpass');
    
    // The validator is on the FormGroup itself
    const result = component.passwordMatchValidator(component.registrationForm);
    expect(result).toBeNull();
  });


it('should return null when passwords match', () => {
    // Set matching passwords and all other required fields
    component.registrationForm.setValue({
        firstName: 'Valid',
        lastName: 'Name',
        email: 'a@b.com',
        phone: '1234567890',
        passwordHash: 'testpass',
        confirmPassword: 'testpass',
    });
    
    component.registrationForm.updateValueAndValidity();
    
    // The form group should have no errors (null)
    expect(component.registrationForm.errors).toBeNull();
    // The form should be completely valid
    expect(component.registrationForm.valid).toBeTruthy();
});
  // -------------------------------------------------------------------
  // --- onSubmit Logic Tests (Success & Failure) ---
  // -------------------------------------------------------------------

  describe('onSubmit', () => {
    it('should NOT submit if the form is invalid', () => {
        // Form is invalid by default (empty fields)
        component.onSubmit();
        expect(authServiceSpy.registerRider).not.toHaveBeenCalled();
        expect(messageServiceSpy.sendMessage).not.toHaveBeenCalled();
    });

    it('should register, login, navigate to dashboard, and close dialogs on full success', fakeAsync(() => {
        // Arrange
        component['setValidForm']();
        authServiceSpy.registerRider.and.returnValue(of(mockRegistrationResponse)); // Registration succeeds
        authServiceSpy.login.and.returnValue(of(true)); // Login succeeds

        // Act
        component.onSubmit();
        tick(); // Resolve registerRider
        tick(); // Resolve login

        // Assert Registration
        const expectedRegisterPayload = {...mockRiderPayload};
        expect(authServiceSpy.registerRider).toHaveBeenCalledWith(expectedRegisterPayload);

        // Assert Login
        expect(authServiceSpy.login).toHaveBeenCalledWith(
            mockRiderPayload.email, 
            mockRiderPayload.passwordHash, 
            UserRole.RIDER
        );
        
        // Assert UI/Navigation
        expect(messageServiceSpy.sendMessage).toHaveBeenCalledWith('success', 'Registration and login successful!');
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/rider/dashboard']);
    }));

    // --- Failure Scenarios ---

    it('should handle registration failure (BE error)', fakeAsync(() => {
        // Arrange
        component['setValidForm']();
        authServiceSpy.registerRider.and.returnValue(throwError(() => new Error('Email already exists')));
        
        // Act
        component.onSubmit();
        tick();

        // Assert
        expect(authServiceSpy.registerRider).toHaveBeenCalled();
        expect(authServiceSpy.login).not.toHaveBeenCalled(); // Login should not be attempted
        expect(messageServiceSpy.sendMessage).toHaveBeenCalledWith('error', 'Registration failed. Please try again later.');
        expect(matDialogSpy.closeAll).not.toHaveBeenCalled();
    }));

    it('should handle login failure after successful registration (BE returns false)', fakeAsync(() => {
        // Arrange
        component['setValidForm']();
        authServiceSpy.registerRider.and.returnValue(of(mockRegistrationResponse)); // Registration succeeds
        authServiceSpy.login.and.returnValue(of(false)); // Login fails (e.g., policy issue)
        
        // Act
        component.onSubmit();
        tick(); // Resolve registerRider
        tick(); // Resolve login

        // Assert
        expect(authServiceSpy.registerRider).toHaveBeenCalled();
        expect(authServiceSpy.login).toHaveBeenCalled();
        expect(messageServiceSpy.sendMessage).toHaveBeenCalledWith('error', 'Login failed after registration. Please try logging in manually.');
        expect(matDialogSpy.closeAll).not.toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should handle login failure after successful registration (HTTP error)', fakeAsync(() => {
        // Arrange
        component['setValidForm']();
        authServiceSpy.registerRider.and.returnValue(of(mockRegistrationResponse)); // Registration succeeds
        authServiceSpy.login.and.returnValue(throwError(() => new Error('HTTP Error during login'))); // Login throws error
        
        // Act
        component.onSubmit();
        tick(); // Resolve registerRider
        tick(); // Resolve login (error branch)

        // Assert
        expect(authServiceSpy.registerRider).toHaveBeenCalled();
        expect(authServiceSpy.login).toHaveBeenCalled();
        expect(messageServiceSpy.sendMessage).toHaveBeenCalledWith('error', 'Login failed after registration. Please try logging in manually.');
        expect(matDialogSpy.closeAll).not.toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));
  });

  // -------------------------------------------------------------------
  // --- Dialog Utility Tests ---
  // -------------------------------------------------------------------

  it('should close all dialogs and open the login dialog when loginAsRider is called', () => {
    component.loginAsRider();
    expect(matDialogSpy.closeAll).toHaveBeenCalled();
    expect(matDialogSpy.open).toHaveBeenCalledWith(LoginComponent);
  });

  it('should close all dialogs when closeDialog is called', () => {
    component.closeDialog();
    expect(matDialogSpy.closeAll).toHaveBeenCalled();
  });
});