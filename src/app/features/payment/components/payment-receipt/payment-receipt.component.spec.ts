import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from '../../services/payment.service';



// Mock environment for testing purposes (assuming it exists in a separate file)
// Since the environment file is not provided, we define a mock here.
// In a real project, this might be imported or globally mocked.
const mockEnvironment = {
  springApiUrl: 'http://localhost:8080'
};

// Replace the original environment with the mock environment for the test file scope
Object.defineProperty(window, 'environment', {
  value: mockEnvironment,
  writable: true
});

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;
  const paymentDataUrl = `${mockEnvironment.springApiUrl}/api/payments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PaymentService,
        // Provide the mock environment if needed, though usually it's handled via file structure
      ]
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);

    // Manually set the base URL property if the environment import is tricky
    (service as any).paymentDataUrl = paymentDataUrl;
  });

  afterEach(() => {
    httpMock.verify(); // Ensures that there are no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve payment data for a given userId', () => {
    const mockResponse = [{ id: 1, amount: 100 }];
    const userId = 'user123';

    service.getPaymentData(userId).subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${paymentDataUrl}?userId=${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should submit payment data', () => {
    const mockPayload = { rideID: 'R101', amount: 50, method: 'Card' };
    const mockResponse = { success: true };

    service.submitPayment(mockPayload).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${paymentDataUrl}/process`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockPayload);
    req.flush(mockResponse);
  });

  it('should get receipt PDF as ArrayBuffer for a given rideId', () => {
    const rideId = 'R456';
    // Create a simple mock ArrayBuffer (e.g., a small text file represented as binary)
    const mockArrayBuffer = new ArrayBuffer(8);

    service.getReceiptPdf(rideId).subscribe(data => {
      // Check if the received data is an ArrayBuffer
      expect(data instanceof ArrayBuffer).toBe(true);
      expect(data.byteLength).toBe(8);
      expect(data).toEqual(mockArrayBuffer);
    });

    const req = httpMock.expectOne(`${paymentDataUrl}/receipt/${rideId}`);
    expect(req.request.method).toBe('GET');
    // Verify that the request correctly specifies responseType: 'arraybuffer'
    expect(req.request.responseType).toBe('arraybuffer');
    req.flush(mockArrayBuffer);
  });
});