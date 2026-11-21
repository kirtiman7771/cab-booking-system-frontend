import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { MessageService } from '../services/message.service';

@Injectable()
export class HttpErrorRetryInterceptor implements HttpInterceptor {

    private messageService = inject(MessageService);
  // Configuration for retries: 3 retries (total 4 attempts: initial + 3 retries)
  private readonly MAX_RETRIES = 3;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      // 1. Implement Retry Logic with Delay (1s, 2s, 3s)
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          const httpError = error as HttpErrorResponse;
          const delayInSeconds = retryCount; // 1, 2, 3 seconds

          // Only retry on specific transient errors (status 0 for network failure, 5xx for server errors)
          if (retryCount <= this.MAX_RETRIES && this.shouldRetry(httpError)) {
            console.warn(`[HTTP Interceptor] Transient error (${httpError.status || 'Network'}). Attempt ${retryCount} of ${this.MAX_RETRIES}. Retrying in ${delayInSeconds} second(s)...`);
            // Use timer to introduce the requested delay
            return timer(delayInSeconds * 1000);
          } else {
            // Stop retrying on non-transient errors (like 4xx) or when max retries is reached
            return throwError(() => httpError); // Propagate the error for final handling
          }
        }
      }),
      // 2. Final Error Handling (after successful request or failure of all retries)
      catchError((error: HttpErrorResponse) => {
        console.error("got the error: " + error.message)
        // This is where the error is finally standardized and thrown
        return throwError(() => this.handleFinalError(error));
      })
    );
  }

  /**
   * Determines if the error is a transient error that warrants a retry.
   * @param error The HttpErrorResponse object.
   */
  private shouldRetry(error: HttpErrorResponse): boolean {
    // Status 0: Server down, connection refused (Network failure)
    if (error.status === 0) {
      return true;
    }

    // 5xx errors: Server errors (often temporary and worth retrying)
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // 4xx errors (e.g., 404, 400, 401) are client/logical errors and should fail immediately (no retry)
    return false;
  }

  /**
   * Maps the HttpErrorResponse to a standardized CustomHttpError with appropriate status codes.
   * @param error The HttpErrorResponse that failed all retries or was non-retryable.
   */
  private handleFinalError(error: HttpErrorResponse): void {
    // let errorMessage = 'An unhandled application error occurred.';
    // let statusCode = error.status;
    // if (error.error instanceof ErrorEvent) {
    //   // Client-side network error (rare, but possible)
    //   errorMessage = `Client Error: ${error.error.message}`;
    // } else if (error.status === 0) {
    //   // Network Failure: Server is not running or unreachable (Connection Refused)
    //   statusCode = 503; // Map status 0 to 503 Service Unavailable for clarity
    //   errorMessage = 'Connection Failed: The server is offline or unreachable.';
    // } else if (error.status === 404) {
    //   // Bad Endpoint: The requested URL is incorrect or missing
    //   statusCode = 404;
    //   errorMessage = `Bad Endpoint: Resource not found at ${error.url}.`;
    // } else if (error.status >= 400 && error.status < 500) {
    //   // Other Client Errors (400 Bad Request, 401 Unauthorized, etc.)
    //   const serverMessage = error.error?.message || error.statusText;
    //   errorMessage = `Client Error (${statusCode}): ${serverMessage}`;
    // } else if (error.status >= 500 && error.status < 600) {
    //    // Server-side Errors (500 Internal Server Error)
    //    const serverMessage = error.error?.message || error.statusText;
    //    errorMessage = `Server Error (${statusCode}): ${serverMessage}`;
    // }

    // const customError = new CustomHttpError(statusCode, errorMessage, error);

    this.messageService.sendMessage('error', 'Spmething went wrong. Please try after some time.');

    // return customError;
  }
}
