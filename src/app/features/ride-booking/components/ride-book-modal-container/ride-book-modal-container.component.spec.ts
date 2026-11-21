import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { RideBookModalContainerComponent } from './ride-book-modal-container.component';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { MessageService } from '../../../../core/services/message.service';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';

describe('RideBookModalContainerComponent', () => {
  let component: RideBookModalContainerComponent;
  let fixture: ComponentFixture<RideBookModalContainerComponent>;

  // Mocks
  let mockRideBookingService: Partial<IRideBookingService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let bookedRideSubject: BehaviorSubject<Ride | null>;

  const mockRide: Ride = {
    rideId: 'ride-123',
    userId: 'user-1',
    pickupLocation: 'A',
    dropLocation: 'B',
    fare: 250,
    status: RideStatus.LookingForDriver,
    dateTime: new Date()
  };

  beforeEach(async () => {
    bookedRideSubject = new BehaviorSubject<Ride | null>(null);

    mockRideBookingService = {
      bookedRide$: bookedRideSubject.asObservable(),
      resetBookingState: jasmine.createSpy('resetBookingState')
    };

    mockMessageService = jasmine.createSpyObj('MessageService', ['sendMessage']);

    await TestBed.configureTestingModule({
      declarations: [RideBookModalContainerComponent],
      providers: [
        { provide: RIDE_BOOKING_SERVICE_TOKEN, useValue: mockRideBookingService },
        { provide: MessageService, useValue: mockMessageService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RideBookModalContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    bookedRideSubject.complete();
  });

  // -------------------------------------------------------------------------
  // 1. Component Creation & Initial State
  // -------------------------------------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.errorMessage()).toBe('');
    expect(component.headerMessage()).toBe('Choose Your Ride');
    expect(component.showConfirmScreen).toBeFalse();
    expect(component.showCarData).toBeTrue();
    expect(component.showPaymentMethod).toBeFalse();
    expect(component.currentStep).toBe(1);
    expect(component.rideId).toBe('');
  });

  // -------------------------------------------------------------------------
  // 2. ngOnInit() - Subscription to bookedRide$
  // -------------------------------------------------------------------------
  it('should subscribe to bookedRide$ on init and update rideId + show confirm screen', fakeAsync(() => {
    spyOn(component, 'showConfirmScreenFn');

    bookedRideSubject.next(mockRide);
    tick();

    expect(component.rideId).toBe('ride-123');
    expect(component.showConfirmScreenFn).toHaveBeenCalled();
  }));

  it('should not react if bookedRide$ emits null', fakeAsync(() => {
    spyOn(component, 'showConfirmScreenFn');

    bookedRideSubject.next(null);
    tick();

    expect(component.rideId).toBe('');
    expect(component.showConfirmScreenFn).not.toHaveBeenCalled();
  }));

  // -------------------------------------------------------------------------
  // 3. ngOnDestroy() - Cleanup
  // -------------------------------------------------------------------------
  it('should unsubscribe from bookedRideSubscription on destroy', () => {
    const unsubscribeSpy = spyOn(
      component['bookedRideSubscription'],
      'unsubscribe'
    ).and.callThrough();

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should not throw if subscription is undefined', () => {
    component['bookedRideSubscription'] = undefined as any;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // 4. closeModal()
  // -------------------------------------------------------------------------
  it('should call resetBookingState and emit close event', () => {
    const closeSpy = spyOn(component.close, 'emit');

    component.closeModal();

    expect(mockRideBookingService.resetBookingState).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledWith();
  });

  // -------------------------------------------------------------------------
  // 5. onBackdropClick()
  // -------------------------------------------------------------------------
  it('should close modal when clicking on modal-overlay', () => {
    spyOn(component, 'closeModal');
    const mockEvent = {
      target: { classList: { contains: jasmine.createSpy('contains').and.returnValue(true) } }
    } as any;

    component.onBackdropClick(mockEvent);

    expect(component.closeModal).toHaveBeenCalled();
  });

  it('should NOT close modal when clicking inside content', () => {
    spyOn(component, 'closeModal');
    const mockEvent = {
      target: { classList: { contains: jasmine.createSpy('contains').and.returnValue(false) } }
    } as any;

    component.onBackdropClick(mockEvent);

    expect(component.closeModal).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 6. Navigation Methods
  // -------------------------------------------------------------------------
  describe('Screen Navigation Methods', () => {
    it('showPaymentMethodFn() should show payment screen and update header', () => {
      component.showPaymentMethodFn();
      expect(component.showPaymentMethod).toBeTrue();
      expect(component.showCarData).toBeFalse();
      expect(component.showConfirmScreen).toBeFalse();
      expect(component.headerMessage()).toBe('Choose Payment Method');
    });

    it('showCarDataFn() should show car selection screen and update header', () => {
      component.showPaymentMethod = true;
      component.showPaymentMethodFn();
      component.showCarDataFn();

      expect(component.showCarData).toBeTrue();
      expect(component.showPaymentMethod).toBeFalse();
      expect(component.showConfirmScreen).toBeFalse();
      expect(component.headerMessage()).toBe('Choose Your Ride');
    });

    it('showConfirmScreenFn() should show confirm screen and clear header', () => {
      component.showConfirmScreenFn();
      expect(component.showConfirmScreen).toBeTrue();
      expect(component.showCarData).toBeFalse();
      expect(component.showPaymentMethod).toBeFalse();
      expect(component.headerMessage()).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // 7. updateHeaderMessage()
  // -------------------------------------------------------------------------
  it('updateHeaderMessage() should set correct message based on visible screen', () => {
    component.showCarData = true;
    component.showPaymentMethod = false;
    component.showConfirmScreen = false;
    component.updateHeaderMessage();
    expect(component.headerMessage()).toBe('Choose Your Ride');

    component.showCarData = false;
    component.showPaymentMethod = true;
    component.updateHeaderMessage();
    expect(component.headerMessage()).toBe('Choose Payment Method');

    component.showPaymentMethod = false;
    component.showConfirmScreen = true;
    component.updateHeaderMessage();
    expect(component.headerMessage()).toBe('');
  });

  // -------------------------------------------------------------------------
  // 8. goBack()
  // -------------------------------------------------------------------------
  it('goBack() should return to car selection from payment screen', () => {
    spyOn(component, 'showCarDataFn');
    component.showPaymentMethod = true;
    component.goBack();
    expect(component.showCarDataFn).toHaveBeenCalled();
  });

  it('goBack() should do nothing if not on payment screen', () => {
    spyOn(component, 'showCarDataFn');
    component.showPaymentMethod = false;
    component.goBack();
    expect(component.showCarDataFn).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 9. Signal + Effect: errorMessage → snackbar (UNIVERSAL FIX)
  // -------------------------------------------------------------------------
  it('should show error message via snackbar when errorMessage signal changes', fakeAsync(async () => {
    component.errorMessage.set('Network error');
    fixture.detectChanges();     // Trigger change detection
    await fixture.whenStable();  // Wait for effect to run

    expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', 'Network error');
  }));

  it('should not show snackbar if errorMessage is empty', fakeAsync(async () => {
    component.errorMessage.set('');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockMessageService.sendMessage).not.toHaveBeenCalled();
  }));

  // -------------------------------------------------------------------------
  // 10. Edge Case: Multiple bookedRide$ emissions
  // -------------------------------------------------------------------------
  it('should handle multiple ride emissions correctly', fakeAsync(() => {
    spyOn(component, 'showConfirmScreenFn');

    bookedRideSubject.next(mockRide);
    tick();
    expect(component.rideId).toBe('ride-123');
    expect(component.showConfirmScreenFn).toHaveBeenCalledTimes(1);

    const newRide = { ...mockRide, rideId: 'ride-456' };
    bookedRideSubject.next(newRide);
    tick();

    expect(component.rideId).toBe('ride-456');
    expect(component.showConfirmScreenFn).toHaveBeenCalledTimes(2);
  }));
});