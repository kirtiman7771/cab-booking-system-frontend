import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms'; // Import for [(ngModel)] usage

// Components and Services under test/mocking

import { PaymentService } from '../../services/payment.service';
import { RideBookingService } from '../../../ride-booking/services/impl/ride-booking.service';
import { MessageService } from '../../../../core/services/message.service';
import { Ride } from '../../../ride-booking/models/Ride'; 
import { PaymentReceiptComponent } from '../payment-receipt/payment-receipt.component'; // Used by MatDialog
import { PayementComponent } from './payement.component';

// --- Mocking Services ---

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockActivatedRoute {
  // Simulate a snapshot with a 'rideId' parameter
  snapshot = {
    params: {
      rideId: 'RIDE123'
    }
  };
}

class MockMatDialog {
  open = jasmine.createSpy('open');
}

class MockPaymentService {
  submitPayment = jasmine.createSpy('submitPayment').and.returnValue(of({ success: true }));
  getPaymentData = jasmine.createSpy('getPaymentData').and.returnValue(of({}));
}

class MockRideBookingService {
  // Provide a mock ride for getRideById
  // Note: status is set to 'Confirmed' as any to bypass the specific RideStatus type check.
  // dateTime is added, and extraneous properties are removed to match the Ride interface.
  mockRide: Ride = {
    rideId: 'RIDE123',
    userId: 'USER123',
    driverId: 'DRV456',
    fare: 450.75,
    status: 'Confirmed' as any,
    pickupLocation: 'Start Point',
    dropLocation: 'End Point',
    dateTime: new Date(),
  };
  getRideById = jasmine.createSpy('getRideById').and.returnValue(of(this.mockRide));
}

class MockMessageService {
  sendMessage = jasmine.createSpy('sendMessage');
}

// --- Test Suite ---

describe('PayementComponent', () => {
  let component: PayementComponent;
  let fixture: ComponentFixture<PayementComponent>;
  let mockPaymentService: MockPaymentService;
  let mockRideBookingService: MockRideBookingService;
  let mockMessageService: MockMessageService;
  let mockMatDialog: MockMatDialog;

  // Setup function to initialize the component and services
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // FIX 1: Use declarations for PayementComponent since it is standalone: false
      declarations: [PayementComponent], 
      imports: [FormsModule], // Keep modules like FormsModule here
      providers: [
        { provide: Router, useClass: MockRouter },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: MatDialog, useClass: MockMatDialog },
        { provide: PaymentService, useClass: MockPaymentService },
        { provide: RideBookingService, useClass: MockRideBookingService },
        { provide: MessageService, useClass: MockMessageService }
      ]
    })
    .compileComponents();
  });

  // Setup before each test
  beforeEach(() => {
    fixture = TestBed.createComponent(PayementComponent);
    component = fixture.componentInstance;
    mockPaymentService = TestBed.inject(PaymentService) as unknown as MockPaymentService;
    mockRideBookingService = TestBed.inject(RideBookingService) as unknown as MockRideBookingService;
    mockMessageService = TestBed.inject(MessageService) as unknown as MockMessageService;
    mockMatDialog = TestBed.inject(MatDialog) as unknown as MockMatDialog;
    
    // Manually trigger initial data fetch (which happens in the constructor)
    fixture.detectChanges(); 
    
    // Assume ride details are loaded for most tests
    component.rideDetails = mockRideBookingService.mockRide;
  });

  // ---------------------------------------------
  // --- Initial State Tests ---
  // ---------------------------------------------
  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should fetch ride details on construction', () => {
      expect(mockRideBookingService.getRideById).toHaveBeenCalledWith('RIDE123');
      expect(component.rideDetails).toEqual(mockRideBookingService.mockRide);
    });

    it('should have initial state set correctly', () => {
      expect(component.selectedPaymentMethod).toBe('');
      expect(component.paymentStatus).toBe('selecting');
    });
  });

  // ---------------------------------------------
  // --- Button State and Text Tests ---
  // ---------------------------------------------
  describe('Button Logic', () => {
    it('isPaymentButtonDisabled should be true when no payment method is selected', () => {
      component.selectedPaymentMethod = '';
      expect(component.isPaymentButtonDisabled()).toBe(true);
    });

    it('isPaymentButtonDisabled should be true when payment is processing', () => {
      component.selectedPaymentMethod = 'card';
      component.paymentStatus = 'processing';
      expect(component.isPaymentButtonDisabled()).toBe(true);
    });

    it('isPaymentButtonDisabled should be true for UPI if not verified', () => {
      component.selectedPaymentMethod = 'upi';
      component.upiIDVerified = false;
      expect(component.isPaymentButtonDisabled()).toBe(true);
    });

    it('isPaymentButtonDisabled should be false for UPI if verified', () => {
      component.selectedPaymentMethod = 'upi';
      component.upiIDVerified = true;
      expect(component.isPaymentButtonDisabled()).toBe(false);
    });

    it('isPaymentButtonDisabled should be false for Card', () => {
      component.selectedPaymentMethod = 'card';
      expect(component.isPaymentButtonDisabled()).toBe(false);
    });

    it('isPaymentButtonDisabled should be false for Cash', () => {
      component.selectedPaymentMethod = 'cash';
      expect(component.isPaymentButtonDisabled()).toBe(false);
    });

    it('getButtonText should show "Select a method" when none is selected', () => {
      component.selectedPaymentMethod = '';
      expect(component.getButtonText()).toBe('Select a method');
    });

    it('getButtonText should show "Processing..." when processing', () => {
      component.paymentStatus = 'processing';
      expect(component.getButtonText()).toBe('Processing...');
    });

    it('getButtonText should show "Book Ride" for cash', () => {
      component.selectedPaymentMethod = 'cash';
      expect(component.getButtonText()).toBe('Book Ride');
    });

    it('getButtonText should show "Pay..." for card/upi with fare', () => {
      component.selectedPaymentMethod = 'card';
      expect(component.getButtonText()).toBe('Pay ₹450.75');
      component.selectedPaymentMethod = 'upi';
      expect(component.getButtonText()).toBe('Pay ₹450.75');
    });
  });

  // ---------------------------------------------
  // --- UPI Verification Tests ---
  // ---------------------------------------------
  describe('UPI Verification', () => {
    it('should fail verification if UPI ID is empty', () => {
      component.upiIDInput = '';
      component.verifyUpiId();
      expect(component.upiVerificationStatus).toBe('failed');
      expect(component.message).toBe('Please enter your UPI ID.');
      expect(component.upiIDVerified).toBe(false);
    });

    it('should successfully verify a valid UPI ID after delay', fakeAsync(() => {
      component.upiIDInput = 'test@bank';
      component.verifyUpiId();
      
      expect(component.upiVerificationStatus).toBe('verifying');
      expect(component.message).toBe('Verifying UPI ID...');

      tick(1000); // Simulate the setTimeout delay

      expect(component.upiVerificationStatus).toBe('verified');
      expect(component.message).toBe('UPI ID verified successfully.');
      expect(component.upiIDVerified).toBe(true);
    }));

    it('should fail verification for an invalid UPI ID after delay', fakeAsync(() => {
      component.upiIDInput = 'invalidupi.com';
      component.verifyUpiId();
      
      tick(1000); // Simulate the setTimeout delay

      expect(component.upiVerificationStatus).toBe('failed');
      expect(component.message).toBe('Invalid UPI ID format. Please check and try again.');
      expect(component.upiIDVerified).toBe(false);
    }));
  });

  // ---------------------------------------------
  // --- Payment Processing Tests ---
  // ---------------------------------------------
  describe('Payment Processing', () => {

    it('should set status to failed and show message if validation fails', async () => {
      component.selectedPaymentMethod = '';
      await component.processPayment();
      
      expect(component.paymentStatus).toBe('failed');
      expect(component.message).toContain('Please select a payment method');
      expect(mockPaymentService.submitPayment).not.toHaveBeenCalled();
    });

    // Test successful cash payment
    it('should successfully process cash payment and call submitPayment with "cash_booked"', fakeAsync(async () => {
      component.selectedPaymentMethod = 'cash';
      
      await component.processPayment();
      
      tick(); // Resolve the subscription

      // Check if submitPayment was called with the correct status
      expect(mockPaymentService.submitPayment).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'cash_booked' }));
      
      // Check final state
      expect(component.paymentStatus).toBe('completed');
      expect(component.message).toContain('Ride booked! Your payment is due to the driver');
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith('success', 'Payment processed successfully.');
    }));

    // Test successful card payment
    it('should successfully process card payment and call submitPayment with "paid" after delay', fakeAsync(async () => {
      component.selectedPaymentMethod = 'card';
      let promiseResolved = false;
      
      const processPromise = component.processPayment().then(() => promiseResolved = true);
      
      // Check processing state before delay
      expect(component.paymentStatus).toBe('processing');
      
      tick(1500); // Simulate the frontend payment delay
      
      expect(mockPaymentService.submitPayment).toHaveBeenCalled();
      
      tick(); // Resolve the subscription

      // Check final state
      expect(component.paymentStatus).toBe('completed');
      expect(component.message).toContain('Payment successful! Your ride is confirmed and paid for.');
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith('success', 'Payment processed successfully.');
      expect(mockPaymentService.submitPayment).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'paid' }));
      
      // Ensure the async function has completed
      await processPromise;
      expect(promiseResolved).toBe(true);
    }));
    
    // Test API failure
    it('should handle API failure correctly, reset state, and send error message', fakeAsync(async () => {
      component.selectedPaymentMethod = 'card';
      (mockPaymentService.submitPayment as jasmine.Spy).and.returnValue(throwError(() => ({ 
        error: { message: 'Gateway error' } 
      })));
      
      await component.processPayment();
      
      tick(1500); // Simulate delay
      tick(); // Resolve the subscription/error

      expect(component.paymentStatus).toBe('failed');
      expect(component.message).toContain('Payment failed: Gateway error');
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith('error', 'Payment failed: Gateway error');
    }));

    // Test API failure with UPI - should reset UPI state
    it('should reset UPI state if payment fails for UPI', fakeAsync(async () => {
      component.selectedPaymentMethod = 'upi';
      component.upiIDVerified = true;
      (mockPaymentService.submitPayment as jasmine.Spy).and.returnValue(throwError(() => ({ 
        error: { message: 'UPI server down' } 
      })));
      
      await component.processPayment();
      
      tick(1500); // Simulate delay
      tick(); // Resolve the subscription/error

      expect(component.paymentStatus).toBe('failed');
      expect(component.upiIDVerified).toBe(false);
      expect(component.upiVerificationStatus).toBe('failed');
    }));

  });

  // ---------------------------------------------
  // --- Utility Tests ---
  // ---------------------------------------------
  describe('Utility Methods', () => {
    it('getAlertClass should return correct class for paymentStatus', () => {
      component.paymentStatus = 'completed';
      expect(component.getAlertClass()).toBe('alert-success');
      
      component.paymentStatus = 'processing';
      expect(component.getAlertClass()).toBe('alert-info');
      
      component.paymentStatus = 'failed';
      expect(component.getAlertClass()).toBe('alert-danger');

      component.paymentStatus = 'selecting';
      expect(component.getAlertClass()).toBe('');
    });

    it('viewReceipt should open the MatDialog with correct data', () => {
      component.viewReceipt();
      // FIX 2: Added pickup and drop to the expectation to match the actual call
      expect(mockMatDialog.open).toHaveBeenCalledWith(
        PaymentReceiptComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            rideId: component.rideDetails.rideId,
            fare: component.rideDetails.fare,
            pickup: component.rideDetails.pickupLocation, // Added
            drop: component.rideDetails.dropLocation      // Added
          })
        })
      );
    });
    
    it('reset should reset all state properties', () => {
      // Set to non-default values
      component.selectedPaymentMethod = 'card';
      component.paymentStatus = 'failed';
      component.message = 'An error occurred';
      component.upiIDInput = 'test@upi';
      component.upiIDVerified = true;
      component.upiVerificationStatus = 'verified';

      component.reset();

      // Check reset values
      expect(component.selectedPaymentMethod).toBe('');
      expect(component.paymentStatus).toBe('selecting');
      expect(component.message).toBe('');
      expect(component.upiIDInput).toBe('');
      expect(component.upiIDVerified).toBe(false);
      expect(component.upiVerificationStatus).toBe('pending');
    });
  });
});