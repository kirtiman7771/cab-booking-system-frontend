import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // const token = localStorage.getItem('authToken'); // Or use a service to retrieve the token

        const token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9SSURFUiIsInN1YiI6ImFyanVuQGdtYWlsLmNvbSIsImlhdCI6MTc2MjE3MjExOCwiZXhwIjoxNzYyMTc1NzE4fQ.CSflSZ8ZkMhf6nz1ngxw0lMYQKWE1IimfghGMn4O4dg"

        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(request);
    }
}