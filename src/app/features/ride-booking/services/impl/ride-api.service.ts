// src/app/services/api/ride-api.service.ts
import { Injectable } from '@angular/core';
import { RideRepository } from '../interfaces/RideRepository';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError, timer, switchMap, of, interval, shareReplay } from 'rxjs';
import { CarFare } from '../../models/CarFair';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { RidePayload } from '../../models/RidePayload';
import { DriverResponseDTO } from '../../models/DriverApiResponse';
import { DriverDetails } from '../../models/DriverDetails';

@Injectable({
  providedIn: 'root'
})
export class RideApiService implements RideRepository {

  private base = 'http://localhost:3000';
  private pollingInterval = 3000; // 3 seconds

  constructor(private http: HttpClient) {
    console.log("RideAPI started");
  }
  updateRide(rideId: string, data: Partial<RidePayload>): Observable<Ride> {
    const url = `${this.base}/rideHistory/${rideId}`; // Assuming rideHistory is the correct endpoint base

    return this.http.patch<Ride>(url, data).pipe(
      tap(() => {
        console.log(`✅ Success: Ride ${rideId} updated with data.`, data);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ Error: Failed to update ride ${rideId}.`);
        console.error('Details:', error.error || error.message);
        // The error will often contain the backend exception message (e.g., "Ride is Already Assigned")
        return throwError(
          () => new Error(error.error?.message || error.message || 'Failed to update ride.')
        );
      })
    );
  }
  startRide(rideId: string): Observable<Ride> {
    return this.updateRideStatus(rideId, RideStatus.Ongoing);
  }

  getRideStatus(rideId: string): Observable<RideStatus> {
    // Use 'pipe' and 'map' to transform the Ride object into a RideStatus
    return this.getRideById(rideId).pipe(
      map(ride => {
        if (ride) {
          return ride.status;
        }
        // Handle the case where the ride is not found (getRideById returns null)
        console.warn(`Ride ${rideId} not found, defaulting status.`);
        return RideStatus.CancelledByUser; // Or a more appropriate default/error status
      }),
      catchError(error => {
        console.error('Error fetching ride status:', error);
        // Return a default status or re-throw an error Observable
        return of(RideStatus.CancelledByUser);
      })
    );
  }

  // Rides APIs
  bookRide(ride: RidePayload): Observable<Ride> {
    let id = this.generate10DigitRideId().toString()

    let newRide: Ride = {
      ...ride,
      id: id,
      rideId: id,
      dateTime: new Date()
    }
    // ride.id = id
    // ride.rideId = id
    // ride.dateTime = new Date()
    // let finalRide = ride = {
    //   ...ride,
    //   rideId: id,
    //   id: id
    // }
    console.log(ride)
    return this.http.post<Ride>(`${this.base}/rideHistory`, newRide);
  }

  getUserRides(userId: string ): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.base}/rideHistory?userId=${userId}`);
  }

  getRideById(rideId: string, isPolling: boolean = false): Observable<Ride | null> {
    const singleRequest$ = this.http.get<Ride[]>(`${this.base}/rideHistory?id=${rideId}`).pipe(
      map(rides => rides[0] || null),
      catchError(error => {
        console.error('Error fetching ride details:', error);
        return of(null);
      })
    );

    if (isPolling) {
      return timer(0, this.pollingInterval).pipe(
        switchMap(() => singleRequest$),
      );
    }
    return singleRequest$;
  }

  hasTwoActiveRides(userId: string ): Observable<boolean> {
    return this.getUserRides(userId).pipe(
      map((rides: Ride[]) => {
        const activeRides = rides.filter(ride =>
          ride.status !== RideStatus.Completed &&
          ride.status !== RideStatus.CancelledByUser
        );
        return activeRides.length >= 2;
      })
    );
  }

  updateRideStatus(id: string, newStatus: string): Observable<any> {
    const url = `${this.base}/rideHistory/${id}`;
    const payload = { status: newStatus };

    return this.http.patch(url, payload).pipe(
      tap(() => {
        console.log(`✅ Success: Ride ${id} status updated to '${newStatus}'.`);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ Error: Failed to update status for ride ${id}.`);
        console.error('Details:', error);
        return throwError(
          () => new Error('Something bad happened; please try again later.')
        );
      })
    );
  }

  getCarFares(): Observable<CarFare[]> {
    return this.http.get<CarFare[]>(`${this.base}/fareModels`).pipe(
      tap(fareModels => console.log('Final car fare models:', fareModels))
    );
  }


  getUnassignedRides(): Observable<Ride[]> {
    return interval(2000).pipe( // emit every 2 seconds
      switchMap(() => this.http.get<Ride[]>(`${this.base}/rideHistory`)),
      map(rides => {
        return rides.filter(ride =>
          (ride.status === RideStatus.LookingForDriver || ride.status === RideStatus.CancelledByDriver) && !ride.driverId
        );
      }),
      shareReplay(1) // optional: share the latest result with multiple subscribers
    );
  }


  getUpcomingRidesForUser(userId: string ): Observable<Ride[]> {
    return this.getUserRides(userId).pipe(
      map((rides: Ride[]) => {
        return rides.filter(ride =>
          ride.status != RideStatus.CancelledByUser &&
          ride.status != RideStatus.Completed
        );
      }),
      catchError(error => {
        console.error('Error filtering upcoming rides:', error);
        return throwError(() => new Error('Failed to filter upcoming rides.'));
      })
    );
  }


  // A new function to check if a ride has a driver assigned.
  isRideAssigned(rideId: string): Observable<boolean> {
    return this.getRideById(rideId).pipe(
      map(ride => !!(ride && (ride as Ride).driverId))
    );
  }

  // The main function that first checks and then executes the assignment.
  assignDriver(rideId: string, driverId: string ): Observable<Ride> {
    return this.isRideAssigned(rideId).pipe(
      switchMap(isAssigned => {
        if (isAssigned) {
          console.warn(`❌ Warning: Ride ${rideId} already has a driver assigned. Refusing to assign new driver.`);
          return throwError(() => new Error('Ride is already assigned to a driver.'));
        }

        return this.http.patch<Ride>(`${this.base}/rideHistory/${rideId}`, { status: RideStatus.ConfirmedByDriver, driverId: driverId }).pipe(
          tap(() => console.log(`✅ Success: Driver ${driverId} assigned to ride ${rideId}.`)),
          catchError(error => {
            console.error(`❌ Error: Failed to assign driver to ride ${rideId}.`);
            console.error('Details:', error);
            return throwError(() => new Error('Failed to assign driver.'));
          })
        );
      })
    );
  }

  cancelRideByDriver(rideId: string){
    return this.http.patch<Ride>(`${this.base}/rideHistory/${rideId}`, { status: RideStatus.CancelledByDriver, driverId: null });
  }

  cancelRideByUser(rideId: string): Observable<Ride> {
    return this.http.patch<Ride>(`${this.base}/rideHistory/${rideId}`, { status: RideStatus.CancelledByUser, driverId: null });
  }

  markRideAsCompleted(rideId: string) {
    return this.http.patch<Ride>(`${this.base}/rideHistory/${rideId}`, { status: RideStatus.Completed });
  }


  getReceipt(rideId: string, isPolling: boolean = false): Observable<any> {
    const singleRequest$ = this.http.get(`${this.base}/payments?rideId=${rideId}`).pipe(
      map(receipts => (receipts as any)[0] || null),
      catchError(error => {
        console.error('Error fetching receipt:', error);
        return of(null);
      })
    );

    if (isPolling) {
      return timer(0, this.pollingInterval).pipe(
        switchMap(() => singleRequest$),
      );
    }
    return singleRequest$;
  }

  getDriverDetailsById(driverId: string ): Observable<DriverDetails>{
    return this.http.get<DriverDetails>(`${this.base}/drivers?id=${driverId}`);
  }

  public getUpcomingRidesForDriver(driverId: string | number, isPolling: boolean = false): Observable<Ride[]> {
    const getFilteredRides = () => {
      // Fetch all rides and then filter them manually.
      return this.http.get<Ride[]>(`${this.base}/rideHistory`).pipe(
        map(rides => {
          return rides.filter(ride => ride && this.isToday(ride.dateTime)
            && ride.driverId == driverId
            && (ride.status == RideStatus.Ongoing || ride.status == RideStatus.ConfirmedByDriver));
        }),
        tap(rides => console.log(`API: Found ${rides.length} ongoing ride(s) for driver ${driverId}`)),
        catchError((error: HttpErrorResponse) => {
          console.error(`❌ Error: Failed to fetch ongoing rides for driver ${driverId}.`);
          console.error('Details:', error);
          return throwError(() => new Error('Failed to fetch ongoing ride for driver.'));
        })
      );
    };

    if (isPolling) {
      return timer(0, this.pollingInterval).pipe(
        switchMap(() => getFilteredRides())
      );
    }
    return getFilteredRides();
  }

  generate10DigitRideId(): number {
    return Math.floor(1000000000 + Math.random() * 9000000000);
  }

  isToday = (date: Date): boolean => {
    const today = new Date();
    // Ensure we compare against a valid Date object, handling strings if necessary
    const dateToCheck = typeof date === 'string' ? new Date(date) : date;

    return (
      dateToCheck.getDate() === today.getDate() &&
      dateToCheck.getMonth() === today.getMonth() &&
      dateToCheck.getFullYear() === today.getFullYear()
    );
  };
}