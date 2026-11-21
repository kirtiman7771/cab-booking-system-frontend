// src/app/modules/ride-booking/services/ride-booking.service.ts

import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map, catchError, throwError } from 'rxjs';
import { CarFare } from '../../models/CarFair';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { RideRepository } from '../interfaces/RideRepository';
import { RideFormStateService } from '../ride-form-state.service';
import { MathUtils } from '../../utils/MathUtils';
import { IRideBookingService } from '../interfaces/IRideBookingService';
import { RIDE_REPOSITORY_TOKEN } from '../tokens/RepositoryTokens';
import { DriverDetails } from '../../models/DriverDetails';
import { AuthService } from '../../../auth/services/auth.service';
import { RidePayload } from '../../models/RidePayload';


@Injectable({
  providedIn: 'root'
})
export class RideBookingService implements IRideBookingService {

  private bookedRideSubject = new BehaviorSubject<Ride | null>(null);
  public bookedRide$ = this.bookedRideSubject.asObservable();

  constructor(
    private authService: AuthService,
    @Inject(RIDE_REPOSITORY_TOKEN) private rideRepo: RideRepository,
    private rideFormStateService: RideFormStateService 
  ) {

  }

  getRideStatus(rideId: string): Observable<RideStatus> {
    return this.rideRepo.getRideStatus(rideId);
  }

  resetBookingState(): void {
    // Delegate state reset to the state service
    this.rideFormStateService.resetState();
    // this.selectedCarFareSubject.next(null);
    this.bookedRideSubject.next(null);
  }


  // Api Calls -----------------------------------------------------

  bookRide(): Observable<boolean> {
    const userId = this.authService.getUserId();
    // ACCESS: Get all required data from the state service
    const rideFormData = this.rideFormStateService.getCurrentFormData();

    if (!userId || rideFormData.isAnyFieldEmpty()) {
      const error = new Error("Invalid ride data: Missing user ID or empty fields");
      return throwError(() => error);
    }

    const locationData = rideFormData.getLocation();
    const finalCarFare = rideFormData.getSelectedCarFare();

    const newRide: RidePayload = {
      userId: userId,
      pickupLocation: locationData.pickupLocation,
      dropLocation: locationData.dropLocation,
      fare: finalCarFare.finalPrice,
      carType: finalCarFare.type,
      status: RideStatus.LookingForDriver,
      receipientEmail: this.authService.getUserEmail() || ''
    };

    return this.rideRepo.bookRide(newRide).pipe(
      map((ride) => {
        this.bookedRideSubject.next(ride);
        // Delegate state reset after success
        this.rideFormStateService.resetState();
        return true;
      }),
      catchError((err) => {
        console.error('Booking failed', err);
        return throwError(() => err);
      })
    );
  }

  loadCarFares(): Observable<CarFare[]> {
    // ACCESS: Get distance from the state service for calculation
    const currentDistance = this.rideFormStateService.getDistance();

    return this.rideRepo.getCarFares().pipe(
      map((carFares: CarFare[]) =>
        carFares.map(car => ({
          ...car,
          finalPrice: MathUtils.calculateFinalPrice(car.pricePerKm, currentDistance)
        }))
      ),
      catchError(error => {
        console.error('Error loading car fares:', error);
        return throwError(() => error);
      })
    )
  }

  cancelRideByUser(rideId: string): Observable<Ride> {
    return this.rideRepo.updateRide(rideId, { status: RideStatus.CancelledByUser });
  }

  cancelRideByDriver(rideId: string): Observable<Ride> {
    return this.rideRepo.updateRide(rideId, { status: RideStatus.CancelledByDriver });
  }

  markAsCompleted(rideId: string): Observable<Ride> {
    return this.rideRepo.updateRide(rideId, { status: RideStatus.Completed });
  }

  assignDriver(rideId: string, driverId: string): Observable<Ride> {
    return this.rideRepo.updateRide(rideId, { driverId: driverId });
  }

  startRide(rideId: string): Observable<Ride> {
    return this.rideRepo.updateRide(rideId, { status: RideStatus.Ongoing });
  }

  checkIfTwoRidesActive(): Observable<boolean> {
    return of(false); // Simplified for this example
    // const userId = this.getUserId();
    // if (!userId) { return of(false); }
    // return this.rideRepo.hasTwoActiveRides(userId);
  }

  getDriverDetailsById(driverId: string): Observable<DriverDetails> {
    return this.rideRepo.getDriverDetailsById(driverId);
  }

  getRideById(rideId: string): Observable<Ride> {
    return this.rideRepo.getRideById(rideId);
  }

  getUnassignedRides(): Observable<Ride[]> {
    return this.rideRepo.getUnassignedRides();
  }

  getUpcomingRidesForDriver(driverId: string): Observable<Ride[]> {
    return this.rideRepo.getUpcomingRidesForDriver(driverId)
  }

  getUpcomingRidesForUser(userId: string): Observable<Ride[]> {
    return this.rideRepo.getUpcomingRidesForUser(userId);
  }
}