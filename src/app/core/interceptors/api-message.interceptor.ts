
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router'; // Import Router for navigation
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { MessageService } from '../services/message.service';
import { LoaderService } from '../services/loader.service';

const SKIP_GLOBAL_SUCCESS_HEADER = 'X-Skip-Global-Success-Message';

@Injectable()
export class ApiMessageInterceptor implements HttpInterceptor {

  constructor(
    private messageService: MessageService,
    private router: Router,
    private loaderService: LoaderService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    const skipGlobalSuccess = request.headers.get(SKIP_GLOBAL_SUCCESS_HEADER) === 'true';

    return next.handle(request).pipe(
      // --- Handle SUCCESS Response ---
      tap(event => {
        if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
          if (!skipGlobalSuccess) {
             // Use default success message or one from the API body
             const successMessage = event.body?.message || 'Operation completed successfully.';
            //  this.messageService.sendMessage('success', successMessage);
          }
          // If skipGlobalSuccess is true, the service method handles the message.
        }
      }),
      // --- Handle ERROR Response ---
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unknown error occurred.';

        // **Specific 403 (Forbidden) Handling - Token Expired**
        if (error.status === 403) {
           errorMessage = 'Session expired. Please log in again.';
           this.messageService.sendMessage('error', errorMessage);
           
           this.router.navigate(['/login']);
           return throwError(() => error);
        }
        finalize(() => {
          this.loaderService.hide();
      })

        // **Other Server-side Errors (e.g., 400, 404, 500)**
        if (error.error?.message) {
            errorMessage = error.error.message;
        } else if (error.status) {
            errorMessage = `Server Error: ${error.status} - ${error.statusText || 'An error occurred'}`;
        }
        
        this.messageService.sendMessage('error', errorMessage);
        
        return throwError(() => error); 
      })
    );
  }
}