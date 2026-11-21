import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverRideHistoryComponent } from './driver-ride-history.component';
import { DriverRideHistoryService } from '../../services/driver-ride-history.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RideStatus } from '../../../ride-booking/models/RideStatus';

const mockRides = [
  { rideId: 'RID111111111', status: RideStatus.Completed, pickupLocation: 'A', dropLocation: 'B', fare: 100, dateTime: new Date(), rating: { rating: 4 } },
  { rideId: 'RID222222222', status: RideStatus.CancelledByUser, pickupLocation: 'C', dropLocation: 'D', fare: 50, dateTime: new Date(), rating: null },
  { rideId: 'RID333333333', status: RideStatus.Ongoing, pickupLocation: 'E', dropLocation: 'F', fare: 75, dateTime: new Date(), rating: null },
  { rideId: 'RID444444444', status: RideStatus.Completed, pickupLocation: 'G', dropLocation: 'H', fare: 120, dateTime: new Date(), rating: { rating: 5 } },
  { rideId: 'RID555555555', status: RideStatus.CancelledByDriver, pickupLocation: 'I', dropLocation: 'J', fare: 40, dateTime: new Date(), rating: null },
  { rideId: 'RID666666666', status: RideStatus.LookingForDriver, pickupLocation: 'K', dropLocation: 'L', fare: 60, dateTime: new Date(), rating: null },
  { rideId: 'RID777777777', status: RideStatus.ConfirmedByDriver, pickupLocation: 'M', dropLocation: 'N', fare: 90, dateTime: new Date(), rating: null }
];

class MockDriverRideHistoryService {
  getDriverRideHistory = jasmine.createSpy('getDriverRideHistory').and.returnValue(of(mockRides));
}

describe('DriverRideHistoryComponent', () => {
  let component: DriverRideHistoryComponent;
  let fixture: ComponentFixture<DriverRideHistoryComponent>;
  let service: MockDriverRideHistoryService;

  beforeEach(async () => {
    localStorage.setItem('authUser', JSON.stringify({ userId: 'driver123' }));
    await TestBed.configureTestingModule({
      declarations: [DriverRideHistoryComponent],
      providers: [{ provide: DriverRideHistoryService, useClass: MockDriverRideHistoryService }],
      schemas: [NO_ERRORS_SCHEMA] // ignore template details
    }).compileComponents();

    fixture = TestBed.createComponent(DriverRideHistoryComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(DriverRideHistoryService) as unknown as MockDriverRideHistoryService;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should load ride history on init', () => {
    component.ngOnInit();
    expect(service.getDriverRideHistory).toHaveBeenCalledWith('driver123');
    expect(component.rideHistoryList.length).toBe(mockRides.length);
    expect(component.filteredList.length).toBe(mockRides.length);
    expect(component.totalPages).toBe(Math.ceil(mockRides.length / component.itemsPerPage));
    expect(component.paginatedList.length).toBe(component.itemsPerPage);
  });

  it('should not call service if no authUser', () => {
    localStorage.removeItem('authUser');
    const spy = service.getDriverRideHistory;
    component.ngOnInit();
    expect(spy).toHaveBeenCalledTimes(0);
    expect(component.rideHistoryList.length).toBe(0);
  });

  it('showCompleted should filter only completed', () => {
    component.ngOnInit();
    component.showCompleted();
    expect(component.filterType).toBe('completed');
    expect(component.filteredList.every(r => r.status === RideStatus.Completed)).toBeTrue();
    expect(component.currentPage).toBe(1);
  });

  it('showCancelled should filter cancelled by user or driver', () => {
    component.ngOnInit();
    component.showCancelled();
    expect(component.filterType).toBe('cancelled');
    expect(component.filteredList.every(r =>
      r.status === RideStatus.CancelledByDriver || r.status === RideStatus.CancelledByUser
    )).toBeTrue();
  });

  it('showAll should restore full list', () => {
    component.ngOnInit();
    component.showCompleted();
    component.showAll();
    expect(component.filterType).toBe('all');
    expect(component.filteredList.length).toBe(mockRides.length);
  });

  it('pagination should change pages correctly', () => {
    component.ngOnInit();
    const page1Ids = component.paginatedList.map(r => r.rideId);
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
    expect(component.paginatedList.map(r => r.rideId)).not.toEqual(page1Ids);
  });

  it('goToPage should ignore out-of-range values', () => {
    component.ngOnInit();
    const current = component.currentPage;
    component.goToPage(0);
    component.goToPage(999);
    expect(component.currentPage).toBe(current);
  });

  it('updatePagination should clamp currentPage when list shrinks', () => {
    component.ngOnInit();
    component.goToPage(component.totalPages);
    component.filteredList = component.filteredList.slice(0, 2);
    component.updatePagination();
    expect(component.currentPage).toBe(1);
    expect(component.totalPages).toBe(1);
    expect(component.paginatedList.length).toBe(2);
  });

  it('handles empty filtered list', () => {
    component.filteredList = [];
    component.updatePagination();
    expect(component.totalPages).toBe(0);
    expect(component.currentPage).toBe(1);
    expect(component.paginatedList.length).toBe(0);
  });
});