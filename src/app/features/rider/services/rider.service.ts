import { Injectable } from '@angular/core';
import { environment } from '../../../../environment/environment';
import { RiderAllDetails } from '../models/riderAllDetails';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RiderProfile } from '../models/RiderProfile';
import { RiderUpdateProfile } from '../models/RiderUpdateProfile';

@Injectable({
  providedIn: 'root'
})
export class RiderService {

  constructor(
    private http: HttpClient
  ) { }

  private apiUrl = environment.springApiUrl;
  private riderEndpoint = `${this.apiUrl}/api/riders`;

  getRiderAllDetails(userId: string): Observable<RiderAllDetails> {
    return this.http.get<RiderAllDetails>(`${this.riderEndpoint}/allDetails/${userId}`);
  }

  getRiderProfile(userId: string): Observable<RiderProfile> {
    return this.http.get<RiderProfile>(`${this.riderEndpoint}/profile/${userId}`);
  }

  updateUserProfile(userId: string, data: Partial<RiderUpdateProfile>): Observable<RiderUpdateProfile> {
    return this.http.put<RiderUpdateProfile>(`${this.riderEndpoint}/profile/${userId}`, data);
  }

  deleteRiderAccount(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.riderEndpoint}/profile/${userId}`);
  }

  getCarTypesCountById(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/rides/rider/car-types/history/${userId}`);
  }

}
