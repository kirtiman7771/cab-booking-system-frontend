import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpcomingRideDriverComponent } from './upcoming-ride-driver.component';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { AuthService } from '../../../auth/services/auth.service';
import { of, throwError } from 'rxjs';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('UpcomingRideDriverComponent', () => {
  let component: UpcomingRideDriverComponent;
  let fixture: ComponentFixture<UpcomingRideDriverComponent>;
  let mockRideBookingService: jasmine.SpyObj<IRideBookingService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockDriverRides: Ride[] = [
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
      userId: 'user2',
      driverId: 'driver1',
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
      'getUpcomingRidesForDriver',
      'assignDriver',
      'startRide'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);

    await TestBed.configureTestingModule({
      declarations: [UpcomingRideDriverComponent],
      providers: [
        { provide: RIDE_BOOKING_SERVICE_TOKEN, useValue: mockRideBookingService },
        { provide: AuthService, useValue: mockAuthService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingRideDriverComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty totalRides array', () => {
      expect(component.totalRides).toEqual([]);
    });

    it('should call fetchUpcomingRides on ngOnInit', () => {
      spyOn(component, 'fetchUpcomingRides');
      component.ngOnInit();
      expect(component.fetchUpcomingRides).toHaveBeenCalled();
    });
  });

  describe('getUserId', () => {
    it('should return userId from authService', () => {
      mockAuthService.getUserId.and.returnValue('driver1');
      
      const result = component.getUserId();

      expect(result).toBe('driver1');
      expect(mockAuthService.getUserId).toHaveBeenCalled();
    });

    it('should return null when userId is not available', () => {
      mockAuthService.getUserId.and.returnValue(null);
      
      const result = component.getUserId();

      expect(result).toBeNull();
    });

    it('should return string userId', () => {
      mockAuthService.getUserId.and.returnValue('driver123');
      
      const result = component.getUserId();

      expect(result).toBe('driver123');
      expect(typeof result).toBe('string');
    });
  });

  describe('fetchUpcomingRides - Success Cases', () => {
    beforeEach(() => {
      mockAuthService.getUserId.and.returnValue('driver1');
    });

    it('should fetch upcoming rides for driver successfully', () => {
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(mockDriverRides));
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForDriver).toHaveBeenCalledWith('driver1');
      expect(component.totalRides).toEqual(mockDriverRides);
      expect(component.totalRides.length).toBe(2);
    });

    it('should handle empty rides array', () => {
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of([]));
      
      component.fetchUpcomingRides();

      expect(component.totalRides).toEqual([]);
      expect(component.totalRides.length).toBe(0);
    });

    it('should update totalRides with fetched data', () => {
      const rides: Ride[] = [mockDriverRides[0]];
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(rides));
      
      component.fetchUpcomingRides();

      expect(component.totalRides).toEqual(rides);
      expect(component.totalRides[0].rideId).toBe('RIDE001');
      expect(component.totalRides[0].driverId).toBe('driver1');
    });

    it('should convert userId to string when calling service', () => {
      mockAuthService.getUserId.and.returnValue('456');
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(mockDriverRides));
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForDriver).toHaveBeenCalledWith('456');
      expect(component.totalRides).toEqual(mockDriverRides);
    });

    it('should handle rides with different statuses', () => {
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(mockDriverRides));
      
      component.fetchUpcomingRides();

      expect(component.totalRides[0].status).toBe(RideStatus.ConfirmedByDriver);
      expect(component.totalRides[1].status).toBe(RideStatus.Ongoing);
    });
  });

  describe('fetchUpcomingRides - Null/Invalid UserId Cases', () => {
    it('should not fetch rides when userId is null', () => {
      mockAuthService.getUserId.and.returnValue(null);
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForDriver).not.toHaveBeenCalled();
      expect(component.totalRides).toEqual([]);
    });

    it('should not fetch rides when userId is undefined', () => {
      mockAuthService.getUserId.and.returnValue(undefined as any);
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForDriver).not.toHaveBeenCalled();
      expect(component.totalRides).toEqual([]);
    });

    it('should not fetch rides when userId is empty string', () => {
      mockAuthService.getUserId.and.returnValue('');
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForDriver).not.toHaveBeenCalled();
      expect(component.totalRides).toEqual([]);
    });
  });

  describe('Service Integration', () => {
    beforeEach(() => {
      mockAuthService.getUserId.and.returnValue('driver1');
    });

    it('should call getUpcomingRidesForDriver with correct driverId', () => {
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(mockDriverRides));
      
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForDriver).toHaveBeenCalledWith('driver1');
      expect(mockRideBookingService.getUpcomingRidesForDriver).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to the observable returned by service', () => {
      const subscribeSpy = jasmine.createSpy('subscribe');
      const observable = of(mockDriverRides);
      spyOn(observable, 'subscribe').and.callThrough();
      
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(observable);
      
      component.fetchUpcomingRides();

      expect(observable.subscribe).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle multiple consecutive fetchUpcomingRides calls', () => {
      mockAuthService.getUserId.and.returnValue('driver1');
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(mockDriverRides));
      
      component.fetchUpcomingRides();
      component.fetchUpcomingRides();

      expect(mockRideBookingService.getUpcomingRidesForDriver).toHaveBeenCalledTimes(2);
    });

    it('should override previous rides on new fetch', () => {
      mockAuthService.getUserId.and.returnValue('driver1');
      const firstRides = [mockDriverRides[0]];
      const secondRides = [mockDriverRides[1]];
      
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(firstRides));
      component.fetchUpcomingRides();
      expect(component.totalRides.length).toBe(1);
      expect(component.totalRides[0].rideId).toBe('RIDE001');

      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(secondRides));
      component.fetchUpcomingRides();
      expect(component.totalRides.length).toBe(1);
      expect(component.totalRides[0].rideId).toBe('RIDE002');
    });

    it('should handle rides with missing optional fields', () => {
      const ridesWithMissingFields: Ride[] = [{
        rideId: 'RIDE003',
        userId: 'user3',
        driverId: 'driver1',
        pickupLocation: 'Location E',
        dropLocation: 'Location F',
        fare: 100,
        status: RideStatus.ConfirmedByDriver,
        dateTime: new Date()
      }];
      
      mockAuthService.getUserId.and.returnValue('driver1');
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(ridesWithMissingFields));
      
      component.fetchUpcomingRides();

      expect(component.totalRides[0].id).toBeUndefined();
      expect(component.totalRides[0].carType).toBeUndefined();
    });

    it('should handle userId change between calls', () => {
      mockAuthService.getUserId.and.returnValue('driver1');
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of([mockDriverRides[0]]));
      component.fetchUpcomingRides();
      expect(mockRideBookingService.getUpcomingRidesForDriver).toHaveBeenCalledWith('driver1');

      mockAuthService.getUserId.and.returnValue('driver2');
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of([mockDriverRides[1]]));
      component.fetchUpcomingRides();
      expect(mockRideBookingService.getUpcomingRidesForDriver).toHaveBeenCalledWith('driver2');
    });

    it('should handle large number of rides', () => {
      const largeRideArray: Ride[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        rideId: `RIDE${i}`,
        userId: `user${i}`,
        driverId: 'driver1',
        pickupLocation: `Location ${i}`,
        dropLocation: `Destination ${i}`,
        fare: 100 + i,
        status: RideStatus.ConfirmedByDriver,
        dateTime: new Date()
      }));
      
      mockAuthService.getUserId.and.returnValue('driver1');
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(largeRideArray));
      
      component.fetchUpcomingRides();

      expect(component.totalRides.length).toBe(100);
      expect(component.totalRides[0].rideId).toBe('RIDE0');
      expect(component.totalRides[99].rideId).toBe('RIDE99');
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch rides immediately on initialization', () => {
      mockAuthService.getUserId.and.returnValue('driver1');
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(mockDriverRides));
      
      component.ngOnInit();

      expect(mockRideBookingService.getUpcomingRidesForDriver).toHaveBeenCalled();
      expect(component.totalRides).toEqual(mockDriverRides);
    });

    it('should not fetch rides if userId is not available on initialization', () => {
      mockAuthService.getUserId.and.returnValue(null);
      
      component.ngOnInit();

      expect(mockRideBookingService.getUpcomingRidesForDriver).not.toHaveBeenCalled();
      expect(component.totalRides).toEqual([]);
    });
  });

  describe('Data Integrity', () => {
    beforeEach(() => {
      mockAuthService.getUserId.and.returnValue('driver1');
    });

    it('should preserve ride data structure', () => {
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(mockDriverRides));
      
      component.fetchUpcomingRides();

      expect(component.totalRides[0]).toEqual(jasmine.objectContaining({
        id: '1',
        rideId: 'RIDE001',
        userId: 'user1',
        driverId: 'driver1',
        carType: 'Sedan',
        pickupLocation: 'Location A',
        dropLocation: 'Location B',
        fare: 150,
        status: RideStatus.ConfirmedByDriver
      }));
    });

    it('should maintain date objects', () => {
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(mockDriverRides));
      
      component.fetchUpcomingRides();

      expect(component.totalRides[0].dateTime).toBeInstanceOf(Date);
      expect(component.totalRides[0].dateTime.getTime()).toBe(new Date('2025-11-10T10:00:00').getTime());
    });

    it('should handle null values in ride data', () => {
      const ridesWithNulls: Ride[] = [{
        rideId: 'RIDE004',
        userId: 'user4',
        driverId: 'driver1',
        pickupLocation: 'Location G',
        dropLocation: 'Location H',
        fare: 0,
        status: RideStatus.ConfirmedByDriver,
        dateTime: new Date()
      }];
      
      mockRideBookingService.getUpcomingRidesForDriver.and.returnValue(of(ridesWithNulls));
      
      component.fetchUpcomingRides();

      expect(component.totalRides[0].fare).toBe(0);
    });
  });
});