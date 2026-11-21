import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UserProfileComponent } from './user-profile.component';
import { RiderAllDetails } from '../../models/riderAllDetails';
import { RiderService } from '../../services/rider.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from '../../../../core/services/message.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms'; // Needed for passwordData binding if applicable
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RiderUpdateProfile } from '../../models/RiderUpdateProfile';

// --- Mock Data ---
const mockUserId = 'rider-123';
const mockAuthUser = { userId: mockUserId };
const mockRiderDetails: RiderAllDetails = {
  userId: mockUserId,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '1234567890',
  createdAt: '2023-01-01',
  updatedAt: '2023-10-01',
  role: 'RIDER',
  todaySpent: 50.00,
  todayRides: 2,
  rating: 4.5,
  totalSpent: 500.00,
  totalRides: 20
};

// --- Mock Services ---

class MockAuthService {
  logout = jasmine.createSpy('logout');
}

class MockRiderService {
  getRiderAllDetails = jasmine.createSpy('getRiderAllDetails').and.returnValue(of(mockRiderDetails));
  updateUserProfile = jasmine.createSpy('updateUserProfile').and.returnValue(of({} as RiderUpdateProfile));
  deleteRiderAccount = jasmine.createSpy('deleteRiderAccount').and.returnValue(of(void 0));
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockMessageService {
  sendMessage = jasmine.createSpy('sendMessage');
}

// Spy on localStorage methods before the suite runs
const localStorageMock = {
    getItem: jasmine.createSpy('getItem').and.returnValue(JSON.stringify(mockAuthUser)),
    setItem: jasmine.createSpy('setItem'),
    removeItem: jasmine.createSpy('removeItem')
};

// Mock global localStorage
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// --- Test Suite ---
describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let riderService: MockRiderService;
  let authService: MockAuthService;
  let router: MockRouter;
  let messageService: MockMessageService;

  beforeEach(waitForAsync(() => {
    // Reset localStorage mock before each test
    localStorageMock.getItem.and.returnValue(JSON.stringify(mockAuthUser));

    TestBed.configureTestingModule({
      // UserProfileComponent uses 'standalone: false', so we use declarations and imports
      declarations: [UserProfileComponent], 
      imports: [FormsModule, HttpClientTestingModule], 
      providers: [
        { provide: RiderService, useClass: MockRiderService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter },
        { provide: MessageService, useClass: MockMessageService },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    
    // Get the injected services (Mocks)
    riderService = TestBed.inject(RiderService) as unknown as MockRiderService;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router) as unknown as MockRouter;
    messageService = TestBed.inject(MessageService) as unknown as MockMessageService;

    // Trigger ngOnInit manually or via fixture.detectChanges()
    fixture.detectChanges(); 
  });

  // --- Initialization (ngOnInit) Tests ---
  
  describe('ngOnInit', () => {
    it('should initialize userId from localStorage and call getRiderAllDetails', () => {
      // Assertions based on beforeEach setup
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authUser');
      expect(component.userId).toEqual(mockUserId);
      expect(riderService.getRiderAllDetails).toHaveBeenCalledWith(mockUserId);
      expect(component.userDetails).toEqual(mockRiderDetails);
      expect(messageService.sendMessage).not.toHaveBeenCalled();
    });

    it('should show error message if getRiderAllDetails fails', () => {
      // Simulate API failure
      riderService.getRiderAllDetails.and.returnValue(throwError(() => new Error('API Error')));
      
      // Re-initialize the component to trigger the error path
      component.ngOnInit(); 
      
      expect(riderService.getRiderAllDetails).toHaveBeenCalled();
      expect(messageService.sendMessage).toHaveBeenCalledWith('error', 'Failed to load user profile. Please try again later.');
    });
  });

  // --- Profile Update Tests (updateProfile) ---

  describe('updateProfile', () => {
    // Ensure userDetails is initialized before tests
    beforeEach(() => {
        component.userDetails = { ...mockRiderDetails };
        component.userId = mockUserId;
    });

    it('should call updateUserProfile with correct data and show success message', () => {
      // Arrange a change in data
      component.userDetails.firstName = 'Jane';
      component.userDetails.phone = '9876543210';
      
      const expectedPayload: Partial<RiderUpdateProfile> = {
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '9876543210'
      };

      component.updateProfile();

      expect(riderService.updateUserProfile).toHaveBeenCalledWith(mockUserId, expectedPayload);
      expect(messageService.sendMessage).toHaveBeenCalledWith('success', 'Profile Updated Successfully!');
    });

    it('should prevent update and show error if firstName is missing', () => {
      component.userDetails.firstName = ''; // Simulate missing required field
      component.updateProfile();

      expect(riderService.updateUserProfile).not.toHaveBeenCalled();
      expect(messageService.sendMessage).toHaveBeenCalledWith('error', 'First Name and Phone are required fields.');
    });

    it('should prevent update and show error if phone is missing', () => {
      component.userDetails.phone = ''; // Simulate missing required field
      component.updateProfile();

      expect(riderService.updateUserProfile).not.toHaveBeenCalled();
      expect(messageService.sendMessage).toHaveBeenCalledWith('error', 'First Name and Phone are required fields.');
    });

    it('should show error message if updateUserProfile fails', () => {
      // Simulate API failure
      riderService.updateUserProfile.and.returnValue(throwError(() => new Error('Update failed')));

      component.updateProfile();

      expect(riderService.updateUserProfile).toHaveBeenCalled();
      expect(messageService.sendMessage).toHaveBeenCalledWith('error', 'Failed to update profile. Please try again.');
    });
  });

  // --- Logout Test (logout) ---

  describe('logout', () => {
    it('should call the auth service logout method', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  // --- Account Deletion Tests (confirmDeleteAccount) ---

  describe('confirmDeleteAccount', () => {
    it('should call deleteRiderAccount, then logout, and navigate to /login on success', () => {
      component.userId = mockUserId;
      component.confirmDeleteAccount();

      expect(riderService.deleteRiderAccount).toHaveBeenCalledWith(mockUserId);
      
      // Wait for the successful observable chain to complete
      fixture.whenStable().then(() => {
        expect(messageService.sendMessage).toHaveBeenCalledWith('success', 'Your account has been successfully deleted!');
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      });
    });

    it('should show an error message if userId is missing', () => {
      component.userId = '';
      component.confirmDeleteAccount();

      expect(riderService.deleteRiderAccount).not.toHaveBeenCalled();
      expect(messageService.sendMessage).toHaveBeenCalledWith('error', 'User ID not found. Cannot delete account.');
      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should show an error message if deleteRiderAccount API fails', () => {
      component.userId = mockUserId;
      riderService.deleteRiderAccount.and.returnValue(throwError(() => new Error('Delete failed')));
      
      component.confirmDeleteAccount();

      expect(riderService.deleteRiderAccount).toHaveBeenCalledWith(mockUserId);
      
      // Wait for the error path to be executed
      fixture.whenStable().then(() => {
          expect(messageService.sendMessage).toHaveBeenCalledWith('error', 'Failed to delete account. Please try again later.');
          expect(authService.logout).not.toHaveBeenCalled();
          expect(router.navigate).not.toHaveBeenCalled();
      });
    });
  });
});