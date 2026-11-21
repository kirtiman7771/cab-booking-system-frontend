import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CarFare } from '../../models/CarFair';
import { DriverResponseDTO } from '../../models/DriverApiResponse';
import { DriverDetails } from '../../models/DriverDetails';
import { Ride } from '../../models/Ride';
import { RidePayload } from '../../models/RidePayload';
import { RideStatus } from '../../models/RideStatus';
import { RideFormStateService } from '../ride-form-state.service';
import { RideWebSocketService } from '../ride-websocket.service';
import { SpringBootApiService } from './spring-boot-api.service';

describe('RideBookingService', () => {
  let service: SpringBootApiService;
  let httpMock: HttpTestingController;
  let mockWebSocketService: jasmine.SpyObj<RideWebSocketService>;
  let mockRideFormStateService: jasmine.SpyObj<RideFormStateService>;

  const mockCarFares: CarFare[] = [
    { id: '1', type: 'Economy', pricePerKm: 10, finalPrice: 50 },
    { id: '2', type: 'Premium', pricePerKm: 15, finalPrice: 75 }
  ];

  const mockRide: Ride = {
    rideId: 'ride-123',
    userId: 'user-123',
    driverId: 'driver-123',
    carType: 'Economy',
    pickupLocation: 'Location A',
    dropLocation: 'Location B',
    fare: 50,
    status: RideStatus.LookingForDriver,
    dateTime: new Date()
  };

  const mockDriverResponse: DriverResponseDTO = {
    id: 'driver-123',
    name: 'John Doe',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-02',
    personalDetails: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01'
    },
    driverDetails: {
      licenseNumber: 'LIC123456'
    },
    vehicleDetails: {
      vehicleNumber: 'ABC123',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleYear: 2020,
      vehicleColor: 'Black'
    },
    bankingDetails: {
      bankName: 'Sample Bank'
    }
  };

  const mockDriverDetails: DriverDetails = {
    name: 'John Doe',
    phone: '+1234567890',
    vehicleInfo: 'Camry (ABC123)'
  };

  beforeEach(() => {
    const webSocketSpy = jasmine.createSpyObj('RideWebSocketService', [
      'subscribeToRideUpdates'
    ]);
    
    const formStateSpy = jasmine.createSpyObj('RideFormStateService', [
      'getCurrentFormData',
      'setDistance',
      'setLocation',
      'setSelectedCarFare',
      'updateRideFormData',
      'resetState'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SpringBootApiService,
        { provide: RideWebSocketService, useValue: webSocketSpy },
        { provide: RideFormStateService, useValue: formStateSpy }
      ]
    });

    service = TestBed.inject(SpringBootApiService);
    httpMock = TestBed.inject(HttpTestingController);
    mockWebSocketService = TestBed.inject(RideWebSocketService) as jasmine.SpyObj<RideWebSocketService>;
    mockRideFormStateService = TestBed.inject(RideFormStateService) as jasmine.SpyObj<RideFormStateService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Car Fare Operations', () => {
    it('should fetch car fares successfully', () => {
      service.getCarFares().subscribe(fares => {
        expect(fares).toEqual(mockCarFares);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/get-car-fares`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCarFares);
    });

    it('should handle error when fetching car fares fails', () => {
      const errorResponse = { status: 500, statusText: 'Server Error' };

      service.getCarFares().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/get-car-fares`);
      req.flush('Error', errorResponse);
    });
  });

  describe('Ride Operations', () => {
    it('should book a ride successfully', () => {
      const ridePayload: RidePayload = {
        userId: 'user-123',
        pickupLocation: 'Location A',
        dropLocation: 'Location B',
        fare: 50,
        status: RideStatus.LookingForDriver
      };

      service.bookRide(ridePayload).subscribe(ride => {
        expect(ride).toEqual(mockRide);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/book`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(ridePayload);
      req.flush(mockRide);
    });

    it('should get user rides successfully', () => {
      const userId = 'user-123';
      const mockRides: Ride[] = [mockRide];

      service.getUserRides(userId).subscribe(rides => {
        expect(rides).toEqual(mockRides);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRides);
    });

    it('should get ride by ID with WebSocket updates', () => {
      const rideId = 'ride-123';
      const mockWebSocketUpdates = of(mockRide);
      
      mockWebSocketService.subscribeToRideUpdates.and.returnValue(mockWebSocketUpdates);

      let callCount = 0;
      service.getRideById(rideId).subscribe(ride => {
        callCount++;
        // First call from HTTP, second from WebSocket
        if (callCount === 1) {
          expect(ride).toEqual(mockRide);
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/ride/${rideId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRide);

      expect(mockWebSocketService.subscribeToRideUpdates).toHaveBeenCalledWith(rideId);
    });

    it('should handle error when getting ride by ID fails', () => {
      const rideId = 'ride-123';
      // Return an empty observable for WebSocket to simulate no updates
      const mockWebSocketUpdates = of();
      
      mockWebSocketService.subscribeToRideUpdates.and.returnValue(mockWebSocketUpdates);

      const results: (Ride | null)[] = [];
      service.getRideById(rideId).subscribe(ride => {
        results.push(ride);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/ride/${rideId}`);
      req.flush('Error', { status: 404, statusText: 'Not Found' });

      // Should only receive null from the error handler
      expect(results).toEqual([null]);
    });
  });

  describe('Ride Status Operations', () => {
    it('should start a ride', () => {
      const rideId = 'ride-123';

      service.startRide(rideId).subscribe(ride => {
        expect(ride).toEqual(mockRide);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: RideStatus.Ongoing });
      req.flush(mockRide);
    });

    it('should update ride status', () => {
      const rideId = 'ride-123';
      const newStatus = RideStatus.Completed;

      service.updateRideStatus(rideId, newStatus).subscribe(ride => {
        expect(ride).toEqual(mockRide);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: newStatus });
      req.flush(mockRide);
    });

    it('should get ride status', () => {
      const rideId = 'ride-123';
      spyOn(service, 'getRideById').and.returnValue(of(mockRide));

      service.getRideStatus(rideId).subscribe(status => {
        expect(status).toBe(RideStatus.LookingForDriver);
      });
    });

    it('should return null when getting status of non-existent ride', () => {
      const rideId = 'non-existent-ride';
      spyOn(service, 'getRideById').and.returnValue(of(null));

      service.getRideStatus(rideId).subscribe(status => {
        expect(status).toBeNull();
      });
    });
  });

  describe('Driver Operations', () => {
    it('should get driver details by ID', () => {
      const driverId = 'driver-123';

      service.getDriverDetailsById(driverId).subscribe(details => {
        expect(details).toEqual(mockDriverDetails);
      });

      const req = httpMock.expectOne(`${service['baseUrlForDriver']}/api/drivers/profile/${driverId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDriverResponse);
    });

    it('should map driver response to driver details correctly', () => {
      const result = service.mapDriverResponseToDriverDetails(mockDriverResponse);
      
      expect(result.name).toBe('John Doe');
      expect(result.phone).toBe('+1234567890');
      expect(result.vehicleInfo).toBe('Camry (ABC123)');
    });

    it('should handle missing driver details in mapping', () => {
      const incompleteResponse: DriverResponseDTO = {
        ...mockDriverResponse,
        personalDetails: { ...mockDriverResponse.personalDetails, phone: undefined },
        vehicleDetails: undefined
      };

      const result = service.mapDriverResponseToDriverDetails(incompleteResponse);
      
      expect(result.name).toBe('John Doe');
      expect(result.phone).toBe('N/A');
      expect(result.vehicleInfo).toBe('Vehicle details unavailable');
    });

    it('should assign driver to ride', () => {
      const rideId = 'ride-123';
      const driverId = 'driver-123';

      service.assignDriver(rideId, driverId).subscribe(ride => {
        expect(ride).toEqual(mockRide);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ driverId: driverId });
      req.flush(mockRide);
    });
  });

  describe('Cancellation Operations', () => {
    it('should cancel ride by user', () => {
      const rideId = 'ride-123';

      service.cancelRideByUser(rideId).subscribe(ride => {
        expect(ride).toEqual(mockRide);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: RideStatus.CancelledByUser });
      req.flush(mockRide);
    });

    it('should cancel ride by driver', () => {
      const rideId = 'ride-123';

      service.cancelRideByDriver(rideId).subscribe(ride => {
        expect(ride).toEqual(mockRide);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ 
        driverId: null, 
        status: RideStatus.CancelledByDriver 
      });
      req.flush(mockRide);
    });
  });

  describe('Completion Operations', () => {
    it('should mark ride as completed', () => {
      const rideId = 'ride-123';

      service.markRideAsCompleted(rideId).subscribe(ride => {
        expect(ride).toEqual(mockRide);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: RideStatus.Completed });
      req.flush(mockRide);
    });
  });

  describe('Upcoming Rides Operations', () => {
    it('should get upcoming rides for user', () => {
      const userId = 'user-123';
      const mockUpcomingRides: Ride[] = [mockRide];

      service.getUpcomingRidesForUser(userId).subscribe(rides => {
        expect(rides).toEqual(mockUpcomingRides);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/upcoming-ride/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUpcomingRides);
    });

    it('should get upcoming rides for driver', () => {
      const driverId = 'driver-123';
      const mockUpcomingRides: Ride[] = [mockRide];

      service.getUpcomingRidesForDriver(driverId).subscribe(rides => {
        expect(rides).toEqual(mockUpcomingRides);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/driver/upcoming-ride/${driverId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUpcomingRides);
    });
  });

  describe('Validation Operations', () => {
    it('should check if user has two active rides', () => {
      const userId = 'user-123';

      service.hasTwoActiveRides(userId).subscribe(hasTwoRides => {
        expect(hasTwoRides).toBe(true);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/has-two-rides/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });
  });

  describe('Unassigned Rides Operations', () => {
    it('should get unassigned rides', () => {
      const mockUnassignedRides: Ride[] = [mockRide];

      service.getUnassignedRides().subscribe(rides => {
        expect(rides).toEqual(mockUnassignedRides);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/driver/unassigned-ride`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUnassignedRides);
    });
  });

  describe('Update Ride Operations', () => {
    it('should update ride with partial data', () => {
      const rideId = 'ride-123';
      const updateData: Partial<Ride> = { fare: 60 };

      service.updateRide(rideId, updateData).subscribe(ride => {
        expect(ride).toEqual(mockRide);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockRide);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully for getRideById', () => {
      const rideId = 'ride-123';
      // Use empty observable for WebSocket to avoid interference
      mockWebSocketService.subscribeToRideUpdates.and.returnValue(of());

      service.getRideById(rideId).subscribe({
        next: (ride) => {
          // Should receive null when HTTP request fails
          expect(ride).toBeNull();
        },
        error: (error) => {
          // Should not reach here due to catchError
          fail('Expected successful null emission, not error');
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/ride/${rideId}`);
      // Use flush with error status instead of req.error()
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 404 errors for non-existent resources', () => {
      const nonExistentId = 'non-existent';

      service.getDriverDetailsById(nonExistentId).subscribe({
        next: () => fail('Expected to fail'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${service['baseUrlForDriver']}/api/drivers/profile/${nonExistentId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors for car fares', () => {
      service.getCarFares().subscribe({
        next: () => fail('Expected to fail'),
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/rider/get-car-fares`);
      // Simulate network error
      req.error(new ProgressEvent('Network error'));
    });
  });
});