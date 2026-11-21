import { Observable } from 'rxjs';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { CarFare } from '../../models/CarFair';
import { DriverDetails } from '../../models/DriverDetails';

export interface IRideBookingService {
  bookedRide$: Observable<Ride | null>;

  getRideStatus(rideId: string): Observable<RideStatus>;
  resetBookingState(): void;
  bookRide(): Observable<boolean>;
  loadCarFares(): Observable<CarFare[]>;
  cancelRideByUser(rideId: string): Observable<Ride>;
  cancelRideByDriver(rideId: string): Observable<Ride>;
  markAsCompleted(rideId: string): Observable<Ride>;
  assignDriver(rideId: string, driverId: string): Observable<Ride>;
  startRide(rideId: string): Observable<Ride>;
  checkIfTwoRidesActive(): Observable<boolean>;
  getDriverDetailsById(driverId: string): Observable<DriverDetails>;
  getRideById(rideId: string, isPolling?: boolean): Observable<Ride>;
  getUnassignedRides(): Observable<Ride[]>;
  getUpcomingRidesForUser(userId: string): Observable<Ride[]>;
  getUpcomingRidesForDriver(driverId: string): Observable<Ride[]>;
}