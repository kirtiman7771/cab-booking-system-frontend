export interface PaymentData { // Renamed interface for clarity
  fare: number;
  pickup: string;
  drop: string;
  rideId: string; // CRITICAL: Added rideId to the data interface
}