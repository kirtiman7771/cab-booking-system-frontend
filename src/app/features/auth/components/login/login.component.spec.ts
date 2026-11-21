import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../../../core/services/message.service';
import { UserRole } from '../../models/UserRole';
import { UserRegistrationComponent } from '../user-registration/user-registration.component';

// Mock Data
const mockEmail = 'test@example.com';
const mockPassword = 'password123';

describe('LoginComponent (Jasmine)', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  // Spies
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<LoginComponent>>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    // 1. Create Jasmine Spy Objects for all dependencies
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['sendMessage', 'clearMessage']);


    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [LoginComponent], // If not standalone, use declarations
      providers: [
        FormBuilder,
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // -------------------------------------------------------------------
  // --- Initialization & Validation Tests ---
  // -------------------------------------------------------------------

  it('should create and initialize the login form with default values', () => {
    expect(component).toBeTruthy();
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('userRole')?.value).toBe(UserRole.RIDER);
  });

  it('should invalidate the form when fields are empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
    
    // Email should be required and valid
    component.loginForm.get('email')?.setValue('invalid-email');
    expect(component.loginForm.valid).toBeFalsy();
    expect(component.loginForm.get('email')?.errors?.['email']).toBeTruthy();

    // Password should be required
    component.loginForm.get('email')?.setValue(mockEmail);
    expect(component.loginForm.valid).toBeFalsy();
    expect(component.loginForm.get('password')?.errors?.['required']).toBeTruthy();
  });

  it('should validate the form when all fields are correct', () => {
    component.loginForm.setValue({
      email: mockEmail,
      password: mockPassword,
      userRole: UserRole.DRIVER
    });
    expect(component.loginForm.valid).toBeTruthy();
  });

  // -------------------------------------------------------------------
  // --- Successful Login Tests ---
  // -------------------------------------------------------------------

  it('should handle successful login for a RIDER', fakeAsync(() => {
    // Arrange
    component.loginForm.setValue({
      email: mockEmail,
      password: mockPassword,
      userRole: UserRole.RIDER // RIDER role
    });
    authServiceSpy.login.and.returnValue(of(true));

    // Act
    component.onSubmit();
    tick();

    // Assert
    expect(authServiceSpy.login).toHaveBeenCalledWith(mockEmail, mockPassword, UserRole.RIDER);
    expect(dialogRefSpy.close).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/rider/dashboard']);
    expect(messageServiceSpy.sendMessage).not.toHaveBeenCalled();
  }));

  it('should handle successful login for a DRIVER', fakeAsync(() => {
    // Arrange
    component.loginForm.setValue({
      email: mockEmail,
      password: mockPassword,
      userRole: UserRole.DRIVER // DRIVER role
    });
    authServiceSpy.login.and.returnValue(of(true));

    // Act
    component.onSubmit();
    tick();

    // Assert
    expect(authServiceSpy.login).toHaveBeenCalledWith(mockEmail, mockPassword, UserRole.DRIVER);
    expect(dialogRefSpy.close).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
    expect(messageServiceSpy.sendMessage).not.toHaveBeenCalled();
  }));
  
  // -------------------------------------------------------------------
  // --- Failed Login Tests ---
  // -------------------------------------------------------------------

  it('should show error message when authService returns false (BE failure)', fakeAsync(() => {
    // Arrange
    component.loginForm.setValue({
      email: mockEmail,
      password: mockPassword,
      userRole: UserRole.RIDER
    });
    authServiceSpy.login.and.returnValue(of(false)); // Simulating BE rejected credentials

    // Act
    component.onSubmit();
    tick();

    // Assert
    expect(authServiceSpy.login).toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled(); // Dialog should remain open
    expect(messageServiceSpy.sendMessage).toHaveBeenCalledWith('error', 'Invalid email or password. Please try again.');
  }));

  it('should show error message on API/HTTP error during login', fakeAsync(() => {
    // Arrange
    component.loginForm.setValue({
      email: mockEmail,
      password: mockPassword,
      userRole: UserRole.RIDER
    });
    authServiceSpy.login.and.returnValue(throwError(() => new Error('HTTP 401 Unauthorized')));

    // Act
    component.onSubmit();
    tick();

    // Assert
    expect(authServiceSpy.login).toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled(); // Dialog should remain open
    expect(messageServiceSpy.sendMessage).toHaveBeenCalledWith('error', 'Invalid email or password. Please try again.');
  }));

  it('should not submit if the form is invalid', () => {
    // Arrange: Form is invalid by default (empty fields)
    component.loginForm.setValue({
      email: '',
      password: '',
      userRole: UserRole.RIDER
    });

    // Act
    component.onSubmit();

    // Assert
    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(messageServiceSpy.sendMessage).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------
  // --- Dialog/Navigation Utility Tests ---
  // -------------------------------------------------------------------

  it('should close the login dialog when closeLogin is called', () => {
    component.closeLogin();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should close the login dialog and open the registration dialog when registerAsRider is called', () => {
    component.registerAsRider();
    expect(dialogRefSpy.close).toHaveBeenCalled();
    expect(dialogSpy.open).toHaveBeenCalledWith(UserRegistrationComponent);
  });
});