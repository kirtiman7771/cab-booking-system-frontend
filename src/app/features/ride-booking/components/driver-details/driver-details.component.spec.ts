import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverDetailsComponent } from './driver-details.component';
import { RIDE_BOOKING_SERVICE_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { of, throwError } from 'rxjs';
import { DriverDetails } from '../../models/DriverDetails';
import { SimpleChange, NO_ERRORS_SCHEMA } from '@angular/core';

describe('DriverDetailsComponent', () => {
  let component: DriverDetailsComponent;
  let fixture: ComponentFixture<DriverDetailsComponent>;
  let rideBookingServiceSpy: jasmine.SpyObj<IRideBookingService>;

  const mockDriver: DriverDetails = {
    name: 'John Doe',
    phone: '+1234567890',
    vehicleInfo: 'Model X (KA-01-1234)'
  };

  beforeEach(async () => {
    rideBookingServiceSpy = jasmine.createSpyObj<IRideBookingService>('IRideBookingService', ['getDriverDetailsById']);

    await TestBed.configureTestingModule({
      declarations: [DriverDetailsComponent],
      providers: [
        { provide: RIDE_BOOKING_SERVICE_TOKEN, useValue: rideBookingServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA] // ignore template child components/elements
    }).compileComponents();

    fixture = TestBed.createComponent(DriverDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch driver details on init when driverId is provided', () => {
    // Arrange
    rideBookingServiceSpy.getDriverDetailsById.and.returnValue(of(mockDriver));
    component.driverId = '123';

    // Act - ngOnInit is called on first detectChanges
    fixture.detectChanges();

    // Assert
    expect(rideBookingServiceSpy.getDriverDetailsById).toHaveBeenCalledWith('123');
    expect(component.driverDetails).toEqual(mockDriver);
    expect(component.loading).toBeFalse();
  });

  it('should fetch driver details on input change (ngOnChanges)', () => {
    // Arrange
    rideBookingServiceSpy.getDriverDetailsById.and.returnValue(of(mockDriver));
    const previous = null;
    const current = '456';
    const change = { driverId: new SimpleChange(previous, current, false) };

    // Act
    component.ngOnChanges(change as any); // call lifecycle directly

    // Assert
    expect(rideBookingServiceSpy.getDriverDetailsById).toHaveBeenCalledWith('456');
    expect(component.driverDetails).toEqual(mockDriver);
    expect(component.loading).toBeFalse();
  });

  it('should not call service when driverId is empty on init', () => {
    // Arrange - empty string is falsy, component should not call service
    component.driverId = '';

    // Act
    fixture.detectChanges();

    // Assert
    expect(rideBookingServiceSpy.getDriverDetailsById).not.toHaveBeenCalled();
    // loading remains whatever the component initialized it to (original component sets true),
    // but we primarily assert the service wasn't invoked.
  });

  it('should handle service error and set loading to false and driverDetails to null', () => {
    // Arrange
    rideBookingServiceSpy.getDriverDetailsById.and.returnValue(throwError(() => new Error('Network error')));
    component.driverId = '789';

    // Act
    fixture.detectChanges();

    // Assert
    expect(rideBookingServiceSpy.getDriverDetailsById).toHaveBeenCalledWith('789');
    expect(component.driverDetails).toBeNull();
    expect(component.loading).toBeFalse();
  });
});