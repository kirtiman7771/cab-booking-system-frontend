import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { RideReview } from '../models/reviewsandrating';
import { environment } from '../../../../environment/environment';


@Injectable({
  providedIn: 'root'
})
// export class RatingService {
//   private baseUrl = `${environment.springApiUrl}/api/ratings`;
  
//   constructor(private http: HttpClient) {
//    }

//   /**
//    * Fetches ratings for a specific user.
//    * NOTE: API path may need adjustment if /api/ratings/{userId} is not correct.
//    */
//   getAll(userId: string): Observable<RideReview[]> {
//     return this.http.get<RideReview[]>(`${this.baseUrl}/user/${userId}`);
//   }

//   /**
//    * Submits a new rating entry using HTTP POST.
//    */
//   submitReview(review: Omit<RideReview, 'id'>): Observable<RideReview> {
//     // We omit 'id' since the backend generates it.
//     return this.http.post<RideReview>(this.baseUrl, review);
//   }
// }

export class RatingService {

  private baseUrl = `${environment.springApiUrl}/api/ratings`;
  constructor(private http: HttpClient) {

   }

  // Corrected return type to use the defined interface for better type safety
  getAll(userId: string): Observable<RideReview[]>{
    // Assuming a path structure like /api/ratings/user/{userId} for fetching user's reviews
    return this.http.get<RideReview[]>(`${this.baseUrl}/user/${userId}`);
  }

  submitReview(review: RideReview): Observable<RideReview> {
  // Use POST for submitting a new review
  return this.http.post<RideReview>(this.baseUrl, review);
}

}
