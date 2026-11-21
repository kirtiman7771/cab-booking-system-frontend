// ride-details.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RideDetailsComponent } from './ride-details.component';
import { Router, UrlSerializer } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ConfirmationModalService } from '../../../../shared/services/confirmation-modal.service';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { InternetUtils } from '../../../../core/utils/InternetUtils';

describe('RideDetailsComponent', () => {
  let component: RideDetailsComponent;
  let fixture: ComponentFixture<RideDetailsComponent>;
  let mockRideBookingService: jasmine.SpyObj<IRideBookingService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockConfirmationModal: jasmine.SpyObj<ConfirmationModalService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockUrlSerializer: jasmine.SpyObj<UrlSerializer>;

  const mockRide: Ride = {
    id: '1',
    rideId: 'ride-123',
    userId: 'user-1',
    driverId: 'driver-1',
    carType: 'sedan',
    pickupLocation: 'Location A',
    dropLocation: 'Location B',
    fare: 100,
    status: RideStatus.LookingForDriver,
    dateTime: new Date()
  };

  beforeEach(async () => {
    // Create mock services
    mockRideBookingService = jasmine.createSpyObj('IRideBookingService', [
      'getRideById',
      'cancelRideByUser',
      'cancelRideByDriver',
      'markAsCompleted',
      'assignDriver',
      'startRide'
    ]);

    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);
    mockMessageService = jasmine.createSpyObj('MessageService', ['sendMessage']);
    mockConfirmationModal = jasmine.createSpyObj('ConfirmationModalService', ['confirm']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockUrlSerializer = jasmine.createSpyObj('UrlSerializer', ['serialize']);

    await TestBed.configureTestingModule({
      declarations: [RideDetailsComponent],
      providers: [
        { provide: RIDE_BOOKING_SERVICE_TOKEN, useValue: mockRideBookingService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ConfirmationModalService, useValue: mockConfirmationModal },
        { provide: Router, useValue: mockRouter },
        { provide: UrlSerializer, useValue: mockUrlSerializer }
      ]
    }).compileComponents();

    // Setup default mock returns
    mockAuthService.getUserId.and.returnValue('user-1');
    spyOn(localStorage, 'getItem').and.returnValue('rider');
    
    fixture = TestBed.createComponent(RideDetailsComponent);
    component = fixture.componentInstance;
    component.rideId = 'ride-123';
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.ride).toBeNull();
      expect(component.driverId).toBeNull();
      expect(component.driverDetailsLoading).toBe(false);
      expect(component.isCancelling).toBe(false);
      expect(component.isMarkingCompleted).toBe(false);
      expect(component.isAcceptingRide).toBe(false);
      expect(component.isStartingRide).toBe(false);
    });

    it('should fetch ride details on ngOnInit', () => {
      mockRideBookingService.getRideById.and.returnValue(of(mockRide));
      
      component.ngOnInit();
      
      expect(mockRideBookingService.getRideById).toHaveBeenCalledWith('ride-123');
    });
  });

  describe('fetchRideDetails', () => {
    it('should update ride details when ride is fetched successfully', fakeAsync(() => {
      mockRideBookingService.getRideById.and.returnValue(of(mockRide));
      
      component.fetchRideDetails('ride-123');
      tick();
      
      expect(component.ride).toEqual(mockRide);
      expect(component.driverId).toBe('driver-1');
    }));

    it('should set driverDetailsLoading to true when ride has no driver', fakeAsync(() => {
      const rideWithoutDriver = { ...mockRide, driverId: undefined };
      mockRideBookingService.getRideById.and.returnValue(of(rideWithoutDriver));
      
      component.fetchRideDetails('ride-123');
      tick();
      
      expect(component.driverDetailsLoading).toBe(true);
      expect(component.driverId).toBeUndefined();
    }));

    it('should set driverDetailsLoading to false when ride is completed', fakeAsync(() => {
      const completedRide = { ...mockRide, status: RideStatus.Completed };
      mockRideBookingService.getRideById.and.returnValue(of(completedRide));
      
      component.fetchRideDetails('ride-123');
      tick();
      
      expect(component.driverDetailsLoading).toBe(false);
      expect(component.driverId).toBeNull();
    }));

    it('should set driverDetailsLoading to false when ride is cancelled by user', fakeAsync(() => {
      const cancelledRide = { ...mockRide, status: RideStatus.CancelledByUser };
      mockRideBookingService.getRideById.and.returnValue(of(cancelledRide));
      
      component.fetchRideDetails('ride-123');
      tick();
      
      expect(component.driverDetailsLoading).toBe(false);
      expect(component.driverId).toBeNull();
    }));

    it('should handle null ride response', fakeAsync(() => {
      mockRideBookingService.getRideById.and.returnValue(of(null));
      
      component.fetchRideDetails('ride-123');
      tick();
      
      expect(component.ride).toBeNull();
    }));

    it('should unsubscribe when ride fetch returns null', fakeAsync(() => {
      mockRideBookingService.getRideById.and.returnValue(of(null));
      spyOn(component, 'ngOnDestroy');
      
      component.fetchRideDetails('ride-123');
      tick();
      
      expect(component.ngOnDestroy).toHaveBeenCalled();
    }));
  });

  describe('Cancel Ride', () => {
    beforeEach(() => {
      component.ride = { ...mockRide };
      spyOn(InternetUtils, 'IsOnline').and.returnValue(true);
    });

    it('should show cancel confirmation modal for rider', () => {
      component.userType = 'rider';
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      
      component.showCancelConfirmation();
      
      expect(mockConfirmationModal.confirm).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Confirm Cancellation',
          message: 'Are you sure you want to cancel this ride?'
        })
      );
    });

    it('should cancel ride by user when confirmed', fakeAsync(() => {
      component.userType = 'rider';
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      mockRideBookingService.cancelRideByUser.and.returnValue(of(mockRide));
      
      component.showCancelConfirmation();
      confirmSubject.next({ confirmed: true });
      tick();
      
      expect(mockRideBookingService.cancelRideByUser).toHaveBeenCalledWith('ride-123');
      expect(component.ride?.status).toBe(RideStatus.CancelledByUser);
      expect(component.isCancelling).toBe(false);
    }));

    it('should cancel ride by driver when confirmed', fakeAsync(() => {
      component.userType = 'driver';
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      mockRideBookingService.cancelRideByDriver.and.returnValue(of(mockRide));
      
      component.showCancelConfirmation();
      confirmSubject.next({ confirmed: true });
      tick();
      
      expect(mockRideBookingService.cancelRideByDriver).toHaveBeenCalledWith('ride-123');
      expect(component.ride?.status).toBe(RideStatus.CancelledByDriver);
    }));

    it('should not cancel ride when confirmation is declined', fakeAsync(() => {
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      
      component.showCancelConfirmation();
      confirmSubject.next({ confirmed: false });
      tick();
      
      expect(mockRideBookingService.cancelRideByUser).not.toHaveBeenCalled();
      expect(mockRideBookingService.cancelRideByDriver).not.toHaveBeenCalled();
    }));

    it('should handle cancel ride error', fakeAsync(() => {
      component.userType = 'rider';
      mockRideBookingService.cancelRideByUser.and.returnValue(
        throwError(() => new Error('Cancel failed'))
      );
      
      component.cancelRide();
      tick();
      
      expect(component.isCancelling).toBe(false);
    }));

    it('should not show cancel confirmation when offline', () => {
      (InternetUtils.IsOnline as jasmine.Spy).and.returnValue(false);
      
      component.showCancelConfirmation();
      
      expect(mockConfirmationModal.confirm).not.toHaveBeenCalled();
    });

    it('should not show cancel confirmation when not logged in', () => {
      mockAuthService.getUserId.and.returnValue(null);
      
      component.showCancelConfirmation();
      
      expect(mockConfirmationModal.confirm).not.toHaveBeenCalled();
    });

    it('should not show cancel confirmation when ride is null', () => {
      component.ride = null;
      
      component.showCancelConfirmation();
      
      expect(mockConfirmationModal.confirm).not.toHaveBeenCalled();
    });
  });

  describe('Mark As Completed', () => {
    beforeEach(() => {
      component.ride = { ...mockRide };
      spyOn(InternetUtils, 'IsOnline').and.returnValue(true);
    });

    it('should show mark completed confirmation modal', () => {
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      
      component.showMarkCompletedConfirmation();
      
      expect(mockConfirmationModal.confirm).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Confirm Completion',
          message: 'Has the passenger reached the drop-off location safely?'
        })
      );
    });

    it('should mark ride as completed when confirmed', fakeAsync(() => {
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      mockRideBookingService.markAsCompleted.and.returnValue(of(mockRide));
      
      component.showMarkCompletedConfirmation();
      confirmSubject.next({ confirmed: true });
      tick();
      
      expect(mockRideBookingService.markAsCompleted).toHaveBeenCalledWith('ride-123');
      expect(component.ride?.status).toBe(RideStatus.Completed);
      expect(component.isMarkingCompleted).toBe(false);
    }));

    it('should handle mark completed error', fakeAsync(() => {
      mockRideBookingService.markAsCompleted.and.returnValue(
        throwError(() => new Error('Mark completed failed'))
      );
      
      component.markAsCompleted();
      tick();
      
      expect(component.isMarkingCompleted).toBe(false);
    }));
  });

  describe('Accept Ride (Driver)', () => {
    beforeEach(() => {
      component.ride = { ...mockRide };
      component.userType = 'driver';
      mockAuthService.getUserId.and.returnValue('driver-1');
      spyOn(InternetUtils, 'IsOnline').and.returnValue(true);
    });

    it('should show accept confirmation modal for driver', () => {
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      
      component.showAcceptConfirmation();
      
      expect(mockConfirmationModal.confirm).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Accept Ride',
          message: 'Confirm you\'re available to take this ride.'
        })
      );
    });

    it('should accept ride when confirmed', fakeAsync(() => {
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      mockRideBookingService.assignDriver.and.returnValue(of(mockRide));
      
      component.showAcceptConfirmation();
      confirmSubject.next({ confirmed: true });
      tick();
      
      expect(mockRideBookingService.assignDriver).toHaveBeenCalledWith('ride-123', 'driver-1');
      expect(component.ride?.status).toBe(RideStatus.ConfirmedByDriver);
      expect(component.isAcceptingRide).toBe(false);
    }));

    it('should handle already assigned error', fakeAsync(() => {
      mockRideBookingService.assignDriver.and.returnValue(
        throwError(() => ({ message: 'Ride is already assigned to a driver.' }))
      );
      
      component.acceptRide();
      tick();
      
      expect(component.isAcceptingRide).toBe(false);
    }));

    it('should not show accept confirmation for non-driver', () => {
      component.userType = 'rider';
      
      component.showAcceptConfirmation();
      
      expect(mockConfirmationModal.confirm).not.toHaveBeenCalled();
    });
  });

  describe('Start Ride (Driver)', () => {
    beforeEach(() => {
      component.ride = { ...mockRide };
      component.userType = 'driver';
      spyOn(InternetUtils, 'IsOnline').and.returnValue(true);
    });

    it('should show start confirmation modal', () => {
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      
      component.showStartConfirmation();
      
      expect(mockConfirmationModal.confirm).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Start Ride',
          message: 'Is the passenger in the vehicle and ready to go?'
        })
      );
    });

    it('should start ride when confirmed', fakeAsync(() => {
      const confirmSubject = new Subject<{ confirmed: boolean }>();
      mockConfirmationModal.confirm.and.returnValue(confirmSubject.asObservable());
      mockRideBookingService.startRide.and.returnValue(of(mockRide));
      
      component.showStartConfirmation();
      confirmSubject.next({ confirmed: true });
      tick();
      
      expect(mockRideBookingService.startRide).toHaveBeenCalledWith('ride-123');
      expect(component.ride?.status).toBe(RideStatus.Ongoing);
      expect(component.isStartingRide).toBe(false);
    }));

    it('should handle start ride error with error message', fakeAsync(() => {
      mockRideBookingService.startRide.and.returnValue(
        throwError(() => ({ error: { error: 'Cannot start ride' } }))
      );
      
      component.startRide();
      tick();
      
      expect(component.isStartingRide).toBe(false);
    }));
  });

  describe('determineStatusText', () => {
    it('should return correct text for LookingForDriver status', () => {
      expect(component.determineStatusText(RideStatus.LookingForDriver))
        .toBe('Looking for Driver');
    });

    it('should return correct text for Ongoing status', () => {
      expect(component.determineStatusText(RideStatus.Ongoing))
        .toBe('Ride in Progress');
    });

    it('should return correct text for Completed status', () => {
      expect(component.determineStatusText(RideStatus.Completed))
        .toBe('Completed');
    });

    it('should return "Cancelled by You" for rider when CancelledByUser', () => {
      component.userType = 'rider';
      expect(component.determineStatusText(RideStatus.CancelledByUser))
        .toBe('Cancelled by You');
    });

    it('should return "Cancelled by User" for driver when CancelledByUser', () => {
      component.userType = 'driver';
      expect(component.determineStatusText(RideStatus.CancelledByUser))
        .toBe('Cancelled by User');
    });

    it('should return "Cancelled by Driver" for CancelledByDriver status', () => {
      expect(component.determineStatusText(RideStatus.CancelledByDriver))
        .toBe('Cancelled by Driver');
    });

    it('should return "Confirmed by You" for driver when they confirmed', () => {
      component.userType = 'driver';
      component.userId = 'driver-1';
      component.ride = { ...mockRide, driverId: 'driver-1' };
      
      expect(component.determineStatusText(RideStatus.ConfirmedByDriver))
        .toBe('Confirmed by You');
    });

    it('should return "Confirmed by Other" for driver when another driver confirmed', () => {
      component.userType = 'driver';
      component.userId = 'driver-1';
      component.ride = { ...mockRide, driverId: 'driver-2' };
      
      expect(component.determineStatusText(RideStatus.ConfirmedByDriver))
        .toBe('Confirmed by Other');
    });

    it('should return "Confirmed by Driver" for rider', () => {
      component.userType = 'rider';
      expect(component.determineStatusText(RideStatus.ConfirmedByDriver))
        .toBe('Confirmed by Driver');
    });
  });

  describe('goToPayment', () => {
    beforeEach(() => {
      component.ride = { ...mockRide };
      spyOn(InternetUtils, 'IsOnline').and.returnValue(true);
      spyOn(window, 'open');
    });

    it('should open payment page in new tab', () => {
      component.goToPayment();
      
      const expectedUrl = `driver/payment-page/${mockRide.rideId}/${mockRide.pickupLocation}/${mockRide.dropLocation}/${mockRide.fare}`;
      expect(window.open).toHaveBeenCalledWith(expectedUrl, '_blank');
    });

    it('should not open payment page when offline', () => {
      (InternetUtils.IsOnline as jasmine.Spy).and.returnValue(false);
      
      component.goToPayment();
      
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should not open payment page when ride is null', () => {
      component.ride = null;
      
      component.goToPayment();
      
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from ride updates', () => {
      mockRideBookingService.getRideById.and.returnValue(of(mockRide));
      component.fetchRideDetails('ride-123');
      
      const subscription = component['rideUpdateSubscription'];
      spyOn(subscription!, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(subscription!.unsubscribe).toHaveBeenCalled();
    });

    it('should not throw error when subscription is null', () => {
      component['rideUpdateSubscription'] = null;
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});