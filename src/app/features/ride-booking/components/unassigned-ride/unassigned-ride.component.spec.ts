import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnassignedRidesComponent } from './unassigned-ride.component';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { AuthService } from '../../../auth/services/auth.service';
import { MessageService } from '../../../../core/services/message.service';
import { of, throwError } from 'rxjs';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';

describe('UnassignedRidesComponent', () => {
  let component: UnassignedRidesComponent;
  let fixture: ComponentFixture<UnassignedRidesComponent>;
  let mockRideBookingService: jasmine.SpyObj<IRideBookingService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  const mockUnassignedRides: Ride[] = [
    {
      id: '1',
      rideId: 'RIDE001',
      userId: 'user1',
      pickupLocation: 'Location A',
      dropLocation: 'Location B',
      fare: 150,
      status: RideStatus.LookingForDriver,
      dateTime: new Date('2025-11-10T10:00:00')
    },
    {
      id: '2',
      rideId: 'RIDE002',
      userId: 'user2',
      pickupLocation: 'Location C',
      dropLocation: 'Location D',
      fare: 200,
      status: RideStatus.LookingForDriver,
      dateTime: new Date('2025-11-10T11:00:00')
    }
  ];

  beforeEach(async () => {
    mockRideBookingService = jasmine.createSpyObj('IRideBookingService', [
      'getUnassignedRides',
      'getRideById',
      'cancelRideByUser'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId', 'getUserType']);
    mockMessageService = jasmine.createSpyObj('MessageService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      declarations: [UnassignedRidesComponent],
      providers: [
        { provide: RIDE_BOOKING_SERVICE_TOKEN, useValue: mockRideBookingService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnassignedRidesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty totalRides array', () => {
      expect(component.totalRides).toEqual([]);
    });

    it('should initialize userType as "driver"', () => {
      expect(component.userType).toBe('driver');
    });

    it('should call getTotalRides on ngOnInit', () => {
      spyOn(component, 'getTotalRides');
      component.ngOnInit();
      expect(component.getTotalRides).toHaveBeenCalled();
    });
  });

  describe('getTotalRides - Driver User Type', () => {
    beforeEach(() => {
      localStorage.setItem('userType', 'driver');
    });

    it('should fetch unassigned rides when userType is "driver"', () => {
      mockRideBookingService.getUnassignedRides.and.returnValue(of(mockUnassignedRides));
      
      component.getTotalRides();

      expect(mockRideBookingService.getUnassignedRides).toHaveBeenCalled();
      expect(component.totalRides).toEqual(mockUnassignedRides);
      expect(component.totalRides.length).toBe(2);
    });

    it('should handle empty unassigned rides array', () => {
      mockRideBookingService.getUnassignedRides.and.returnValue(of([]));
      
      component.getTotalRides();

      expect(mockRideBookingService.getUnassignedRides).toHaveBeenCalled();
      expect(component.totalRides).toEqual([]);
      expect(component.totalRides.length).toBe(0);
    });

    it('should update totalRides with fetched data', () => {
      const newRides: Ride[] = [mockUnassignedRides[0]];
      mockRideBookingService.getUnassignedRides.and.returnValue(of(newRides));
      
      component.getTotalRides();

      expect(component.totalRides).toEqual(newRides);
      expect(component.totalRides[0].rideId).toBe('RIDE001');
    });

    it('should retrieve userType from localStorage', () => {
      mockRideBookingService.getUnassignedRides.and.returnValue(of(mockUnassignedRides));
      
      component.getTotalRides();

      expect(component.userType).toBe('driver');
    });
  });

  describe('getTotalRides - Non-Driver User Type', () => {
    it('should not fetch rides when userType is "rider"', () => {
      localStorage.setItem('userType', 'rider');
      
      component.getTotalRides();

      expect(mockRideBookingService.getUnassignedRides).not.toHaveBeenCalled();
      expect(component.totalRides).toEqual([]);
    });

    it('should not fetch rides when userType is null', () => {
      localStorage.removeItem('userType');
      
      component.getTotalRides();

      expect(component.userType).toBeNull();
      expect(mockRideBookingService.getUnassignedRides).not.toHaveBeenCalled();
    });

    it('should not fetch rides when userType is undefined', () => {
      // Don't set userType in localStorage
      component.getTotalRides();

      expect(mockRideBookingService.getUnassignedRides).not.toHaveBeenCalled();
    });

    it('should not fetch rides when userType is empty string', () => {
      localStorage.setItem('userType', '');
      
      component.getTotalRides();

      expect(mockRideBookingService.getUnassignedRides).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      localStorage.setItem('userType', 'driver');
    });

    it('should handle rides with missing optional fields', () => {
      const ridesWithMissingFields: Ride[] = [{
        rideId: 'RIDE003',
        userId: 'user3',
        pickupLocation: 'Location E',
        dropLocation: 'Location F',
        fare: 100,
        status: RideStatus.LookingForDriver,
        dateTime: new Date()
      }];
      
      mockRideBookingService.getUnassignedRides.and.returnValue(of(ridesWithMissingFields));
      
      component.getTotalRides();

      expect(component.totalRides[0].id).toBeUndefined();
      expect(component.totalRides[0].driverId).toBeUndefined();
    });

    it('should handle multiple consecutive calls to getTotalRides', () => {
      mockRideBookingService.getUnassignedRides.and.returnValue(of(mockUnassignedRides));
      
      component.getTotalRides();
      component.getTotalRides();

      expect(mockRideBookingService.getUnassignedRides).toHaveBeenCalledTimes(2);
    });

    it('should update totalRides on subsequent calls', () => {
      const firstRides = [mockUnassignedRides[0]];
      const secondRides = [mockUnassignedRides[1]];
      
      mockRideBookingService.getUnassignedRides.and.returnValue(of(firstRides));
      component.getTotalRides();
      expect(component.totalRides.length).toBe(1);

      mockRideBookingService.getUnassignedRides.and.returnValue(of(secondRides));
      component.getTotalRides();
      expect(component.totalRides.length).toBe(1);
      expect(component.totalRides[0].rideId).toBe('RIDE002');
    });
  });
});