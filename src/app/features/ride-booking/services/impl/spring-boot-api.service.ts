import { Injectable } from '@angular/core';
import { RideRepository } from '../interfaces/RideRepository';
import { catchError, map, merge, Observable, of, switchMap, takeWhile, timer } from 'rxjs';
import { CarFare } from '../../models/CarFair';
import { Ride } from '../../models/Ride';
import { HttpClient } from '@angular/common/http';
import { RideStatus } from '../../models/RideStatus';
import { DriverDetails } from '../../models/DriverDetails';
import { DriverResponseDTO } from '../../models/DriverApiResponse';
import { environment } from '../../../../../environment/environment';
import { RideWebSocketService } from '../ride-websocket.service';
import { RidePayload } from '../../models/RidePayload';

@Injectable({
  providedIn: 'root'
})
export class SpringBootApiService implements RideRepository {

  private baseUrl: string = `${environment.springApiUrl}/api/rides`;
  private baseUrlForDriver: string = `${environment.springApiUrl}`;
  private pollingInterval = 5000;

  constructor(private http: HttpClient, private rideWsService: RideWebSocketService) { }

  startRide(rideId: string): Observable<Ride> {
    return this.updateRideStatus(rideId, RideStatus.Ongoing);
  }

  getCarFares(): Observable<CarFare[]> {
    console.log("GetCarFares Called");
    return this.http.get<CarFare[]>(`${this.baseUrl}/rider/get-car-fares`);
  }
  getUserRides(userId: string | string): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.baseUrl}/rider/${userId}`);
  }
  
  getRideById(rideId: string): Observable<Ride | null> {
    // 1. Initial REST API request
    const initialRideFetch$ = this.http.get<Ride>(`${this.baseUrl}/ride/${rideId}`).pipe(
      catchError(error => {
        console.error('Error fetching initial ride details:', error);
        return of(null);
      }),
      switchMap(initialRide => {
        // Emit the initial ride first
        if (!initialRide) {
          return of(null);
        }

        // Corrected condition: only subscribe if status is NOT CancelledByUser AND NOT Completed
        const shouldSubscribeToWebSocket: boolean =
          initialRide.status !== RideStatus.CancelledByUser &&
          initialRide.status !== RideStatus.Completed;

        if (shouldSubscribeToWebSocket) {
          // Merge initial ride with WebSocket updates
          return merge(
            of(initialRide),
            this.rideWsService.subscribeToRideUpdates(rideId)
          );
        } else {
          // Only emit the initial ride, skip WebSocket
          return of(initialRide);
        }
      })
    );

    return initialRideFetch$;
  }

  getUnassignedRides(): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.baseUrl}/driver/unassigned-ride`);
  }
  getDriverDetailsById(driverId: string | string): Observable<DriverDetails> {
    return this.http.get<DriverResponseDTO>(`${this.baseUrlForDriver}/api/drivers/profile/${driverId}`).pipe(
      map((details) => {
        return this.mapDriverResponseToDriverDetails(details);
      })
    );
  }
  hasTwoActiveRides(userId: string | string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/rider/has-two-rides/${userId}`);
  }
  getUpcomingRidesForUser(userId: string | string): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.baseUrl}/rider/upcoming-ride/${userId}`);
  }
  getUpcomingRidesForDriver(driverId: string | string, isPolling?: boolean): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.baseUrl}/driver/upcoming-ride/${driverId}`);
  }
  bookRide(ride: RidePayload): Observable<Ride> {
    return this.http.post<Ride>(`${this.baseUrl}/rider/book`, ride);
  }
  updateRideStatus(id: string, newStatus: string): Observable<any> {
    return this.http.patch<Ride>(`${this.baseUrl}/rider/book/${id}`, { status: newStatus });
  }
  assignDriver(rideId: string, driverId: string | string): Observable<Ride> {
    return this.http.patch<Ride>(`${this.baseUrl}/rider/book/${rideId}`, { driverId: driverId });
  }
  cancelRideByDriver(rideId: string): Observable<Ride> {
    return this.http.patch<Ride>(`${this.baseUrl}/rider/book/${rideId}`, { driverId: null, status: RideStatus.CancelledByDriver });
  }
  cancelRideByUser(rideId: string): Observable<any> {
    return this.http.patch<Ride>(`${this.baseUrl}/rider/book/${rideId}`, { status: RideStatus.CancelledByUser });
  }
  markRideAsCompleted(rideId: string): Observable<Ride> {
    return this.http.patch<Ride>(`${this.baseUrl}/rider/book/${rideId}`, { status: RideStatus.Completed });
  }
  processPayment(data: any): Observable<any> {
    throw new Error('Method not implemented.');
  }

  getRideStatus(rideId: string): Observable<any> {
    return this.getRideById(rideId).pipe(
      map(ride => ride ? ride.status : null)
    );
  }

  updateRide(rideId: string, data: Partial<Ride>): Observable<Ride> {
    return this.http.patch<Ride>(`${this.baseUrl}/book/${rideId}`, data);
  }

  mapDriverResponseToDriverDetails(dto: DriverResponseDTO): DriverDetails {
    const vehicle = dto.vehicleDetails;

    // Create vehicleInfo using only model and string as requested by the UI display
    const vehicleInfo = vehicle
      ? `${vehicle.vehicleModel} (${vehicle.vehicleNumber})`
      : 'Vehicle details unavailable';

    return {
      // 1. Name
      name: dto.name || 'Name not provided',

      // 2. Phone (nested)
      phone: dto.personalDetails?.phone || 'N/A',

      // 3. Vehicle (formatted)
      vehicleInfo: vehicleInfo
    };
  }
}
