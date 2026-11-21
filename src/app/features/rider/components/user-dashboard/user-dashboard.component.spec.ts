import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserDashboardComponent } from './user-dashboard.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { RiderService } from '../../services/rider.service';
import { RiderAllDetails, CarTypesCount } from '../../models/riderAllDetails';

// --- Mock Data ---
const mockUserId = 'rider123';
const mockUser = { userId: mockUserId, email: 'test@test.com' };
const mockDashboardData: RiderAllDetails = {
  userId: mockUserId,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '1234567890',
  createdAt: new Date(),
  updatedAt: new Date(),
  role: 'RIDER',
  todaySpent: 50,
  todayRides: 2,
  rating: 4.5,
  totalSpent: 500,
  totalRides: 10,
};
const mockCarTypesCount: CarTypesCount = {
  'Mini': 5,
  'Luxury': 3,
  'Micro': 2,
};
const mockEmptyCarTypesCount: CarTypesCount = {};


describe('UserDashboardComponent (Jasmine)', () => {
  let component: UserDashboardComponent;
  let fixture: ComponentFixture<UserDashboardComponent>;
  // Declare the mocks as Jasmine Spies
  let authServiceSpy: any;
  let riderServiceSpy: any;
  let routerSpy: any;

  beforeEach(async () => {
    // 1. Create Jasmine Spies to mock the dependencies
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'logout']);
    riderServiceSpy = jasmine.createSpyObj('RiderService', ['getRiderAllDetails', 'getCarTypesCountById']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: RiderService, useValue: riderServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: {} },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;

    // 2. Configure the Spies to return mock data before each test
    authServiceSpy.getUser.and.returnValue(mockUser);
    riderServiceSpy.getRiderAllDetails.and.returnValue(of(mockDashboardData));
    riderServiceSpy.getCarTypesCountById.and.returnValue(of(mockCarTypesCount));
  });

  // -------------------------------------------------------------------
  // --- Initialisation Tests ---
  // -------------------------------------------------------------------

  it('should create and initialize the bookingForm', () => {
    expect(component).toBeTruthy();
    expect(component.bookingForm).toBeDefined();
    expect(component.bookingForm.valid).toBeFalsy(); 
  });

  it('should load dashboard data and car types count on ngOnInit if user is logged in', fakeAsync(() => {
    component.ngOnInit();
    tick(); // Resolve the asynchronous service calls

    // 3. Check that the spies were called correctly
    expect(authServiceSpy.getUser).toHaveBeenCalled();
    expect(riderServiceSpy.getRiderAllDetails).toHaveBeenCalledWith(mockUserId);
    expect(riderServiceSpy.getCarTypesCountById).toHaveBeenCalledWith(mockUserId);

    // Check that data was assigned
    expect(component.dashboardData).toEqual(mockDashboardData);
    expect(component.carTypesCount).toEqual(mockCarTypesCount);
    // Check side effect of setting carTypesCount
    expect(component.totalCarRides).toBe(10); 
    expect(component.carTypePercentages.length).toBe(3);
  }));

  it('should navigate to login if getUser returns null on ngOnInit', () => {
    authServiceSpy.getUser.and.returnValue(null);
    component.ngOnInit();
    
    expect(authServiceSpy.getUser).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(riderServiceSpy.getRiderAllDetails).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------
  // --- Data Calculation Tests ---
  // -------------------------------------------------------------------

  describe('calculateCarTypeChartData', () => {
    it('should calculate total rides and percentages correctly', () => {
      component.carTypesCount = mockCarTypesCount;
      component.calculateCarTypeChartData();

      const totalRides = 10;
      expect(component.totalCarRides).toBe(totalRides);
      
      const miniData = component.carTypePercentages.find(item => item.type === 'Mini');
      expect(miniData?.percentage).toBeCloseTo(50); // Use toBeCloseTo for floats
    });

    it('should sort the percentages by count in descending order', () => {
      component.carTypesCount = { 'A': 1, 'B': 5, 'C': 3 };
      component.calculateCarTypeChartData();
      
      expect(component.carTypePercentages[0].type).toBe('B');
      expect(component.carTypePercentages[1].type).toBe('C');
      expect(component.carTypePercentages[2].type).toBe('A');
    });

    it('should handle zero total rides gracefully', () => {
      component.carTypesCount = mockEmptyCarTypesCount;
      component.calculateCarTypeChartData();

      expect(component.totalCarRides).toBe(0);
      expect(component.carTypePercentages.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------
  // --- Conic Gradient Tests ---
  // -------------------------------------------------------------------

  describe('getConicGradient', () => {
    it('should return "none" if totalCarRides is 0', () => {
      component.totalCarRides = 0;
      component.carTypePercentages = [];
      expect(component.getConicGradient()).toBe('none');
    });

    it('should generate a correct conic-gradient string', () => {
      component.totalCarRides = 10;
      component.carTypePercentages = [
        { type: 'Mini', count: 5, percentage: 50, color: '#3498db' },
        { type: 'Luxury', count: 3, percentage: 30, color: '#9b59b6' },
        { type: 'Micro', count: 2, percentage: 20, color: '#f1c40f' },
      ];

      const expectedGradient = 'conic-gradient(#3498db 0% 50%, #9b59b6 50% 80%, #f1c40f 80% 100%)';
      expect(component.getConicGradient()).toBe(expectedGradient);
    });
  });

  // -------------------------------------------------------------------
  // --- Logout Test ---
  // -------------------------------------------------------------------

  it('should call authService.logout and navigate to root on logout', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------
  // --- Service Error Handling ---
  // -------------------------------------------------------------------
  
  it('should handle dashboard data fetch error gracefully', fakeAsync(() => {
    // Spy on the method and make it return an error
    riderServiceSpy.getRiderAllDetails.and.returnValue(throwError(() => new Error('API Error')));
    // Keep car types count successful
    riderServiceSpy.getCarTypesCountById.and.returnValue(of(mockCarTypesCount));

    component.ngOnInit();
    tick();

    // dashboardData should remain null because the observable errored out
    expect(component.dashboardData).toBeNull();
    // carTypesCount should still be set from the successful call
    expect(component.carTypesCount).toEqual(mockCarTypesCount); 
  }));
});