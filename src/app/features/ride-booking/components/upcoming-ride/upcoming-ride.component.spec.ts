import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UpcomingRideComponent } from './upcoming-ride.component';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { AuthService } from '../../../auth/services/auth.service';
import { of, throwError } from 'rxjs';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';

describe('UpcomingRideComponent', () => {
  let component: UpcomingRideComponent;
  let fixture: ComponentFixture<UpcomingRideComponent>;
  let mockRideBookingService: jasmine.SpyObj<IRideBookingService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockUpcomingRides: Ride[] = [
    {
      id: '1',
      rideId: 'RIDE001',
      userId: 'user1',
      driverId: 'driver1',
      carType: 'Sedan',
      pickupLocation: 'Location A',
      dropLocation: 'Location B',
      fare: 150,
      status: RideStatus.ConfirmedByDriver,
      dateTime: new Date('2025-11-10T10:00:00')
    },
    {
      id: '2',
      rideId: 'RIDE002',
      userId: 'user1',
      driverId: 'driver2',
      carType: 'SUV',
      pickupLocation: 'Location C',
      dropLocation: 'Location D',
      fare: 250,
      status: RideStatus.Ongoing,
      dateTime: new Date('2025-11-10T12:00:00')
    }
  ];

  beforeEach(async () => {
    mockRideBookingService = jasmine.createSpyObj('IRideBookingService', [
      'getUpcomingRidesForUser',
      'cancelRideByUser'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);

    await TestBed.configureTestingModule({
      declarations: [UpcomingRideComponent],
      providers: [
        { provide: RIDE_BOOKING_SERVICE_TOKEN, useValue: mockRideBookingService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingRideComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty upcomingRides array', () => {
      expect(component.upcomingRides).toEqual([]);
    });

    it('should initialize loading as true', () => {
      expect(component.loading).toBe(true);
    });

    it('should call fetchUpcomingRides on ngOnInit', () => {
      spyOn(component, 'fetchUpcomingRides');
      component.ngOnInit();
      expect(component.fetchUpcomingRides).toHaveBeenCalled();
    });

    it('should subscribe to rideUpdate$ on ngOnInit', fakeAsync(() => {
      mockAuthService.getUserId.and.returnValue('user1');
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(mockUpcomingRides));
      
      component.ngOnInit();
      const initialCallCount = mockRideBookingService.getUpcomingRidesForUser.calls.count();
      
      component['rideUpdate$'].next();
      tick();
      
      expect(mockRideBookingService.getUpcomingRidesForUser.calls.count()).toBe(initialCallCount + 1);
    }));
  });

  describe('fetchUpcomingRides - Success Cases', () => {
    beforeEach(() => {
      mockAuthService.getUserId.and.returnValue('user1');
    });

    it('should fetch upcoming rides successfully', () => {
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(mockUpcomingRides));
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForUser).toHaveBeenCalledWith('user1');
      expect(component.upcomingRides).toEqual(mockUpcomingRides);
      expect(component.upcomingRides.length).toBe(2);
      expect(component.loading).toBe(false);
    });

    it('should set loading to true before fetching', () => {
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(mockUpcomingRides));
      component.loading = false;
      
      component.fetchUpcomingRides();

      expect(component.loading).toBe(false); // After completion
    });

    it('should handle empty upcoming rides array', () => {
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of([]));
      
      component.fetchUpcomingRides();

      expect(component.upcomingRides).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should update upcomingRides with fetched data', () => {
      const newRides: Ride[] = [mockUpcomingRides[0]];
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(newRides));
      
      component.fetchUpcomingRides();

      expect(component.upcomingRides).toEqual(newRides);
      expect(component.upcomingRides[0].status).toBe(RideStatus.ConfirmedByDriver);
    });

    it('should handle rides with different statuses', () => {
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(mockUpcomingRides));
      
      component.fetchUpcomingRides();

      expect(component.upcomingRides[0].status).toBe(RideStatus.ConfirmedByDriver);
      expect(component.upcomingRides[1].status).toBe(RideStatus.Ongoing);
    });
  });

  describe('fetchUpcomingRides - Null/Invalid UserId Cases', () => {
    it('should set loading to false when userId is null', () => {
      mockAuthService.getUserId.and.returnValue(null);
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForUser).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
      expect(component.upcomingRides).toEqual([]);
    });

    it('should not fetch rides when userId is undefined', () => {
      mockAuthService.getUserId.and.returnValue(undefined as any);
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForUser).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

  });

  describe('fetchUpcomingRides - Error Handling', () => {
    beforeEach(() => {
      mockAuthService.getUserId.and.returnValue('user1');
    });

    it('should handle error when fetching upcoming rides', () => {
      const error = new Error('Failed to fetch rides');
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(throwError(() => error));
      spyOn(console, 'error');
      
      component.fetchUpcomingRides();

      expect(console.error).toHaveBeenCalledWith('Failed to fetch upcoming rides:', error);
      expect(component.loading).toBe(false);
      expect(component.upcomingRides).toEqual([]);
    });

    it('should handle network error', () => {
      const networkError = { status: 0, message: 'Network error' };
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(throwError(() => networkError));
      spyOn(console, 'error');
      
      component.fetchUpcomingRides();

      expect(console.error).toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should handle 404 error', () => {
      const notFoundError = { status: 404, message: 'Not found' };
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(throwError(() => notFoundError));
      spyOn(console, 'error');
      
      component.fetchUpcomingRides();

      expect(console.error).toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      mockAuthService.getUserId.and.returnValue('user1');
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(mockUpcomingRides));
      
      component.ngOnInit();
      spyOn(component['subscriptions'], 'unsubscribe');
      
      component.ngOnDestroy();

      expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });

    it('should prevent memory leaks', () => {
      mockAuthService.getUserId.and.returnValue('user1');
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(mockUpcomingRides));
      
      component.ngOnInit();
      component.ngOnDestroy();

      expect(component['subscriptions'].closed).toBe(true);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle multiple consecutive fetchUpcomingRides calls', () => {
      mockAuthService.getUserId.and.returnValue('user1');
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(mockUpcomingRides));
      
      component.fetchUpcomingRides();
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForUser).toHaveBeenCalledTimes(2);
    });

    it('should update rides on rideUpdate$ emission', fakeAsync(() => {
      mockAuthService.getUserId.and.returnValue('user1');
      const firstRides = [mockUpcomingRides[0]];
      const secondRides = mockUpcomingRides;
      
      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(firstRides));
      component.ngOnInit();
      tick();
      expect(component.upcomingRides.length).toBe(1);

      mockRideBookingService.getUpcomingRidesForUser.and.returnValue(of(secondRides));
      component['rideUpdate$'].next();
      tick();
      
      expect(component.upcomingRides.length).toBe(2);
    }));
  });
});