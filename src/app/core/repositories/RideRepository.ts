// src/app/repositories/RideRepository.ts
import { Observable } from 'rxjs';
import { Ride } from '../../features/ride-booking/models/Ride';
import { CarFare } from '../../features/ride-booking/models/CarFair';

export interface RideRepository {
  // Methods for fetching ride and fare data
  getCarFares(): Observable<CarFare[]>;
  getUserRides(userId: string | number): Observable<Ride[]>;
  getRideById(rideId: string | number, isPolling: boolean): Observable<Ride[] | Ride | null>;
  getUnassignedRides(): Observable<Ride[]>;
  getReceipt(rideId: string | number, isPolling: boolean): Observable<any>;
  getDriverDetailsById(driverId: string | number): Observable<any>;
  hasTwoActiveRides(userId: number | string): Observable<boolean>;
  getUpcomingRides(userId: number | string): Observable<Ride[]>;
  getUpcomingRideForDriver(driverId: string | number, isPolling?: boolean): Observable<Ride[]>
  
  // Methods for performing actions on rides
  bookRide(ride: Ride): Observable<Ride>;
  updateRideStatus(id: string, newStatus: string): Observable<any>;
  assignDriver(rideId: string | number, driverId: string | number): Observable<Object>;
  cancelRideByDriver(rideId: string | number): Observable<any>;
  cancelRideByUser(rideId: string | number): Observable<any>;
  markRideAsCompleted(rideId: string | number): Observable<Object>;
  
  // Payment methods
  processPayment(data: any): Observable<any>;
}