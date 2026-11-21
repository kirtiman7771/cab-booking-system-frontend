import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ConfirmedRideScreenComponent } from './confirmed-ride-screen.component';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { RideStatus } from '../../models/RideStatus';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ConfirmedRideScreenComponent', () => {
  let component: ConfirmedRideScreenComponent;
  let fixture: ComponentFixture<ConfirmedRideScreenComponent>;
  let rideStatusSubject: Subject<RideStatus>;
  let rideBookingServiceSpy: jasmine.SpyObj<IRideBookingService>;
  let routerStub: Partial<Router>;

  beforeEach(async () => {
    rideStatusSubject = new Subject<RideStatus>();
    rideBookingServiceSpy = jasmine.createSpyObj<IRideBookingService>('IRideBookingService', ['getRideStatus']);
    rideBookingServiceSpy.getRideStatus.and.returnValue(rideStatusSubject.asObservable());

    routerStub = { navigate: jasmine.createSpy('navigate') };

    await TestBed.configureTestingModule({
      declarations: [ConfirmedRideScreenComponent],
      providers: [
        { provide: RIDE_BOOKING_SERVICE_TOKEN, useValue: rideBookingServiceSpy },
        { provide: Router, useValue: routerStub }
      ],
      // Ignore unknown elements like <app-ride-details> in the component template
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmedRideScreenComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Ensure we don't leak subjects between tests
    rideStatusSubject.complete();
  });

  // Helper to emit status and allow Angular/reactive work to complete
  function emitStatusAndFlush(status: RideStatus) {
    rideStatusSubject.next(status);
    // allow synchronous subscription and signal/effect propagation
    fixture.detectChanges();
    // microtask queue - ensure any synchronous microtasks are processed
    tick(0);
    // detect changes again after microtasks
    fixture.detectChanges();
  }

  it('should create the component', fakeAsync(() => {
    component.rideId = 'ride-initial';
    fixture.detectChanges();
    tick(0);
    expect(component).toBeTruthy();
  }));

  it('should call getRideStatus with the provided rideId on init', fakeAsync(() => {
    component.rideId = 'ride-123';
    fixture.detectChanges(); // triggers ngOnInit
    tick(0);
    expect(rideBookingServiceSpy.getRideStatus).toHaveBeenCalledWith('ride-123');
  }));

  it('should set rideStatus signal when service emits', fakeAsync(() => {
    component.rideId = 'ride-1';
    fixture.detectChanges();
    emitStatusAndFlush(RideStatus.ConfirmedByDriver);
    expect(component.rideStatus()).toBe(RideStatus.ConfirmedByDriver);
  }));

  it('should show confirmation immediately when status is ConfirmedByDriver and hide after 3s', fakeAsync(() => {
    component.rideId = 'ride-2';
    fixture.detectChanges();

    // Emit confirmed and flush microtasks
    emitStatusAndFlush(RideStatus.ConfirmedByDriver);

    // effect runs synchronously, showConfirmation should be true immediately
    expect(component.showConfirmation).toBeTrue();

    // before 3000ms it remains true
    tick(2999);
    expect(component.showConfirmation).toBeTrue();

    // after total 3000ms it should be hidden (assuming not cancelled)
    tick(1);
    expect(component.showConfirmation).toBeFalse();
  }));

  it('should NOT show confirmation if status is CancelledByUser', fakeAsync(() => {
    component.rideId = 'ride-cancel-1';
    fixture.detectChanges();

    emitStatusAndFlush(RideStatus.CancelledByUser);
    expect(component.showConfirmation).toBeFalse();

    // ensure no scheduled timeout will re-show it
    tick(3000);
    expect(component.showConfirmation).toBeFalse();
  }));

  it('should hide immediately when cancelled during the 3s timeout (Confirmed -> CancelledByUser)', fakeAsync(() => {
    component.rideId = 'ride-3';
    fixture.detectChanges();

    // Confirm -> schedules hide after 3s
    emitStatusAndFlush(RideStatus.ConfirmedByDriver);
    expect(component.showConfirmation).toBeTrue();

    // Cancel before timeout completes
    emitStatusAndFlush(RideStatus.CancelledByUser);
    // effect should hide immediately
    expect(component.showConfirmation).toBeFalse();

    // after timeout passes, it must still be false
    tick(3000);
    expect(component.showConfirmation).toBeFalse();
  }));

  it('should hide after timeout even if status changes to a non-cancel value (Confirmed -> Ongoing)', fakeAsync(() => {
    component.rideId = 'ride-4';
    fixture.detectChanges();

    // Confirm -> show true and schedule hide
    emitStatusAndFlush(RideStatus.ConfirmedByDriver);
    expect(component.showConfirmation).toBeTrue();

    // Change to Ongoing before timeout; should not cancel the scheduled hide
    emitStatusAndFlush(RideStatus.Ongoing);
    // still true until timeout
    tick(3000);
    expect(component.showConfirmation).toBeFalse();
  }));

  it('should remain hidden for CancelledByDriver emitted after Confirmed', fakeAsync(() => {
    component.rideId = 'ride-5';
    fixture.detectChanges();

    // Confirm first
    emitStatusAndFlush(RideStatus.ConfirmedByDriver);
    expect(component.showConfirmation).toBeTrue();

    // Cancelled by driver during timeout
    emitStatusAndFlush(RideStatus.CancelledByDriver);
    expect(component.showConfirmation).toBeFalse();

    tick(3000);
    expect(component.showConfirmation).toBeFalse();
  }));

  it('should start with LookingForDriver and not show confirmation', fakeAsync(() => {
    component.rideId = 'ride-initial';
    fixture.detectChanges();

    emitStatusAndFlush(RideStatus.LookingForDriver);
    expect(component.rideStatus()).toBe(RideStatus.LookingForDriver);
    expect(component.showConfirmation).toBeFalse();
  }));
});