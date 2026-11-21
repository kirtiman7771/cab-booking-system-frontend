import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
  ): boolean {
    const userIsLoggedIn = this.authService.isLoggedIn();
    const currentUserType = this.authService.getUserType();
    const requiredRole = route.data['role'];

    if (!userIsLoggedIn) {
      this.router.navigate(['/']);
      return false;
    }

    if (requiredRole && currentUserType !== requiredRole) {
      if (currentUserType === 'rider') {
        this.router.navigate(['/rider/dashboard']);
      } else if (currentUserType === 'driver') {
        this.router.navigate(['/driver/dashboard']);
      }
      return false;
    }

    return true;
  }
}