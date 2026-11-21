import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  snapshot: any;
    
  constructor(private http : HttpClient) {  
  }
  paymentDataUrl : string  = `${environment.springApiUrl}/api/payments`

  getPaymentData(userId: string): Observable<any> {
  
    const url = `${this.paymentDataUrl}?userId=${userId}`;
    
    return this.http.get(url);
  }

  submitPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.paymentDataUrl}/process`, paymentData);
  }

  
getReceiptPdf(rideId: string): Observable<ArrayBuffer> {
  return this.http.get(`${this.paymentDataUrl}/receipt/${rideId}`, {
    responseType: 'arraybuffer' 
  });
}
}


