import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { CarSelectionComponent } from './car-selection.component';
import { RideFormStateService } from '../../services/ride-form-state.service';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../auth/services/auth.service';
import { InternetUtils } from '../../../../core/utils/InternetUtils';
import { RIDE_REPOSITORY_TOKEN, RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { CarFare } from '../../models/CarFair';
import { RideFormData } from '../../models/RideFormData';
import { Location } from '../../models/Locations';

// === MOCKS ===
class MockRideRepository {}
class MockMessageService {
  sendMessage = jasmine.createSpy('sendMessage');
}
class MockAuthService {
  getUserId = jasmine.createSpy('getUserId').and.returnValue('user-123');
}

// === MOCK DATA ===
const createValidLocation = (): Location => {
  const loc = new Location();
  loc.pickupLocation = 'Pickup Area';
  loc.dropLocation = 'Drop Area';
  return loc;
};

const createValidRideFormData = (): RideFormData => {
  const formData = new RideFormData();
  formData.setLocation(createValidLocation());
  return formData;
};

describe('CarSelectionComponent', () => {
  let component: CarSelectionComponent;
  let fixture: ComponentFixture<CarSelectionComponent>;

  let mockRideBookingService: any;
  let mockMessageService: MockMessageService;
  let mockAuthService: MockAuthService;
  let mockRideFormStateService: any;

  const mockCarFares: CarFare[] = [
    { id: '1', type: 'MINI', pricePerKm: 12, finalPrice: 120 },
    { id: '2', type: 'PRIME_SEDAN', pricePerKm: 25, finalPrice: 250 },
    { id: '3', type: 'SUV', pricePerKm: 35, finalPrice: 350 }
  ];

  // Shared subject to control bookRide emission
  let bookRideSubject = new Subject<boolean>();

  beforeEach(async () => {
    const validRideFormData = createValidRideFormData();

    await TestBed.configureTestingModule({
      declarations: [CarSelectionComponent],
      providers: [
        { provide: RIDE_REPOSITORY_TOKEN, useClass: MockRideRepository },
        {
          provide: RIDE_BOOKING_SERVICE_TOKEN,
          useValue: {
            loadCarFares: jasmine.createSpy('loadCarFares').and.returnValue(of([])),
            bookRide: jasmine.createSpy('bookRide').and.returnValue(bookRideSubject.asObservable())
          }
        },
        {
          provide: RideFormStateService,
          useValue: {
            getCurrentFormData: jasmine.createSpy('getCurrentFormData').and.returnValue(validRideFormData),
            getDistance: jasmine.createSpy('getDistance').and.returnValue(10),
            setSelectedCarFare: jasmine.createSpy('setSelectedCarFare')
          }
        },
        { provide: MessageService, useClass: MockMessageService },
        { provide: AuthService, useClass: MockAuthService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CarSelectionComponent);
    component = fixture.componentInstance;

    mockRideBookingService = TestBed.inject(RIDE_BOOKING_SERVICE_TOKEN);
    mockMessageService = TestBed.inject(MessageService) as any;
    mockAuthService = TestBed.inject(AuthService) as any;
    mockRideFormStateService = TestBed.inject(RideFormStateService);

    // Reset subject and spies
    bookRideSubject = new Subject<boolean>();
    mockRideBookingService.loadCarFares.calls.reset();
    mockRideBookingService.bookRide.calls.reset();

    // Spy once per suite
    spyOn(InternetUtils, 'IsOnline').and.returnValue(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form data and distance when distance > 0', () => {
      component.ngOnInit();
      expect(mockRideFormStateService.getCurrentFormData).toHaveBeenCalled();
      expect(mockRideFormStateService.getDistance).toHaveBeenCalled();
      expect(mockRideBookingService.loadCarFares).toHaveBeenCalled();
    });

    it('should NOT load car fares if distance is 0', () => {
      mockRideFormStateService.getDistance.and.returnValue(0);
      component.ngOnInit();
      expect(mockRideBookingService.loadCarFares).not.toHaveBeenCalled();
    });
  });

  describe('loadCarFares', () => {
    it('should load car fares and update carsFairModels on success', fakeAsync(() => {
      mockRideBookingService.loadCarFares.and.returnValue(of(mockCarFares));
      component.loadCarFares();
      tick();
      expect(component.carsFairModels).toEqual(mockCarFares);
      expect(component.showTryAgainButton).toBeFalse();
    }));

    it('should show try again button on error', fakeAsync(() => {
      mockRideBookingService.loadCarFares.and.returnValue(throwError(() => new Error('API Error')));
      component.loadCarFares();
      tick();
      expect(component.showTryAgainButton).toBeTrue();
    }));
  });

  describe('onCardClick', () => {
    it('should select a car when clicked', () => {
      const car = mockCarFares[0];
      component.onCardClick(car);
      expect(component.selectedCar).toBe(car);
    });

    it('should deselect same car when clicked again', () => {
      const car = mockCarFares[0];
      component.onCardClick(car);
      component.onCardClick(car);
      expect(component.selectedCar).toBeNull();
    });
  });

  describe('confirmCarSelection', () => {
    beforeEach(() => {
      component.selectedCar = mockCarFares[0];
    });

    it('should show error if no car is selected', () => {
      component.selectedCar = null;
      component.confirmCarSelection();
      expect(mockMessageService.sendMessage)
        .toHaveBeenCalledWith('error', 'Please select a car before confirming.');
    });

    it('should book ride when online and user is logged in', fakeAsync(() => {
      const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      let subscriptionSet = false;

      mockRideBookingService.bookRide.and.returnValue(
        of(true).pipe(
          tap(() => {
            // Simulate component assigning subscription
            component['bookingStateSubscription'] = mockSub;
            subscriptionSet = true;
          })
        )
      );

      component.confirmCarSelection();
      tick();

      expect(subscriptionSet).toBeTrue();
      expect(mockRideFormStateService.setSelectedCarFare).toHaveBeenCalledWith(mockCarFares[0]);
      expect(mockRideBookingService.bookRide).toHaveBeenCalled();
      expect(mockSub.unsubscribe).toHaveBeenCalled();
    }));

    it('should show login error if user not logged in', () => {
      mockAuthService.getUserId.and.returnValue(null);
      component.confirmCarSelection();
      expect(component.errorMessage()).toBe('Login First!');
    });

    it('should show offline error if internet is down', () => {
      // Override spy safely
      (InternetUtils.IsOnline as jasmine.Spy).and.returnValue(false);
      component.confirmCarSelection();
      expect(component.errorMessage()).toBe('You are Offline');
    });

    it('should show booking error if bookRide fails', fakeAsync(() => {
      mockRideBookingService.bookRide.and.returnValue(throwError(() => new Error('Booking failed')));
      component.confirmCarSelection();
      tick();
      expect(mockMessageService.sendMessage)
        .toHaveBeenCalledWith('error', 'Sorry! Try again to book.');
    }));
  });

  describe('Utility Methods', () => {
    it('should return correct icon path for known car type', () => {
      expect(component.getCarIconPath('mini')).toBe('icons/Mini.svg');
      expect(component.getCarIconPath('PRIME SEDAN')).toBe('icons/Prime Sedan.svg');
    });

    it('should fallback to MINI icon for unknown type', () => {
      expect(component.getCarIconPath('UNKNOWN')).toBe('icons/Mini.svg');
    });

    it('should return correct description', () => {
      expect(component.getCarDescription('mini')).toBe('Budget-friendly & Quick');
      expect(component.getCarDescription('LUXURY')).toBe('Luxury Experience');
    });

    it('should return default description for unknown type', () => {
      expect(component.getCarDescription('TANK')).toBe('Comfortable & Reliable');
    });

    it('should return correct category', () => {
      expect(component.getCarCategory('mini')).toBe('Economy');
      expect(component.getCarCategory('PRIME_SUV')).toBe('Premium');
    });

    it('should return correct badge color class', () => {
      expect(component.getCategoryColorClass('mini')).toBe('badge-economy');
      expect(component.getCategoryColorClass('LUXURY')).toBe('badge-luxury');
      expect(component.getCategoryColorClass('UNKNOWN')).toBe('badge-standard');
    });
  });

  describe('trackByCarId', () => {
    it('should return car id for trackBy', () => {
      const car = { id: '123' } as CarFare;
      expect(component.trackByCarId(0, car)).toBe('123');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from booking subscription', () => {
      const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component['bookingStateSubscription'] = mockSub;
      component.ngOnDestroy();
      expect(mockSub.unsubscribe).toHaveBeenCalled();
    });

    it('should not throw if no subscription', () => {
      component['bookingStateSubscription'] = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('errorMessage signal effect', () => {
    it('should trigger snackbar when errorMessage is set', () => {
      component.errorMessage.set('Test error');
      fixture.detectChanges();
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', 'Test error');
    });
  });
});