import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common'; // Assuming you use this for standalone: true or in a module
import { FormsModule } from '@angular/forms'; // Assuming you use this for [(ngModel)]
import { PaymentReceiptComponent } from '../payment-receipt/payment-receipt.component'; // Adjust path as necessary
import { ApiService } from '../../../../core/services/api.service'; // Original ApiService
import { PaymentService } from '../../services/payment.service'; // Dedicated PaymentService
import { RideBookingService } from '../../../ride-booking/services/impl/ride-booking.service'; // Ride service
import { Ride } from '../../../ride-booking/models/Ride'; // Ride model
import { PaymentPayload } from '../../model/PaymentPayload'; // Payment payload model
import { lastValueFrom, take } from 'rxjs'; // For better async handling (though not strictly necessary with .subscribe)
import { MessageService } from '../../../../core/services/message.service';


@Component({
  selector: 'app-payement',
  standalone: false,
  templateUrl: './payement.component.html',
  styleUrl: './payement.component.css',
  // You might need to list CommonModule and FormsModule here if this were standalone: true
})
export class PayementComponent {
  isLoading: boolean = true;
  rideDetails!: Ride;

  // --- Payment State Properties ---
  selectedPaymentMethod: string = '';
  paymentStatus: 'selecting' | 'processing' | 'completed' | 'failed' = 'selecting';
  message: string = '';

  // --- UPI Verification Properties 
  upiIDInput: string = '';
  upiIDVerified: boolean = false; 
  upiVerificationStatus: 'pending' | 'verifying' | 'verified' | 'failed' = 'pending';
  // ---------------------------------------------

  constructor(
    private route: Router,
    private router: ActivatedRoute,
    private apiService: PaymentService, // Renamed from ApiService in your code
    private dialog: MatDialog,
    private rideBookingService: RideBookingService,
    private messageService: MessageService
  ) {

    this.fetchRideDetails(this.router.snapshot.params['rideId']);
  }



  /**
   * Determines if the main payment button should be disabled.
   * Logic: Disabled if processing OR no method selected OR (UPI selected AND not verified).
   */
  isPaymentButtonDisabled(): boolean {
    if (this.paymentStatus === 'processing') {
      return true;
    }

    if (!this.selectedPaymentMethod) {
      return true;
    }

    // Key validation for UPI: requires successful verification
    if (this.selectedPaymentMethod === 'upi') {
      return !this.upiIDVerified;
    }

    return false;
  }

  getButtonText(): string {
    if (this.paymentStatus === 'processing') {
      return 'Processing...';
    } else if (this.selectedPaymentMethod === 'cash') {
      return 'Book Ride';
    } else if (this.selectedPaymentMethod === 'upi' || this.selectedPaymentMethod === 'card') {
      return `Pay ₹${this.rideDetails?.fare?.toFixed(2) || 0}`;
    }
    return 'Select a method';
  }

  fetchRideDetails(rideId: string): void {
      this.rideBookingService.getRideById(rideId).pipe(take(1))
        .subscribe((ride) => {
       
          this.rideDetails = ride 
          console.log("userid",this.rideDetails.userId);
  
          
        });
    }

  getAlertClass(): string {
    switch (this.paymentStatus) {
      case 'completed':
        return 'alert-success';
      case 'processing':
        return 'alert-info';
      case 'failed':
        return 'alert-danger';
      default:
        return '';
    }
  }

  /**
   * Simulates the API call to verify a UPI ID.
   */
  verifyUpiId(): void {
    // Check if input is present before starting
    if (!this.upiIDInput || this.upiIDInput.trim() === '') {
        this.message = 'Please enter your UPI ID.';
        this.upiVerificationStatus = 'failed';
        return;
    }

    // Reset previous state and start verifying
    this.upiIDVerified = false;
    this.upiVerificationStatus = 'verifying';
    this.message = 'Verifying UPI ID...';

    // Simulate API call delay for verification (e.g., 1 second)
    setTimeout(() => {
      // Simple validation: check for '@'
      if (this.upiIDInput.includes('@')) { 
        this.upiIDVerified = true;
        this.upiVerificationStatus = 'verified';
        this.message = 'UPI ID verified successfully.';
      } else {
        this.upiIDVerified = false;
        this.upiVerificationStatus = 'failed';
        this.message = 'Invalid UPI ID format. Please check and try again.';
      }
    }, 1000);
  }

  /**
   * Handles the final payment processing.
   */
  async processPayment(): Promise<void> {
    if (this.isPaymentButtonDisabled()) {
      // Display a more specific message if UPI is selected but not verifiegid
      if (this.selectedPaymentMethod === 'upi' && !this.upiIDVerified) {
          this.message = 'Please verify your UPI ID before proceeding with payment.';
      } else {
          this.message = 'Please select a payment method or wait for the current process to finish.';
      }
      this.paymentStatus = 'failed';
      return;
    }

    this.paymentStatus = 'processing';
    this.message = `Processing your ${this.selectedPaymentMethod} payment...`;

    // const rideData = this.userData[0];
    if (!this.rideDetails) {
      this.message = 'Error: Trip data not found.';
      this.paymentStatus = 'failed';
      return;
    }

    // Prepare the payment payload
    const paymentPayload: PaymentPayload = {
      rideID: this.rideDetails.rideId,
      userID: this.rideDetails.userId,
      amount: this.rideDetails.fare,
      method: this.selectedPaymentMethod,
      status: 'pending',
      timestamp: new Date().toISOString(),
      pickupLocation: this.rideDetails.pickupLocation,
      dropLocation: this.rideDetails.dropLocation,
      receipientEmail: this.rideDetails.receipientEmail || ''
    };

    try {
      // 1. Simulate frontend payment process delay (for non-cash methods)
      if (this.selectedPaymentMethod !== 'cash') {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 2. Determine final status for backend
      const finalStatus = this.selectedPaymentMethod === 'cash' ? 'cash_booked' : 'paid';
      paymentPayload.status = finalStatus;

      // 3. Call the backend API to record/update the payment status
      this.apiService.submitPayment(paymentPayload).subscribe({
        next: (value) => {
          this.paymentStatus = 'completed'; // <--- This switches the view to the success message
          if (this.selectedPaymentMethod === 'cash') {
            this.message = 'Ride booked! Your payment is due to the driver upon arrival.';
          } else {
            this.message = 'Payment successful! Your ride is confirmed and paid for.';
          }
          // this.messageService.sendMessage('success', 'Receipt downloaded successfully.');
          this.messageService.sendMessage('success', 'Payment processed successfully.');
        },
        error: (err: any) => {
          console.error('Payment processing failed:', err);
          this.paymentStatus = 'failed';
          
          // Reset UPI status on failure
          if (this.selectedPaymentMethod === 'upi') {
              this.upiIDVerified = false;
              this.upiVerificationStatus = 'failed';
          }
          
          // Set the message based on the error
          if (err.error) {
            if (typeof err.error === 'string') {
              this.message = 'Error: ' + err.error;
              this.messageService.sendMessage('error', this.message);
            } else if (err.error.message) {
              this.message = 'Payment failed: ' + err.error.message;
              this.messageService.sendMessage('error', this.message);
            } else {
              this.message = 'Payment failed. Please check your details and try again.';
              this.messageService.sendMessage('error', this.message);
            }
          } else {
            this.message = 'A network error occurred. Please try again in a moment.';
            this.messageService.sendMessage('error', this.message); 
          }
        }
      })

    } catch (error) {
      console.error('Payment processing error:', error);
      // Update frontend state on failure
      this.paymentStatus = 'failed';
      this.message = `Payment failed for ${this.selectedPaymentMethod}. Please try again.`;
      this.messageService.sendMessage('error', this.message);
      // Reset UPI status on failure
      if (this.selectedPaymentMethod === 'upi') {
          this.upiIDVerified = false;
          this.upiVerificationStatus = 'failed';
      }

      // Log the failed attempt to the backend
      paymentPayload.status = 'failed';
      this.apiService.submitPayment(paymentPayload).subscribe();
      this.getButtonText()
    }
  }

  viewReceipt(): void {
    this.dialog.open(PaymentReceiptComponent, {
      data: {rideId: this.rideDetails.rideId, pickup: this.rideDetails.pickupLocation, drop: this.rideDetails.dropLocation, fare: this.rideDetails.fare}
    });
  }

  reset(): void {
    this.selectedPaymentMethod = '';
    this.paymentStatus = 'selecting';
    this.message = '';
    
    // Reset UPI fields when resetting the form
    this.upiIDInput = '';
    this.upiIDVerified = false;
    this.upiVerificationStatus = 'pending';
  }
}