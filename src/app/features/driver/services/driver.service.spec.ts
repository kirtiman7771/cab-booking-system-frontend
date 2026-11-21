import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DriverService } from './driver.service';
import { environment } from '../../../../environment/environment';
import { DriverAllDetails } from '../models/driverAllDetails';
import { DriverDashboardModel } from '../models/driverDashboardModel';
import { DriverUpdatePayload } from '../models/driverUpdateDetails';

describe('DriverService', () => {
  let service: DriverService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.springApiUrl;

  const mockDriverAllDetails: DriverAllDetails = {
    id: 'driver-123',
    role: 'driver',
    status: 'AVAILABLE',
    name: 'John Doe',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z',
    personalDetails: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01'
    },
    driverDetails: {
      licenseNumber: 'L12345',
      licenseExpiry: '2028-01-01',
      experience: 5,
      emergencyName: 'Jane Doe',
      emergencyPhone: '0987654321',
      emergencyRelation: 'Wife'
    },
    vehicleDetails: {
      vehicleNumber: 'ABC-123',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleYear: 2020,
      vehicleColor: 'Black'
    },
    bankingDetails: {
      bankAccount: '1234567890',
      routingNumber: '123456789'
    }
  };

  const mockDashboardData: DriverDashboardModel = {
    driverId: 'driver-123',
    todaysEarnings: 250.50,
    todaysRides: 12,
    driverRating: 4.8,
    additionalMetricLabel: 'Bonus',
    additionalMetricValue: '$50',
    weeklyEarningsGoal: 1000,
    weeklyEarningsAchieved: 800,
    weeklyRidesGoal: 50,
    weeklyRidesAchieved: 45,
    ratingMaintenanceGoal: 4.5,
    ratingMaintenanceAchieved: 4.8,
    acceptanceRateGoal: 90,
    acceptanceRateAchieved: 95,
    earningChange: 10,
    rideChange: 5,
    hoursOnline: 8.5,
    hoursOnlineThisWeek: 42.5,
    weeklyGoals: {
      earnings: { current: 800, goal: 1000, completion: 80 },
      rides: { current: 45, goal: 50, completion: 90 },
      rating: { current: 4.8, goal: 4.5, completion: 100 },
      acceptance: { current: 95, goal: 90, completion: 100 }
    }
  };

  const mockUpdatePayload: DriverUpdatePayload = {
    firstName: 'John',
    lastName: 'Doe',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    licenseNumber: 'L12345',
    licenseExpiry: '2028-01-01',
    experience: 5,
    emergencyName: 'Jane Doe',
    emergencyPhone: '0987654321',
    emergencyRelation: 'Wife',
    vehicleNumber: 'ABC-123',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleYear: 2020,
    vehicleColor: 'Black',
    bankAccount: '1234567890',
    routingNumber: '123456789',
    status: 'AVAILABLE'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DriverService]
    });
    service = TestBed.inject(DriverService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have springApiUrl set from environment', () => {
    expect(service.springApiUrl).toBe(environment.springApiUrl);
  });

  describe('updateDriverStatus', () => {
    it('should update driver status with correct URL and payload', () => {
      const driverId = 'driver-123';
      const status = 'BUSY';
      const expectedUrl = `${apiUrl}/api/drivers/status/${driverId}`;
      const expectedPayload = { status: status };

      service.updateDriverStatus(driverId, status).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(expectedPayload);

      req.flush({ success: true });
    });

    it('should handle different status values', () => {
      const driverId = 'driver-456';
      const statuses = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_TRIP'];

      statuses.forEach(status => {
        service.updateDriverStatus(driverId, status).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/api/drivers/status/${driverId}`);
        expect(req.request.body).toEqual({ status: status });
        req.flush({ success: true });
      });
    });

    it('should handle error when updating driver status fails', () => {
      const driverId = 'driver-123';
      const status = 'BUSY';
      const errorMessage = 'Failed to update status';

      service.updateDriverStatus(driverId, status).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(500);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/status/${driverId}`);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getDriverProfileById', () => {
    it('should retrieve driver profile by userId', () => {
      const userId = 'driver-123';
      const expectedUrl = `${apiUrl}/api/drivers/profile/${userId}`;

      service.getDriverProfileById(userId).subscribe(profile => {
        expect(profile).toEqual(mockDriverAllDetails);
        expect(profile.id).toBe('driver-123');
        expect(profile.personalDetails.firstName).toBe('John');
        expect(profile.driverDetails.licenseNumber).toBe('L12345');
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');

      req.flush(mockDriverAllDetails);
    });

    it('should return Observable<DriverAllDetails>', () => {
      const userId = 'driver-123';

      const result = service.getDriverProfileById(userId);

      expect(result).toBeDefined();
      result.subscribe(profile => {
        expect(profile).toEqual(mockDriverAllDetails);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      req.flush(mockDriverAllDetails);
    });

    it('should handle error when fetching driver profile fails', () => {
      const userId = 'driver-123';
      const errorMessage = 'Driver not found';

      service.getDriverProfileById(userId).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', () => {
      const userId = 'driver-123';
      const errorEvent = new ErrorEvent('Network error', {
        message: 'Network connection failed'
      });

      service.getDriverProfileById(userId).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.error.message).toBe('Network connection failed');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      req.error(errorEvent);
    });
  });

  describe('getDriverDashboardDetails', () => {
    it('should retrieve driver dashboard details by driverId', () => {
      const driverId = 'driver-123';
      const expectedUrl = `${apiUrl}/api/drivers/dashboard/${driverId}`;

      service.getDriverDashboardDetails(driverId).subscribe(dashboard => {
        expect(dashboard).toEqual(mockDashboardData);
        expect(dashboard.driverId).toBe('driver-123');
        expect(dashboard.todaysEarnings).toBe(250.50);
        expect(dashboard.todaysRides).toBe(12);
        expect(dashboard.driverRating).toBe(4.8);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');

      req.flush(mockDashboardData);
    });

    it('should return Observable<DriverDashboardModel>', () => {
      const driverId = 'driver-123';

      const result = service.getDriverDashboardDetails(driverId);

      expect(result).toBeDefined();
      result.subscribe(dashboard => {
        expect(dashboard).toEqual(mockDashboardData);
        expect(dashboard.weeklyGoals).toBeDefined();
        expect(dashboard.weeklyGoals.earnings.current).toBe(800);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/dashboard/${driverId}`);
      req.flush(mockDashboardData);
    });

    it('should handle error when fetching dashboard details fails', () => {
      const driverId = 'driver-123';
      const errorMessage = 'Dashboard data unavailable';

      service.getDriverDashboardDetails(driverId).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(500);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/dashboard/${driverId}`);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });

    it('should correctly handle dashboard data with weekly goals', () => {
      const driverId = 'driver-123';

      service.getDriverDashboardDetails(driverId).subscribe(dashboard => {
        expect(dashboard.weeklyGoals.earnings).toBeDefined();
        expect(dashboard.weeklyGoals.rides).toBeDefined();
        expect(dashboard.weeklyGoals.rating).toBeDefined();
        expect(dashboard.weeklyGoals.acceptance).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/dashboard/${driverId}`);
      req.flush(mockDashboardData);
    });
  });

  describe('updateDriverProfile', () => {
    it('should update driver profile with full payload', () => {
      const userId = 'driver-123';
      const expectedUrl = `${apiUrl}/api/drivers/profile/${userId}`;

      service.updateDriverProfile(userId, mockUpdatePayload).subscribe(profile => {
        expect(profile).toEqual(mockDriverAllDetails);
        expect(profile.personalDetails.firstName).toBe('John');
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdatePayload);

      req.flush(mockDriverAllDetails);
    });

    it('should update driver profile with partial payload', () => {
      const userId = 'driver-123';
      const partialPayload: Partial<DriverUpdatePayload> = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '9876543210'
      };
      const expectedUrl = `${apiUrl}/api/drivers/profile/${userId}`;

      service.updateDriverProfile(userId, partialPayload).subscribe(profile => {
        expect(profile).toBeDefined();
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(partialPayload);

      req.flush(mockDriverAllDetails);
    });

    it('should return Observable<DriverAllDetails> after update', () => {
      const userId = 'driver-123';

      const result = service.updateDriverProfile(userId, mockUpdatePayload);

      expect(result).toBeDefined();
      result.subscribe(profile => {
        expect(profile).toEqual(mockDriverAllDetails);
        expect(profile.id).toBe('driver-123');
      });

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      req.flush(mockDriverAllDetails);
    });

    it('should handle error when updating driver profile fails', () => {
      const userId = 'driver-123';
      const errorMessage = 'Update failed';

      service.updateDriverProfile(userId, mockUpdatePayload).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(400);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle validation errors', () => {
      const userId = 'driver-123';
      const validationErrors = {
        firstName: 'First name is required',
        phone: 'Invalid phone number'
      };

      service.updateDriverProfile(userId, mockUpdatePayload).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(422);
          expect(error.error).toEqual(validationErrors);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      req.flush(validationErrors, { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should handle empty partial payload', () => {
      const userId = 'driver-123';
      const emptyPayload: Partial<DriverUpdatePayload> = {};

      service.updateDriverProfile(userId, emptyPayload).subscribe(profile => {
        expect(profile).toEqual(mockDriverAllDetails);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      expect(req.request.body).toEqual(emptyPayload);
      req.flush(mockDriverAllDetails);
    });
  });

  describe('HTTP Request Configuration', () => {
    it('should make requests to the correct base URL', () => {
      const driverId = 'driver-123';

      service.getDriverProfileById(driverId).subscribe();

      const req = httpMock.expectOne(`${environment.springApiUrl}/api/drivers/profile/${driverId}`);
      expect(req.request.url).toContain(environment.springApiUrl);
      req.flush(mockDriverAllDetails);
    });

    it('should handle different driver IDs correctly', () => {
      const driverIds = ['driver-1', 'driver-2', 'driver-3'];

      driverIds.forEach(id => {
        service.getDriverProfileById(id).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${id}`);
        expect(req.request.url).toContain(id);
        req.flush(mockDriverAllDetails);
      });
    });
  });

  describe('Service Initialization', () => {
    it('should inject HttpClient', () => {
      expect(service['http']).toBeDefined();
    });

    it('should set springApiUrl on initialization', () => {
      expect(service.springApiUrl).toBeDefined();
      expect(typeof service.springApiUrl).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in driver ID', () => {
      const specialId = 'driver-123@#$';
      
      service.getDriverProfileById(specialId).subscribe();
      
      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${specialId}`);
      expect(req.request.url).toContain(specialId);
      req.flush(mockDriverAllDetails);
    });

    it('should handle timeout errors', () => {
      const userId = 'driver-123';
      const timeoutError = new ErrorEvent('Timeout', {
        message: 'Request timeout'
      });

      service.getDriverProfileById(userId).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.error.message).toBe('Request timeout');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      req.error(timeoutError);
    });

    it('should handle unauthorized errors', () => {
      const userId = 'driver-123';

      service.getDriverProfileById(userId).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/api/drivers/profile/${userId}`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });
});