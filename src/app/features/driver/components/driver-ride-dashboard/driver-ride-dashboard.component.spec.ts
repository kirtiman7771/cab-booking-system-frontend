import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DriverRideDashboardComponent } from './driver-ride-dashboard.component';
import { AuthService } from '../../../auth/services/auth.service';
import { DriverService } from '../../services/driver.service';
import { DriverDashboardModel } from '../../models/driverDashboardModel';

describe('DriverRideDashboardComponent', () => {
  let component: DriverRideDashboardComponent;
  let fixture: ComponentFixture<DriverRideDashboardComponent>;
  let authServiceMock: any;
  let driverServiceMock: any;
  let routerMock: any;

  const mockUser = {
    userId: 'driver-123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'driver'
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
    earningChange: 0,
    rideChange: 0,
    hoursOnline: 0.0,
    hoursOnlineThisWeek: 0.0,
    weeklyGoals: {
      earnings: { current: 0, goal: 0, completion: 0 },
      rides: { current: 0, goal: 0, completion: 0 },
      rating: { current: 0, goal: 0, completion: 0 },
      acceptance: { current: 0, goal: 0, completion: 0 }
    }
  };

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser', 'logout']);
    driverServiceMock = jasmine.createSpyObj('DriverService', ['getDriverDashboardDetails']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [DriverRideDashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: DriverService, useValue: driverServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverRideDashboardComponent);
    component = fixture.componentInstance;
    
    // Set default mock behavior
    authServiceMock.getUser.and.returnValue(mockUser);
    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(mockDashboardData));
    
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.userName).toBe('Driver');
    expect(component.newRideRequests).toEqual([]);
    expect(component.goalsAchievedCount).toBe(0);
  });

  it('should load dashboard data and set user name on ngOnInit when user is logged in', fakeAsync(() => {
    authServiceMock.getUser.and.returnValue(mockUser);
    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(mockDashboardData));

    component.ngOnInit();
    tick();

    expect(authServiceMock.getUser).toHaveBeenCalled();
    expect(component.userName).toBe('John Doe');
    expect(driverServiceMock.getDriverDashboardDetails).toHaveBeenCalledWith('driver-123');
    expect(component.dashboardData).toBeDefined();
  }));

  it('should navigate to login page when user is not logged in', fakeAsync(() => {
    authServiceMock.getUser.and.returnValue(null);

    component.ngOnInit();
    tick();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    expect(driverServiceMock.getDriverDashboardDetails).not.toHaveBeenCalled();
  }));

  it('should correctly calculate weekly goals with completion percentages', fakeAsync(() => {
    const testData = { ...mockDashboardData };
    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(testData));
    authServiceMock.getUser.and.returnValue(mockUser);

    component.ngOnInit();
    tick();

    expect(component.dashboardData.weeklyGoals.earnings.current).toBe(800);
    expect(component.dashboardData.weeklyGoals.earnings.goal).toBe(1000);
    expect(component.dashboardData.weeklyGoals.earnings.completion).toBe(80);

    expect(component.dashboardData.weeklyGoals.rides.current).toBe(45);
    expect(component.dashboardData.weeklyGoals.rides.goal).toBe(50);
    expect(component.dashboardData.weeklyGoals.rides.completion).toBe(90);

    // Rating is over 100%, but capped at 100 by Math.min
    expect(component.dashboardData.weeklyGoals.rating.current).toBe(4.8);
    expect(component.dashboardData.weeklyGoals.rating.goal).toBe(4.5);
    expect(component.dashboardData.weeklyGoals.rating.completion).toBe(100);

    // Acceptance is over 100%, but capped at 100 by Math.min
    expect(component.dashboardData.weeklyGoals.acceptance.current).toBe(95);
    expect(component.dashboardData.weeklyGoals.acceptance.goal).toBe(90);
    expect(component.dashboardData.weeklyGoals.acceptance.completion).toBe(100);
  }));

  it('should cap completion percentages at 100% when displaying goals', fakeAsync(() => {
    const testData = { ...mockDashboardData };
    testData.ratingMaintenanceAchieved = 5.0;
    testData.ratingMaintenanceGoal = 4.5;
    testData.acceptanceRateAchieved = 100;
    testData.acceptanceRateGoal = 90;

    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(testData));
    authServiceMock.getUser.and.returnValue(mockUser);

    component.ngOnInit();
    tick();

    // Rating and acceptance are over 100%, but should be capped at 100
    expect(component.dashboardData.weeklyGoals.rating.completion).toBe(100);
    expect(component.dashboardData.weeklyGoals.acceptance.completion).toBe(100);
  }));

  it('should correctly count the number of achieved goals', fakeAsync(() => {
    const testData = { ...mockDashboardData };
    // Set up data where 2 goals are achieved (rating and acceptance)
    testData.weeklyEarningsAchieved = 800;
    testData.weeklyEarningsGoal = 1000;
    testData.weeklyRidesAchieved = 45;
    testData.weeklyRidesGoal = 50;
    testData.ratingMaintenanceAchieved = 4.8;
    testData.ratingMaintenanceGoal = 4.5;
    testData.acceptanceRateAchieved = 95;
    testData.acceptanceRateGoal = 90;

    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(testData));
    authServiceMock.getUser.and.returnValue(mockUser);

    component.ngOnInit();
    tick();

    // Rating (106.67% -> capped at 100) and acceptance (105.56% -> capped at 100) are >= 100%
    expect(component.goalsAchievedCount).toBe(2);
  }));

  it('should correctly count when all goals are achieved', fakeAsync(() => {
    const testData = { ...mockDashboardData };
    testData.weeklyEarningsAchieved = 1200;
    testData.weeklyEarningsGoal = 1000;
    testData.weeklyRidesAchieved = 55;
    testData.weeklyRidesGoal = 50;
    testData.ratingMaintenanceAchieved = 4.8;
    testData.ratingMaintenanceGoal = 4.5;
    testData.acceptanceRateAchieved = 95;
    testData.acceptanceRateGoal = 90;

    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(testData));
    authServiceMock.getUser.and.returnValue(mockUser);

    component.ngOnInit();
    tick();

    expect(component.goalsAchievedCount).toBe(4);
  }));

  it('should correctly count when no goals are achieved', fakeAsync(() => {
    const testData = { ...mockDashboardData };
    testData.weeklyEarningsAchieved = 500;
    testData.weeklyEarningsGoal = 1000;
    testData.weeklyRidesAchieved = 25;
    testData.weeklyRidesGoal = 50;
    testData.ratingMaintenanceAchieved = 4.0;
    testData.ratingMaintenanceGoal = 4.5;
    testData.acceptanceRateAchieved = 80;
    testData.acceptanceRateGoal = 90;

    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(testData));
    authServiceMock.getUser.and.returnValue(mockUser);

    component.ngOnInit();
    tick();

    expect(component.goalsAchievedCount).toBe(0);
  }));

  it('should initialize default values for earningChange, rideChange, and hoursOnline', fakeAsync(() => {
    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(mockDashboardData));
    authServiceMock.getUser.and.returnValue(mockUser);

    component.ngOnInit();
    tick();

    expect(component.dashboardData.earningChange).toBe(0);
    expect(component.dashboardData.rideChange).toBe(0);
    expect(component.dashboardData.hoursOnline).toBe(0.0);
    expect(component.dashboardData.hoursOnlineThisWeek).toBe(0.0);
  }));

 

  it('should accept a ride and remove it from newRideRequests', () => {
    const mockRides = [
      { id: 1, passenger: 'Alice', destination: 'Airport' },
      { id: 2, passenger: 'Bob', destination: 'Mall' },
      { id: 3, passenger: 'Charlie', destination: 'Station' }
    ];

    component.newRideRequests = [...mockRides];

    component.acceptRide(2);

    expect(console.log).toHaveBeenCalledWith('Driver accepted ride request with ID: 2');
    expect(component.newRideRequests.length).toBe(2);
    expect(component.newRideRequests.find(r => r.id === 2)).toBeUndefined();
    expect(component.newRideRequests).toEqual([
      { id: 1, passenger: 'Alice', destination: 'Airport' },
      { id: 3, passenger: 'Charlie', destination: 'Station' }
    ]);
  });

  it('should handle accepting a ride that does not exist', () => {
    const mockRides = [
      { id: 1, passenger: 'Alice', destination: 'Airport' },
      { id: 2, passenger: 'Bob', destination: 'Mall' }
    ];

    component.newRideRequests = [...mockRides];

    component.acceptRide(999);

    expect(console.log).toHaveBeenCalledWith('Driver accepted ride request with ID: 999');
    expect(component.newRideRequests.length).toBe(2);
    expect(component.newRideRequests).toEqual(mockRides);
  });

  it('should call authService.logout when logout is invoked', () => {
    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalled();
  });

  it('should handle edge case where goals are zero', fakeAsync(() => {
    const testData = { ...mockDashboardData };
    testData.weeklyEarningsGoal = 0;
    testData.weeklyRidesGoal = 0;
    testData.ratingMaintenanceGoal = 0;
    testData.acceptanceRateGoal = 0;
    testData.weeklyEarningsAchieved = 100;
    testData.weeklyRidesAchieved = 10;
    testData.ratingMaintenanceAchieved = 4.5;
    testData.acceptanceRateAchieved = 90;

    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(testData));
    authServiceMock.getUser.and.returnValue(mockUser);

    component.ngOnInit();
    tick();

    // When goal is 0, division will result in Infinity, Math.min should cap it at 100
    expect(component.dashboardData.weeklyGoals.earnings.completion).toBe(100);
    expect(component.dashboardData.weeklyGoals.rides.completion).toBe(100);
    expect(component.dashboardData.weeklyGoals.rating.completion).toBe(100);
    expect(component.dashboardData.weeklyGoals.acceptance.completion).toBe(100);
    
    // All should be counted as achieved
    expect(component.goalsAchievedCount).toBe(4);
  }));

  it('should handle partial completion of goals correctly', fakeAsync(() => {
    const testData = { ...mockDashboardData };
    testData.weeklyEarningsAchieved = 500;
    testData.weeklyEarningsGoal = 1000;
    testData.weeklyRidesAchieved = 30;
    testData.weeklyRidesGoal = 50;
    testData.ratingMaintenanceAchieved = 4.2;
    testData.ratingMaintenanceGoal = 4.5;
    testData.acceptanceRateAchieved = 85;
    testData.acceptanceRateGoal = 90;

    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(testData));
    authServiceMock.getUser.and.returnValue(mockUser);

    component.ngOnInit();
    tick();

    expect(component.dashboardData.weeklyGoals.earnings.completion).toBe(50);
    expect(component.dashboardData.weeklyGoals.rides.completion).toBe(60);
    expect(component.dashboardData.weeklyGoals.rating.completion).toBeCloseTo(93.33, 1);
    expect(component.dashboardData.weeklyGoals.acceptance.completion).toBeCloseTo(94.44, 1);
    expect(component.goalsAchievedCount).toBe(0);
  }));

  it('should preserve userName as empty string if user name is not provided', fakeAsync(() => {
    const userWithoutName = { ...mockUser, name: '' };
    authServiceMock.getUser.and.returnValue(userWithoutName);
    driverServiceMock.getDriverDashboardDetails.and.returnValue(of(mockDashboardData));

    component.ngOnInit();
    tick();

    expect(component.userName).toBe('');
  }));

  it('should not call loadDashboardData if user is null', fakeAsync(() => {
    authServiceMock.getUser.and.returnValue(null);

    component.ngOnInit();
    tick();

    expect(driverServiceMock.getDriverDashboardDetails).not.toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  }));
});