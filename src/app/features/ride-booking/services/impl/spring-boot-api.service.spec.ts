// spring-boot-api.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SpringBootApiService } from './spring-boot-api.service';
import { RideWebSocketService } from '../ride-websocket.service';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { CarFare } from '../../models/CarFair';
import { DriverResponseDTO } from '../../models/DriverApiResponse';
import { RidePayload } from '../../models/RidePayload';
import { of, Subject } from 'rxjs';

describe('SpringBootApiService', () => {
  let service: SpringBootApiService;
  let httpMock: HttpTestingController;
  let mockRideWsService: jasmine.SpyObj<RideWebSocketService>;
  
  const baseUrl = 'http://localhost:8080/api/rides';
  const baseUrlForDriver = 'http://localhost:8080';

  beforeEach(() => {
    const rideWsServiceSpy = jasmine.createSpyObj('RideWebSocketService', ['subscribeToRideUpdates']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SpringBootApiService,
        { provide: RideWebSocketService, useValue: rideWsServiceSpy }
      ]
    });

    service = TestBed.inject(SpringBootApiService);
    httpMock = TestBed.inject(HttpTestingController);
    mockRideWsService = TestBed.inject(RideWebSocketService) as jasmine.SpyObj<RideWebSocketService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCarFares', () => {
    it('should fetch car fares', () => {
      const mockCarFares: CarFare[] = [
        { id: '1', type: 'Sedan', pricePerKm: 10, finalPrice: 100 },
        { id: '2', type: 'SUV', pricePerKm: 15, finalPrice: 150 }
      ];

      service.getCarFares().subscribe(fares => {
        expect(fares.length).toBe(2);
        expect(fares).toEqual(mockCarFares);
      });

      const req = httpMock.expectOne(`${baseUrl}/rider/get-car-fares`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCarFares);
    });

    it('should handle empty car fares array', () => {
      service.getCarFares().subscribe(fares => {
        expect(fares.length).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/rider/get-car-fares`);
      req.flush([]);
    });
  });

  describe('getUserRides', () => {
    it('should fetch user rides', () => {
      const userId = 'user123';
      const mockRides: Ride[] = [
        {
          rideId: 'ride1',
          userId: userId,
          pickupLocation: 'Home',
          dropLocation: 'Airport',
          fare: 100,
          status: RideStatus.Completed,
          dateTime: new Date()
        }
      ];

      service.getUserRides(userId).subscribe(rides => {
        expect(rides.length).toBe(1);
        expect(rides[0].userId).toBe(userId);
      });

      const req = httpMock.expectOne(`${baseUrl}/rider/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRides);
    });
  });

  describe('getRideById', () => {
    it('should fetch ride by id and merge with websocket updates', (done) => {
      const rideId = 'ride123';
      const mockRide: Ride = {
        rideId: rideId,
        userId: 'user1',
        pickupLocation: 'Home',
        dropLocation: 'Airport',
        fare: 100,
        status: RideStatus.Ongoing,
        dateTime: new Date()
      };

      // Create a subject that never emits (just for the merge to work)
      const wsSubject = new Subject<Ride>();
      mockRideWsService.subscribeToRideUpdates.and.returnValue(wsSubject.asObservable());

      let emissionCount = 0;
      service.getRideById(rideId).subscribe(ride => {
        emissionCount++;
        if (ride && emissionCount === 1) { // Only check first emission from HTTP
          expect(ride.rideId).toBe(rideId);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/ride/${rideId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRide);
    });

    it('should handle error in initial fetch', (done) => {
      const rideId = 'ride123';
      
      const wsSubject = new Subject<Ride>();
      mockRideWsService.subscribeToRideUpdates.and.returnValue(wsSubject.asObservable());

      let emissionCount = 0;
      service.getRideById(rideId).subscribe(ride => {
        emissionCount++;
        if (emissionCount === 1 && ride === null) {
          expect(ride).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/ride/${rideId}`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should receive websocket updates after initial fetch', (done) => {
      const rideId = 'ride456';
      const initialRide: Ride = {
        rideId: rideId,
        userId: 'user1',
        pickupLocation: 'Home',
        dropLocation: 'Airport',
        fare: 100,
        status: RideStatus.LookingForDriver,
        dateTime: new Date()
      };

      const updatedRide: Ride = {
        ...initialRide,
        status: RideStatus.Ongoing,
        driverId: 'driver1'
      };

      const wsSubject = new Subject<Ride>();
      mockRideWsService.subscribeToRideUpdates.and.returnValue(wsSubject.asObservable());

      let emissionCount = 0;
      service.getRideById(rideId).subscribe(ride => {
        emissionCount++;
        if (emissionCount === 1 && ride) {
          // First emission: HTTP response
          expect(ride.status).toBe(RideStatus.LookingForDriver);
        } else if (emissionCount === 2 && ride) {
          // Second emission: WebSocket update
          expect(ride.status).toBe(RideStatus.Ongoing);
          expect(ride.driverId).toBe('driver1');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/ride/${rideId}`);
      req.flush(initialRide);

      // Simulate WebSocket update after a delay
      setTimeout(() => {
        wsSubject.next(updatedRide);
      }, 100);
    });
  });

  describe('getUnassignedRides', () => {
    it('should fetch unassigned rides', () => {
      const mockRides: Ride[] = [
        {
          rideId: 'ride1',
          userId: 'user1',
          pickupLocation: 'Location A',
          dropLocation: 'Location B',
          fare: 50,
          status: RideStatus.LookingForDriver,
          dateTime: new Date()
        }
      ];

      service.getUnassignedRides().subscribe(rides => {
        expect(rides.length).toBe(1);
        expect(rides[0].status).toBe(RideStatus.LookingForDriver);
      });

      const req = httpMock.expectOne(`${baseUrl}/driver/unassigned-ride`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRides);
    });
  });

  describe('getDriverDetailsById', () => {
    it('should fetch and map driver details', () => {
      const driverId = 'driver123';
      const mockDriverDTO: DriverResponseDTO = {
        id: driverId,
        name: 'John Doe',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        personalDetails: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          dateOfBirth: '1990-01-01'
        },
        driverDetails: {
          licenseNumber: 'LIC123'
        },
        vehicleDetails: {
          vehicleNumber: 'ABC123',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehicleYear: 2020,
          vehicleColor: 'Black'
        },
        bankingDetails: {
          bankName: 'Test Bank'
        }
      };

      service.getDriverDetailsById(driverId).subscribe(details => {
        expect(details.name).toBe('John Doe');
        expect(details.phone).toBe('1234567890');
        expect(details.vehicleInfo).toBe('Camry (ABC123)');
      });

      const req = httpMock.expectOne(`${baseUrlForDriver}/api/drivers/profile/${driverId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDriverDTO);
    });
  });

  describe('hasTwoActiveRides', () => {
    it('should check if user has two active rides', () => {
      const userId = 'user123';

      service.hasTwoActiveRides(userId).subscribe(hasTwo => {
        expect(hasTwo).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/rider/has-two-rides/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('should return false when user has less than two rides', () => {
      const userId = 'user456';

      service.hasTwoActiveRides(userId).subscribe(hasTwo => {
        expect(hasTwo).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}/rider/has-two-rides/${userId}`);
      req.flush(false);
    });
  });

  describe('getUpcomingRidesForUser', () => {
    it('should fetch upcoming rides for user', () => {
      const userId = 'user123';
      const mockRides: Ride[] = [
        {
          rideId: 'ride1',
          userId: userId,
          pickupLocation: 'Home',
          dropLocation: 'Work',
          fare: 50,
          status: RideStatus.ConfirmedByDriver,
          dateTime: new Date()
        }
      ];

      service.getUpcomingRidesForUser(userId).subscribe(rides => {
        expect(rides.length).toBe(1);
        expect(rides[0].userId).toBe(userId);
      });

      const req = httpMock.expectOne(`${baseUrl}/rider/upcoming-ride/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRides);
    });
  });

  describe('getUpcomingRidesForDriver', () => {
    it('should fetch upcoming rides for driver', () => {
      const driverId = 'driver123';
      const mockRides: Ride[] = [
        {
          rideId: 'ride1',
          userId: 'user1',
          driverId: driverId,
          pickupLocation: 'Location A',
          dropLocation: 'Location B',
          fare: 75,
          status: RideStatus.Ongoing,
          dateTime: new Date()
        }
      ];

      service.getUpcomingRidesForDriver(driverId).subscribe(rides => {
        expect(rides.length).toBe(1);
        expect(rides[0].driverId).toBe(driverId);
      });

      const req = httpMock.expectOne(`${baseUrl}/driver/upcoming-ride/${driverId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRides);
    });
  });

  describe('bookRide', () => {
    it('should book a ride', () => {
      const ridePayload: RidePayload = {
        userId: 'user123',
        pickupLocation: 'Home',
        dropLocation: 'Airport',
        fare: 100,
        status: RideStatus.LookingForDriver
      };

      const mockResponse: Ride = {
        ...ridePayload,
        rideId: 'ride123',
        dateTime: new Date()
      };

      service.bookRide(ridePayload).subscribe(ride => {
        expect(ride.rideId).toBe('ride123');
        expect(ride.userId).toBe('user123');
      });

      const req = httpMock.expectOne(`${baseUrl}/rider/book`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(ridePayload);
      req.flush(mockResponse);
    });
  });

  describe('updateRideStatus', () => {
    it('should update ride status', () => {
      const rideId = 'ride123';
      const newStatus = RideStatus.Ongoing;

      service.updateRideStatus(rideId, newStatus).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: newStatus });
      req.flush({});
    });
  });

  describe('assignDriver', () => {
    it('should assign driver to ride', () => {
      const rideId = 'ride123';
      const driverId = 'driver123';

      service.assignDriver(rideId, driverId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ driverId: driverId });
      req.flush({});
    });
  });

  describe('cancelRideByDriver', () => {
    it('should cancel ride by driver', () => {
      const rideId = 'ride123';

      service.cancelRideByDriver(rideId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ 
        driverId: null, 
        status: RideStatus.CancelledByDriver 
      });
      req.flush({});
    });
  });

  describe('cancelRideByUser', () => {
    it('should cancel ride by user', () => {
      const rideId = 'ride123';

      service.cancelRideByUser(rideId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: RideStatus.CancelledByUser });
      req.flush({});
    });
  });

  describe('markRideAsCompleted', () => {
    it('should mark ride as completed', () => {
      const rideId = 'ride123';

      service.markRideAsCompleted(rideId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: RideStatus.Completed });
      req.flush({});
    });
  });

  describe('startRide', () => {
    it('should start ride by updating status to Ongoing', () => {
      const rideId = 'ride123';

      service.startRide(rideId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rider/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: RideStatus.Ongoing });
      req.flush({});
    });
  });

  describe('getRideStatus', () => {
    it('should get ride status from getRideById', (done) => {
      const rideId = 'ride123';
      const mockRide: Ride = {
        rideId: rideId,
        userId: 'user1',
        pickupLocation: 'Home',
        dropLocation: 'Airport',
        fare: 100,
        status: RideStatus.Ongoing,
        dateTime: new Date()
      };

      const wsSubject = new Subject<Ride>();
      mockRideWsService.subscribeToRideUpdates.and.returnValue(wsSubject.asObservable());

      service.getRideStatus(rideId).subscribe(status => {
        expect(status).toBe(RideStatus.Ongoing);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/ride/${rideId}`);
      req.flush(mockRide);
    });

    it('should return null when ride is not found', (done) => {
      const rideId = 'nonexistent';
      
      const wsSubject = new Subject<Ride>();
      mockRideWsService.subscribeToRideUpdates.and.returnValue(wsSubject.asObservable());

      service.getRideStatus(rideId).subscribe(status => {
        expect(status).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/ride/${rideId}`);
      req.error(new ErrorEvent('Not found'));
    });
  });

  describe('updateRide', () => {
    it('should update ride with partial data', () => {
      const rideId = 'ride123';
      const updateData: Partial<Ride> = {
        fare: 150,
        status: RideStatus.Completed
      };

      service.updateRide(rideId, updateData).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/book/${rideId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush({});
    });
  });

  describe('mapDriverResponseToDriverDetails', () => {
    it('should map complete driver response correctly', () => {
      const mockDTO: DriverResponseDTO = {
        id: 'driver1',
        name: 'Jane Smith',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        personalDetails: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '9876543210',
          dateOfBirth: '1985-05-15'
        },
        driverDetails: {},
        vehicleDetails: {
          vehicleNumber: 'XYZ789',
          vehicleMake: 'Honda',
          vehicleModel: 'Accord',
          vehicleYear: 2021,
          vehicleColor: 'White'
        },
        bankingDetails: {}
      };

      const result = service.mapDriverResponseToDriverDetails(mockDTO);

      expect(result.name).toBe('Jane Smith');
      expect(result.phone).toBe('9876543210');
      expect(result.vehicleInfo).toBe('Accord (XYZ789)');
    });

    it('should handle missing name', () => {
      const mockDTO: DriverResponseDTO = {
        id: 'driver1',
        name: '',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        personalDetails: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '1111111111',
          dateOfBirth: '1990-01-01'
        },
        driverDetails: {},
        vehicleDetails: {
          vehicleNumber: 'TEST123',
          vehicleMake: 'Test',
          vehicleModel: 'Car',
          vehicleYear: 2020,
          vehicleColor: 'Red'
        },
        bankingDetails: {}
      };

      const result = service.mapDriverResponseToDriverDetails(mockDTO);

      expect(result.name).toBe('Name not provided');
    });

    it('should handle missing phone', () => {
      const mockDTO: DriverResponseDTO = {
        id: 'driver1',
        name: 'Test Driver',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        personalDetails: {
          firstName: 'Test',
          lastName: 'Driver',
          email: 'test@example.com',
          phone: '',
          dateOfBirth: '1990-01-01'
        },
        driverDetails: {},
        vehicleDetails: {
          vehicleNumber: 'TEST123',
          vehicleMake: 'Test',
          vehicleModel: 'Car',
          vehicleYear: 2020,
          vehicleColor: 'Red'
        },
        bankingDetails: {}
      };

      const result = service.mapDriverResponseToDriverDetails(mockDTO);

      expect(result.phone).toBe('N/A');
    });

    it('should handle missing vehicle details', () => {
      const mockDTO: any = {
        id: 'driver1',
        name: 'Test Driver',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        personalDetails: {
          firstName: 'Test',
          lastName: 'Driver',
          email: 'test@example.com',
          phone: '1234567890',
          dateOfBirth: '1990-01-01'
        },
        driverDetails: {},
        vehicleDetails: null,
        bankingDetails: {}
      };

      const result = service.mapDriverResponseToDriverDetails(mockDTO);

      expect(result.vehicleInfo).toBe('Vehicle details unavailable');
    });
  });
});