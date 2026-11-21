import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RiderAllDetails } from '../../features/rider/models/riderAllDetails';
import { DriverAllDetails } from '../../features/driver/models/driverAllDetails';
import { environment } from '../../../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient
  ) { }
  // private base = 'evvironment.apiBase';
  private base = 'http://localhost:3000';
  private backEnd = environment.springApiUrl;

  regiterUser(data: any) {
    return this.http.post(`${this.base}/users`, data);
  }

  getUserProfile(id: number): Observable<RiderAllDetails> {
    return this.http.get<RiderAllDetails>(`${this.base}/users/${id}`)
  }

  updateUserProfile(id: number, data: Partial<RiderAllDetails>): Observable<RiderAllDetails> {
    return this.http.patch<RiderAllDetails>(`${this.base}/users/${id}`, data);
  }

  //Driver APIs
  registerDriver(data: any) {
    return this.http.post(`${this.base}/drivers`, data);
  }

  getAvailableDrivers() {
    return this.http.get(`${this.base}/drivers?status=available`);
  }

  updateDriverStatus(id: number, status: string) {
    return this.http.put(`${this.base}/drivers/${id}`, { status: status });
  }

  getDriverDetailsById(id: string | number) {
    return this.http.get(`${this.base}/drivers?id=${id}`);
  }

  updateDriverProfile(id: string, data: Partial<DriverAllDetails>): Observable<DriverAllDetails> {
    return this.http.patch<DriverAllDetails>(`${this.base}/drivers/${id}`, data);
  }


  //Rides APIs
  // bookRide(ride: Ride): Observable<Ride> {
  //   return this.http.post<Ride>(`${this.base}/rides`, ride);
  // }

  // getUserRides(userId: number | string): Observable<Ride[]> {
  //   return this.http.get<Ride[]>(`${this.base}/rides?userId=${userId}`);
  // }

  // getRideById(rideId: number | string): Observable<Ride[]> {
  //   return this.http.get<Ride[]>(`${this.base}/rides?rideId=${rideId}`);
  // }

  // hasTwoActiveRides(userId: number | string): Observable<boolean> {
  //   return this.getUserRides(userId).pipe(
  //     map((rides: Ride[]) => {
  //       const activeRides = rides.filter(ride =>
  //         ride.status !== RideStatus.Completed &&
  //         ride.status !== RideStatus.CancelledByUser
  //       );
  //       return activeRides.length >= 2;
  //     })
  //   );
  // }

  // updateRideStatus(id: string, newStatus: string): Observable<any> {
  //   const url = `${this.base}/rides/${id}`;
  //   const payload = { status: newStatus };

  //   return this.http.patch(url, payload).pipe(
  //     tap(() => {
  //       console.log(`✅ Success: Ride ${id} status updated to '${newStatus}'.`);
  //     }),
  //     catchError((error: HttpErrorResponse) => {
  //       console.error(`❌ Error: Failed to update status for ride ${id}.`);
  //       console.error('Details:', error);
  //       return throwError(
  //         () => new Error('Something bad happened; please try again later.')
  //       );
  //     })
  //   );
  // }

  // /**
  //  * Fetches the car fare models from the API.
  //  * The pipe(map) operator is used to extract the 'fareModels' array from the JSON response.
  //  */
  // getCarFares(): Observable<CarFare[]> {
  //   // Corrected code: The GET request already returns the array
  //   return this.http.get<CarFare[]>(`${this.base}/fareModels`).pipe(
  //     // The tap operator now logs the direct array response
  //     tap(fareModels => console.log('Final car fare models:', fareModels))
  //   );
  // }

  // getUnassignedRides(): Observable<Ride[]> {
  //   return this.http.get<Ride[]>(`${this.base}/rides`).pipe(
  //     map(rides => {
  //       return rides.filter(ride => 
  //         (ride.status === RideStatus.Booked || ride.status === RideStatus.CancelledByDriver) && !ride.driverId
  //       );
  //     })
  //   );
  // }

  // assignDriver(rideId: string | number, driverId: string | number) {
  //   return this.http.patch(`${this.base}/rides/${rideId}`, {status: RideStatus.Ongoing, driverId: driverId});
  // }

  // cancelRideByDriver(rideId: string | number) {
  //   return this.http.patch(`${this.base}/rides/${rideId}`, {status: RideStatus.CancelledByDriver, driverId: null});
  // }

  // cancelRideByUser(rideId: string | number) {
  //   return this.http.patch(`${this.base}/rides/${rideId}`, {status: RideStatus.CancelledByUser, driverId: null});
  // }

  // markRideAsCompleted(rideId: string | number) {
  //   return this.http.patch(`${this.base}/rides/${rideId}`, {status: RideStatus.Completed});
  // }

  //Payment APIs
  processPayment(data: any) {
    return this.http.post(`${this.base}/payments`, data);
  }



  updateRideStatus(rideId: number, status: string): Observable<any> {
    return this.http.patch(`${this.base}/rides/${rideId}`, { status: status });
  }
  //Ratings APIs
  // submitRating(data: any): Observable<RideReview> {
  //   return this.http.post<RideReview>(`${this.base}/ratings`, data);
  // }

  // getUserRatings(userId: number) {
  //   return this.http.get(`${this.base}/ratings?userId=${userId}`);
  // }

  // putRating(rideId: number, data: Partial<RideReview>): Observable<RideReview> {
  //   return this.http.patch<RideReview>(`${this.base}/rideHistory/${rideId}`, {comments: "what bro"});
  // }

}
