export interface PaymentPayload {
  rideID: string;
  userID: string; // Assuming userId is a string
  amount: number;
  method: string;
  status: string; // To be updated on the backend
  timestamp: string;
  pickupLocation: string;
  dropLocation: string;
  receipientEmail?: string;
}