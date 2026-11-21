// ...existing code...
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './features/auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'cab-booking-system';
  isSessionExpired: boolean = false;
  isLoggedIn: boolean = false;
  private sub: Subscription | null = null;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.updateSessionState();
    this.sub = this.authService.isLoggedIn$.subscribe(() => this.updateSessionState());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateSessionState(): void {
    this.isSessionExpired = this.authService.isSessionExpired();
  }
}
