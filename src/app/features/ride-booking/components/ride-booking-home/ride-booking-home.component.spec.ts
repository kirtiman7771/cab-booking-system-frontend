import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RideBookingHomeComponent } from './ride-booking-home.component';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { MessageService } from '../../../../core/services/message.service';
import { RideFormStateService } from '../../services/ride-form-state.service';
import { AuthService } from '../../../auth/services/auth.service';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { InternetUtils } from '../../../../core/utils/InternetUtils';
import { Location } from '../../models/Locations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('RideBookingHomeComponent', () => {
  let component: RideBookingHomeComponent;
  let fixture: ComponentFixture<RideBookingHomeComponent>;

  // Spies / mocks
  let mockRideBookingService: any;
  let mockMessageService: any;
  let mockRideFormStateService: any;
  let mockAuthService: any;
  let isLoggedInSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    mockRideBookingService = {
      checkIfTwoRidesActive: jasmine.createSpy('checkIfTwoRidesActive').and.returnValue(of(false)),
      resetBookingState: jasmine.createSpy('resetBookingState')
    };

    mockMessageService = {
      sendMessage: jasmine.createSpy('sendMessage')
    };

    mockRideFormStateService = {
      setLocation: jasmine.createSpy('setLocation')
    };

    // authService exposes isLoggedIn$ observable which the component subscribes to in constructor
    isLoggedInSubject = new BehaviorSubject<boolean>(false);
    mockAuthService = {
      isLoggedIn$: isLoggedInSubject.asObservable(),
      // helper to update login state in tests
      __setLoggedIn: (v: boolean) => isLoggedInSubject.next(v)
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,    // Required for template exports like ngForm
        CommonModule    // Safe to include common structural directives if template uses them
      ],
      declarations: [RideBookingHomeComponent],
      providers: [
        { provide: RIDE_BOOKING_SERVICE_TOKEN, useValue: mockRideBookingService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: RideFormStateService, useValue: mockRideFormStateService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RideBookingHomeComponent);
    component = fixture.componentInstance;

    // default InternetUtils.IsOnline to true for tests; individual tests can override
    spyOn(InternetUtils, 'IsOnline').and.returnValue(true);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('constructor should subscribe to authService.isLoggedIn$ and update isLoggedIn', () => {
    // initially auth subject started with false
    expect(component.isLoggedIn).toBe(false);
    // update via mock helper
    (mockAuthService as any).__setLoggedIn(true);
    // subscription happens synchronously; value should update
    expect(component.isLoggedIn).toBe(true);
  });

  it('onBookRideClick -> empty fields should show "Fields cannot be empty" and not open modal', async () => {
    // leave locationData as default (both empty)
    await component.onBookRideClick();

    expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', 'Fields cannot be empty');
    expect(component.showCarModal).toBeFalse();
    expect(component.isLoading).toBeFalse();
    expect(mockRideFormStateService.setLocation).not.toHaveBeenCalled();
  });

  it('onBookRideClick -> same pickup and drop should show "Start and destination cannot be the same"', async () => {
    component.locationData = new Location();
    component.locationData.pickupLocation = 'Somewhere';
    component.locationData.dropLocation = 'somewhere'; // different casing but same when trimmed/lowercased
    // ensure user is logged in and online
    (mockAuthService as any).__setLoggedIn(true);
    await component.onBookRideClick();

    expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', 'Start and destination cannot be the same');
    expect(component.showCarModal).toBeFalse();
    expect(component.isLoading).toBeFalse();
    expect(mockRideFormStateService.setLocation).not.toHaveBeenCalled();
  });

  it('onBookRideClick -> offline should show offline error', async () => {
    // valid different locations
    component.locationData = new Location();
    component.locationData.pickupLocation = 'A';
    component.locationData.dropLocation = 'B';
    // logged in
    (mockAuthService as any).__setLoggedIn(true);
    // simulate offline
    (InternetUtils.IsOnline as jasmine.Spy).and.returnValue(false);

    await component.onBookRideClick();

    expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', 'You are offline. Please check your internet connection.');
    expect(component.showCarModal).toBeFalse();
    expect(component.isLoading).toBeFalse();
  });

  it('onBookRideClick -> not logged in should set bookingMessage and notify error', async () => {
    component.locationData = new Location();
    component.locationData.pickupLocation = 'A';
    component.locationData.dropLocation = 'B';
    // ensure offline check returns true and auth is false (default)
    (InternetUtils.IsOnline as jasmine.Spy).and.returnValue(true);
    (mockAuthService as any).__setLoggedIn(false);

    await component.onBookRideClick();

    expect(component.bookingMessage).toBe('User not logged in. Please log in to book a ride.');
    expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', component.bookingMessage);
    expect(component.showCarModal).toBeFalse();
    expect(component.isLoading).toBeFalse();
  });

  it('onBookRideClick -> when user already has two rides should show appropriate error and message', async () => {
    component.locationData = new Location();
    component.locationData.pickupLocation = 'A';
    component.locationData.dropLocation = 'B';
    (mockAuthService as any).__setLoggedIn(true);
    // make checkIfTwoRidesActive return true
    mockRideBookingService.checkIfTwoRidesActive.and.returnValue(of(true));

    await component.onBookRideClick();

    expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', 'You cannot book more than two rides at a time.');
    expect(component.bookingMessage).toBe('You have an active ride already. Please complete it first.');
    expect(component.showCarModal).toBeFalse();
    expect(component.isLoading).toBeFalse();
  });

  it('onBookRideClick -> success path should set location on state service and open car modal', async () => {
    component.locationData = new Location();
    component.locationData.pickupLocation = 'A';
    component.locationData.dropLocation = 'B';
    (mockAuthService as any).__setLoggedIn(true);
    mockRideBookingService.checkIfTwoRidesActive.and.returnValue(of(false));
    (InternetUtils.IsOnline as jasmine.Spy).and.returnValue(true);

    await component.onBookRideClick();

    expect(mockRideFormStateService.setLocation).toHaveBeenCalledWith(component.locationData);
    expect(component.showCarModal).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });

  it('closeCarModal should hide modal and reset booking state', () => {
    component.showCarModal = true;
    component.closeCarModal();

    expect(component.showCarModal).toBeFalse();
    expect(mockRideBookingService.resetBookingState).toHaveBeenCalled();
  });

  it('onBookRideClick -> when checkIfTwoRidesActive throws should show generic error and stop loading', async () => {
    component.locationData = new Location();
    component.locationData.pickupLocation = 'A';
    component.locationData.dropLocation = 'B';
    (mockAuthService as any).__setLoggedIn(true);
    // make check throw an error when awaited
    mockRideBookingService.checkIfTwoRidesActive.and.returnValue(throwError(() => new Error('boom')));

    await component.onBookRideClick();

    expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', 'An error occurred. Please try again later.');
    expect(component.isLoading).toBeFalse();
    // ensure modal not opened
    expect(component.showCarModal).toBeFalse();
  });
});