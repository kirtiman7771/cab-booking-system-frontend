import { Component, OnInit } from '@angular/core';
import { DriverRideHistoryService } from '../../services/driver-ride-history.service';
import { RideStatus } from '../../../ride-booking/models/RideStatus';
import { RideHistory } from '../../../rider/models/RideHistory';

@Component({
  selector: 'app-driver-ride-history',
  standalone: false,
  templateUrl: './driver-ride-history.component.html',
  styleUrl: './driver-ride-history.component.css',
})
export class DriverRideHistoryComponent implements OnInit {
  rideHistoryList: RideHistory[] = [];
  filteredList: RideHistory[] = [];
  filterType: 'all' | 'completed' | 'cancelled' = 'all';
  driverId: string = '';
  rideStatus = RideStatus;

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  paginatedList: RideHistory[] = [];

  constructor(private driverRideHistoryService: DriverRideHistoryService) {}

  ngOnInit(): void {
    const savedDriver = localStorage.getItem('authUser');
    if (savedDriver) {
      const authDriver = JSON.parse(savedDriver);
      // NOTE: Ensure 'id' is the correct property for the driver's ID in your 'authUser' object.
      // If it uses 'userId' for drivers as well, change 'authDriver.id' to 'authDriver.userId'.
      this.driverId = authDriver.userId; 

      if (this.driverId) {
        this.driverRideHistoryService
          .getDriverRideHistory(this.driverId)
          .subscribe({
            next: (data) => {
              this.rideHistoryList = data;
              this.filteredList = data;
              this.updatePagination(); // Initialize pagination
            },
            error: (err) => (JSON.stringify(err)),
          });
      }
    }
  }

  // --- Filtering Methods ---

  showCompleted(): void {
    this.filterType = 'completed';
    this.filteredList = this.rideHistoryList.filter(
      (r) => r.status === this.rideStatus.Completed
    );
    this.currentPage = 1; // Reset to page 1 on filter change
    this.updatePagination();
  }

  showCancelled(): void {
    this.filterType = 'cancelled';
    this.filteredList = this.rideHistoryList.filter(
      (r) => r.status === this.rideStatus.CancelledByDriver || r.status === this.rideStatus.CancelledByUser
    );
    this.currentPage = 1; // Reset to page 1 on filter change
    this.updatePagination();
  }

  showAll(): void {
    this.filterType = 'all';
    this.filteredList = this.rideHistoryList;
    this.currentPage = 1; // Reset to page 1 on filter change
    this.updatePagination();
  }

  // --- Pagination Logic ---

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredList.length / this.itemsPerPage);
    // Adjust currentPage if it exceeds new totalPages after filtering
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
        this.currentPage = 1;
    }
    
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
}