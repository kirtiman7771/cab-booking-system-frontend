import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { LoginPayload } from '../models/LoginRequest';
import { UserRole } from '../models/UserRole';
import { LoginResponse } from '../models/LoginResponse';
import { RiderRegistrationRequest } from '../models/RiderRegistrationRequest';
import { RiderregistrationResponse } from '../models/RiderRegistrationResponse';
import { DriverRegistrationRequest } from '../models/DriverRegistrationRequest';
import { DriverRegistrationResponse } from '../models/DriverRegistrationResponse';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  getUserEmail(): string {
    return this.currentUser ? this.currentUser['email'] : '';
  }

  private tokenKey = 'authToken';
  private userKey = 'authUser';
  private userTypeKey = 'userType';
  private apiUrl = environment.springApiUrl;

  private currentUser: any = null;
  public currentUserType: 'rider' | 'driver' | null = null;

  private loggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  isLoggedIn$ = this.loggedInSubject.asObservable();
  private userTypeSubject = new BehaviorSubject<'rider' | 'driver' | null>(this.currentUserType);
  userType$ = this.userTypeSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromLocalStorage();
    this.loggedInSubject.next(this.isLoggedIn());
    this.userTypeSubject.next(this.currentUserType);
  }

  // --- Utility Methods ---

  private loadUserFromLocalStorage(): void {
    const savedUser = localStorage.getItem(this.userKey);
    const savedUserType = localStorage.getItem(this.userTypeKey);
    if (savedUser && savedUserType) {
      this.currentUser = JSON.parse(savedUser);
      this.currentUserType = savedUserType as 'rider' | 'driver';
    }
  }

  // Helper to convert Spring role ('RIDER' | 'DRIVER') to Angular role ('rider' | 'driver')
  private mapRole(beRole: 'RIDER' | 'DRIVER'): 'rider' | 'driver' {
    return beRole.toLowerCase() as 'rider' | 'driver';
  }

  // --- CORE LOGIN METHOD ---
  login(email: string, password: string, userRoleValue: UserRole): Observable<boolean> {

    // **FIX:** The payload needs the actual value of the UserRole enum, not the type/enum itself.
    const payload: LoginPayload = {
      email: email,
      passwordHash: password,
      userRole: userRoleValue // Use the passed-in value, e.g., UserRole.RIDER
    };

    const loginUrl = `${this.apiUrl}/api/auth/login`;

    return this.http.post<LoginResponse>(loginUrl, payload).pipe(
      tap((response: LoginResponse) => {
        if (response && response.token) {
          // Use the role from the response, which is more reliable
          const feUserType = this.mapRole(response.role);

          // FIX: Updated userDetails structure to match common response fields.
          // Note: response.userId and response.firstName are missing from your LoginResponse model, 
          // so I've commented them out or replaced them with available data (email).
          const userDetails = {
            // userId: response.userId, // Missing in current LoginResponse model
            // firstName: response.firstName, // Missing in current LoginResponse model
            email: response.email,
            role: feUserType,
            userId: response.userId
          };

          // Store the JWT token and user details in localStorage
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify(userDetails));
          localStorage.setItem(this.userTypeKey, feUserType);

          // Update the BehaviorSubjects for state management
          this.currentUser = userDetails;
          this.currentUserType = feUserType;
          this.loggedInSubject.next(true);
          this.userTypeSubject.next(feUserType);
        } else {
          throw new Error('Login failed: Token not received');
        }
      }),
      map(() => true), // Return true on success
      catchError(err => {
        console.error('Login error:', err);
        this.logout();
        return of(false); // Return false on failure
      })
    );
  }

  // --- Registration Methods ---
  registerRider(payload: RiderRegistrationRequest): Observable<RiderregistrationResponse> {
    const url = `${this.apiUrl}/api/auth/register/rider`;
    return this.http.post<RiderregistrationResponse>(url, payload);
  }

  registerDriver(payload: DriverRegistrationRequest): Observable<DriverRegistrationResponse> {
    const url = `${this.apiUrl}/api/auth/register/driver`;
    return this.http.post<DriverRegistrationResponse>(url, payload);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  getDriver(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  getUserType(): 'rider' | 'driver' | null {
    return localStorage.getItem(this.userTypeKey) as 'rider' | 'driver' | null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserId(): string | null {
    const user = this.getUser();
    return user ? user['userId'] : null;
  }

  public isSessionExpired(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    const payload = this.decodeToken(token);

    if (!payload || !payload.exp) {
      console.warn('JWT token is present but lacks an expiration time (exp claim).');
      return true;
    }

    const expirationTimeSeconds = payload.exp;
    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    const timeBuffer = 5;

    const isExpired = expirationTimeSeconds < (currentTimeSeconds + timeBuffer);

    return isExpired;
  }

  private clearSessionState(): void {
    this.currentUser = null;
    this.currentUserType = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.userTypeKey);
    this.loggedInSubject.next(false);
    this.userTypeSubject.next(null);
  }

  logout(): void {
    this.clearSessionState();
    // The navigation happens ONLY when logout() is explicitly called by a user action.
    this.router.navigate(['/']);
  }

  private decodeToken(token: string): any | null {
    try {
      // JWT is separated by dots: header.payload.signature
      const payload = token.split('.')[1];

      // Decode the Base64Url-encoded payload
      // Replace non-Base64 characters
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');

      // Use atob to decode the string
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode JWT payload:', e);
      return null;
    }
  }
}