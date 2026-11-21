import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-error',
  standalone: false,
  templateUrl: './error.component.html',
  styleUrl: './error.component.css',
})
export class ErrorComponent {
 @Input() errorCode: number = 404; 
  
  errorMessage: string = 'The page you are looking for doesn\'t exist.';
  errorTagline: string = 'Page Not <span> Found</span>';
  actionButtonText: string = 'Go to Home Page';

  isSessionError: boolean = false; 

  constructor(
    private router: Router,
    private authService: AuthService 
  ) {}

  ngOnInit(): void {
    if (this.authService.isSessionExpired()) { 
      this.handleSessionExpired();
    } else {
      // Default handling for 404
      this.errorCode = 404;
      this.errorMessage = 'The page you are looking for doesn\'t exist.';
      this.errorTagline = 'Page Not <span> Found</span>';
      this.actionButtonText = 'Go to Home Page';
      this.isSessionError = false;
    }
  }

  private handleSessionExpired(): void {
    this.errorCode = 403; // Using 403 (Forbidden/Unauthorized) for session issues
    this.errorTagline = 'Session <span> Expired</span>';
    this.errorMessage = 'Your session has timed out. Please click "Log Out" to return to the landing page.';
    this.actionButtonText = 'Log Out';
    this.isSessionError = true;
    
    // IMPORTANT: When the component loads due to a session expiration detection 
    // (via isSessionExpired()), the AuthService.logout() has already been called
    // inside the isSessionExpired() method, clearing the local state.
    // We just need to present the button now.
  }

  goToHome(): void {
    if (this.isSessionError) {
      // ACTION 1: If session expired, call the AuthService logout method.
      // This method already handles clearing storage AND navigating to the landing page ('/').
      this.authService.logout(); 
    } else {
      // ACTION 2: If 404, navigate based on user type or to the landing page.
      const userType = this.authService.getUserType();
      if (userType === 'driver') {
        this.router.navigate(['/driver/dashboard']);
      } else if (userType === 'rider') {
        this.router.navigate(['/rider/dashboard']);
      } else {
        this.router.navigate(['/']); // Fallback to landing page for unauthenticated users
      }
    }
  }
}