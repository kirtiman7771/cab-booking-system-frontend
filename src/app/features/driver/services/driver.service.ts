import { Injectable } from '@angular/core';
import { environment } from '../../../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DriverAllDetails } from '../models/driverAllDetails';
import { DriverDashboardModel } from '../models/driverDashboardModel';
import { DriverUpdatePayload } from '../models/driverUpdateDetails';

@Injectable({
  providedIn: 'root'
})
export class DriverService {

  springApiUrl = environment.springApiUrl;

  constructor(
    private http : HttpClient
  ) { }

  updateDriverStatus(id: string, status: string) {
    return this.http.put(`${this.springApiUrl}/api/drivers/status/${id}`, { status: status });
  }

  getDriverProfileById(userId: string): Observable<DriverAllDetails> {
    return this.http.get<DriverAllDetails>(`${this.springApiUrl}/api/drivers/profile/${userId}`);
  }

  getDriverDashboardDetails(driverId: string): Observable<DriverDashboardModel> {
    return this.http.get<DriverDashboardModel>(`${this.springApiUrl}/api/drivers/dashboard/${driverId}`);
  }

  updateDriverProfile(userId: string, data: Partial<DriverUpdatePayload>): Observable<DriverAllDetails> {
    return this.http.put<DriverAllDetails>(`${this.springApiUrl}/api/drivers/profile/${userId}`, data);
  }

}
