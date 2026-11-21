import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';
import { LoaderService } from '../services/loader.service';


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private loaderService: LoaderService 
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.loaderService.show(); 
    
    const token = this.authService.getToken();
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError(error => {
        // Handle 401 Unauthorized here (e.g., call authService.logout())
        if (error.status === 401) {
          this.authService.logout();
        }
        return throwError(() => error);
      }),
      
      finalize(() => {
        
        this.loaderService.hide(); 
      })
    );
  }
}