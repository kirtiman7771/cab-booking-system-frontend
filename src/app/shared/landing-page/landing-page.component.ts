import { Component } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../../features/auth/components/login/login.component';

@Component({
  selector: 'app-landing-page',
  standalone: false,
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {

  isLoggedIn: boolean = false;
  private sub: Subscription | null = null;


  constructor(
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Subscribe so the component updates immediately when auth state changes (e.g. logout)
    this.sub = this.authService.isLoggedIn$.subscribe(val => {
      this.isLoggedIn = val;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

    openUserLogin() {
    this.dialog.open(LoginComponent, {
    });
  }

}
