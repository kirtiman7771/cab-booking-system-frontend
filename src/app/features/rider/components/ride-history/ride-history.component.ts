import { Component, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { RideHistoryService } from '../../services/ride-history.service';

import { RatingSubmissionComponent } from '../../../rating-and-feedback/components/rating-submission/rating-submission.component';

import { RideStatus } from '../../../ride-booking/models/RideStatus';

import { RideHistory } from '../../models/RideHistory';

import { PaymentService } from '../../../payment/services/payment.service';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-ride-history',

  templateUrl: './ride-history.component.html',

  standalone: false,

  styleUrls: ['./ride-history.component.css'],
})
export class RideHistoryComponent implements OnInit {
  rideHistoryList: RideHistory[] = [];

  filteredList: RideHistory[] = [];

  filterType: 'all' | 'reviewed' | 'notReviewed' = 'all';

  userId: string = '';

  rideStatus = RideStatus;

  ratingData: { rating: number } | null;

  constructor(
    private rideHistoryService: RideHistoryService,
    private dialog: MatDialog,
    private paymentService: PaymentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('authUser');

    if (savedUser) {
      const authUser = JSON.parse(savedUser);

      this.userId = authUser.userId;

      console.log('get userId...', this.userId);

      if (this.userId) {
        this.rideHistoryService.getAllRideHistory(this.userId).subscribe({
          next: (data) => {
            this.rideHistoryList = data;

            this.filteredList = data;

            this.rideHistoryList.forEach((value) => {
              console.log(value);
            });

            //pagination line below

            this.updatePagination();
          },
          error: (err) => JSON.stringify(err),
        });
      }
    }
  }

  //the button will open ride feedback submission

  openRatingSubmission(ride: RideHistory): void {
    this.dialog.open(RatingSubmissionComponent, {
      data: ride,

      width: '500px',
    });
  }

  showReviewed(): void {
    this.filterType = 'reviewed';

    //Filter to include only rides where rating exists and rating value is > 0

    this.filteredList = this.rideHistoryList.filter(
      (r) => r.rating && r.rating.rating && r.rating.rating > 0
    );

    //pagination

    this.currentPage = 1;

    this.updatePagination();
  }

  showNotReviewed(): void {
    this.filterType = 'notReviewed';

    // Filter to completed rides where rating is null/undefined OR rating value is 0 or less
    this.filteredList = this.rideHistoryList.filter(
      (r) =>
        r.status === this.rideStatus.Completed &&
        (!r.rating || !r.rating.rating || r.rating.rating <= 0)
    );

    // pagination
    this.currentPage = 1;
    this.updatePagination();
  }

  showAll(): void {
    this.filterType = 'all';

    this.filteredList = this.rideHistoryList;

    //pagination

    this.currentPage = 1;

    this.updatePagination();
  }

  //pagination

  currentPage: number = 1;

  itemsPerPage: number = 5;

  totalPages: number = 1;

  paginatedList: RideHistory[] = [];

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredList.length / this.itemsPerPage);

    const start = (this.currentPage - 1) * this.itemsPerPage;

    const end = start + this.itemsPerPage;

    this.paginatedList = this.filteredList.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;

      this.updatePagination();
    }
  }

  get reviewed(): boolean {
    // A ride is reviewed if ratingData is not null/undefined AND the rating is greater than 0

    return !!this.ratingData && this.ratingData.rating > 0;
  }

  downloadReceipt(rideId: string) {
    this.paymentService.getReceiptPdf(rideId).subscribe({
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
        a.download = `receipt_${this.paginatedList[0].rideId}.pdf`;
        // 5. Simulate a click on the temporary element to start the download
        document.body.appendChild(a);
        a.click();
        // 6. Clean up: remove the element and revoke the temporary URL
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.messageService.sendMessage(
          'success',
          'Receipt downloaded successfully.'
        );
      },
      error: (err) => {
        console.error('Error downloading receipt PDF:', err);
        // this.messageService.sendMessage('error', 'Failed to download receipt. Please try again.');
      },
    });
  }
}
