import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RideHistoryComponent } from './ride-history.component';
import { MatDialog } from '@angular/material/dialog';
import { RideHistoryService } from '../../services/ride-history.service';
import { of, throwError } from 'rxjs';
import { RideHistory } from '../../models/RideHistory';
import { RideStatus } from '../../../ride-booking/models/RideStatus';

// Rating and RideHistory models for type safety (adjust fields as needed)
interface Rating {
  id: string;
  userId: string;
  driverId: string;
  rideId: string;
  rating: number;
  comments: string;
}

const mockRideData: RideHistory[] = [
  {
      rideId: 'ride1id12345678',
      dateTime: '2023-06-01T12:30:00',
      pickupLocation: 'Location A',
      dropLocation: 'Location B',
      carType: 'Sedan',
      status: RideStatus.Completed,
      rating: {
          id: 'rating1',
          userId: 'user1',
          driverId: 'driver1',
          rideId: 'ride1id12345678',
          rating: 4,
          comments: 'Great ride'
      },
      userId: '',
      driverId: '',
      fare: 0
  },
  {
      rideId: 'ride2id87654321',
      dateTime: '2023-06-05T14:30:00',
      pickupLocation: 'Location C',
      dropLocation: 'Location D',
      carType: 'Hatchback',
      status: RideStatus.Completed,
      rating: null,
      userId: '',
      driverId: '',
      fare: 0
  }
];

describe('RideHistoryComponent', () => {
  let component: RideHistoryComponent;
  let fixture: ComponentFixture<RideHistoryComponent>;
  let rideHistoryServiceSpy: jasmine.SpyObj<RideHistoryService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const rideSpy = jasmine.createSpyObj('RideHistoryService', ['getAllRideHistory']);
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      declarations: [RideHistoryComponent],
      providers: [
        { provide: RideHistoryService, useValue: rideSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RideHistoryComponent);
    component = fixture.componentInstance;
    rideHistoryServiceSpy = TestBed.inject(RideHistoryService) as jasmine.SpyObj<RideHistoryService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    component.userId = 'test-user-id';
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ userId: 'test-user-id' }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch and set ride history on init', fakeAsync(() => {
    rideHistoryServiceSpy.getAllRideHistory.and.returnValue(of(mockRideData));
    component.ngOnInit();
    tick();
    expect(rideHistoryServiceSpy.getAllRideHistory).toHaveBeenCalledWith('test-user-id');
    expect(component.rideHistoryList.length).toBe(2);
    expect(component.filteredList.length).toBe(2);
    expect(component.paginatedList.length).toBeLessThanOrEqual(component.itemsPerPage);
  }));

  it('should handle service error gracefully', fakeAsync(() => {
    rideHistoryServiceSpy.getAllRideHistory.and.returnValue(throwError(() => ({ error: 'Failed' })));
    component.ngOnInit();
    tick();
    expect(rideHistoryServiceSpy.getAllRideHistory).toHaveBeenCalledWith('test-user-id');
    expect(Array.isArray(component.filteredList)).toBeTrue();
  }));

  it('should filter reviewed rides correctly', () => {
    component.rideHistoryList = mockRideData;
    component.showReviewed();
    expect(component.filteredList.length).toBe(1);
    expect(component.filteredList[0].rating?.rating).toBe(4);
    expect(component.filterType).toBe('reviewed');
  });

  it('should filter not reviewed rides correctly', () => {
    component.rideHistoryList = mockRideData;
    component.showNotReviewed();
    expect(component.filteredList.length).toBe(1);
    expect(component.filteredList[0].rating).toBeNull();
    expect(component.filterType).toBe('notReviewed');
  });

  it('should show all rides', () => {
    component.rideHistoryList = mockRideData;
    component.showAll();
    expect(component.filteredList.length).toBe(2);
    expect(component.filterType).toBe('all');
  });

  it('should paginate results', () => {
    // generate 12 rides
    component.rideHistoryList = Array.from({ length: 12 }, (_, i) => ({
      ...mockRideData[0],
      rideId: `ride${i + 1}`,
      rating: {
        id: `rating${i}`,
        userId: `user${i}`,
        driverId: `driver${i}`,
        rideId: `ride${i + 1}`,
        rating: i % 2 === 0 ? 5 : 0,
        comments: 'comment'
      }
    }));
    component.filteredList = component.rideHistoryList;
    component.itemsPerPage = 5;
    component.currentPage = 1;
    component.updatePagination();
    expect(component.totalPages).toBe(3);
    expect(component.paginatedList.length).toBe(5);
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
    expect(component.paginatedList.length).toBe(5);
    component.goToPage(4);
    expect(component.currentPage).toBe(2); // stays at last valid page
  });

  it('reviewed getter should return true if ratingData exists and rating > 0', () => {
    component.ratingData = { rating: 3 } as Rating;
    expect(component.reviewed).toBeTrue();
    component.ratingData = { rating: 0 } as Rating;
    expect(component.reviewed).toBeFalse();
    component.ratingData = null;
    expect(component.reviewed).toBeFalse();
  });
});