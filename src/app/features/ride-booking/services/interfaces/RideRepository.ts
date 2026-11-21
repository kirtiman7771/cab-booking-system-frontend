// src/app/repositories/RideRepository.ts
import { Observable } from 'rxjs';
import { Ride } from '../../models/Ride';
import { CarFare } from '../../models/CarFair';
import { RideStatus } from '../../models/RideStatus';
import { RidePayload } from '../../models/RidePayload';
import { DriverDetails } from '../../models/DriverDetails';
import { DriverResponseDTO } from '../../models/DriverApiResponse';

export interface RideRepository {
  // Methods for fetching ride and fare data
  getCarFares(): Observable<CarFare[]>;
  getUserRides(userId: string): Observable<Ride[]>;
  getRideById(rideId: string, isPolling?: boolean): Observable<Ride | null>;
  getUnassignedRides(): Observable<Ride[]>;
  getDriverDetailsById(driverId: string): Observable<DriverDetails>;
  hasTwoActiveRides(userId: string): Observable<boolean>;
  getUpcomingRidesForUser(userId: string): Observable<Ride[]>;
  getUpcomingRidesForDriver(driverId: string, isPolling?: boolean): Observable<Ride[]>
  getRideStatus(rideId: string): Observable<RideStatus>;
  
  // Methods for performing actions on rides
  bookRide(ride: RidePayload): Observable<Ride>;
  updateRideStatus(id: string, newStatus: RideStatus): Observable<Ride>;
  assignDriver(rideId: string, driverId: string): Observable<Ride>;
  cancelRideByDriver(rideId: string): Observable<Ride>;
  cancelRideByUser(rideId: string): Observable<Ride>;
  markRideAsCompleted(rideId: string): Observable<Ride>;
  startRide(rideId: string, driverId: string): Observable<Ride>;
  updateRide(rideId: string, data: Partial<RidePayload>): Observable<Ride>;

}