// frontend/src/app/components/payment-receipt/payment-receipt.component.ts

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { PaymentData } from '../../model/PaymentReceiptRequest';
import { PaymentService } from '../../services/payment.service';
import { ActivatedRoute } from '@angular/router';



@Component({
  selector: 'app-payment-receipt',
  standalone: false,
  templateUrl: './payment-receipt.component.html',
  styleUrl: './payment-receipt.component.css'
})
export class PaymentReceiptComponent {
  rideId: string;

  // userDataList is an array, but we assume it contains data for a single ride
  constructor(
    @Inject(MAT_DIALOG_DATA) public userDataList: PaymentData,
    private paymentService: PaymentService,
    private router : ActivatedRoute,
   
  ) { 
    this.rideId = this.router.snapshot.params['rideId']
  }

  // 1. Function to handle the download
  downloadReceipt(): void {
   

    // Call the API service to get the PDF as an ArrayBuffer
    this.paymentService.getReceiptPdf(this.rideId).subscribe({
      next: (pdfArrayBuffer: ArrayBuffer) => {
        // The backend sets the filename in the Content-Disposition header, 
        // but we need to create the link element manually on the client side.

        // 2. Create a Blob from the ArrayBuffer, specifying the type as PDF
        const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

        // 3. Create a temporary URL for the Blob
        const url = window.URL.createObjectURL(blob);

        // 4. Create a temporary <a> element to trigger the download
        const a = document.createElement('a');
        a.href = url;

        // Use a default filename if the Content-Disposition is not automatically processed by the browser
        a.download = `receipt_${this.rideId}.pdf`;

        // 5. Simulate a click on the temporary element to start the download
        document.body.appendChild(a);
        a.click();

        // 6. Clean up: remove the element and revoke the temporary URL
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading receipt PDF:', err);
        alert('Failed to download receipt. Please try again.');
      }
    });
  }
}