import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environment/environment';
import { RideHistory } from '../../rider/models/RideHistory';

@Injectable({
  providedIn: 'root',
})
export class DriverRideHistoryService {
constructor(private http: HttpClient, private authService: AuthService) {}

  // rideHistoryUrl: string = 'http://localhost:3000/rideHistory';
  springApiUrl : string = environment.springApiUrl;

  // rideHistoryUrl : string = `${this.springApiUrl}/api`
  getDriverRideHistory(driverId : string): Observable<RideHistory[]> {

    const userType = this.authService.getUserType();
    const url = `${this.springApiUrl}/api/${userType}s/history/${driverId}`
    return this.http.get<RideHistory[]>(url).pipe( Response => {
      
      Response.forEach(data => console.log("Response" + data))
      return Response;
    }
    );
  }
}

