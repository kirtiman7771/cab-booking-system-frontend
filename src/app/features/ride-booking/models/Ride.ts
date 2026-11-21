import { PaymentMethod } from "./PaymentMethod";
import { RideStatus } from "./RideStatus";


export interface Ride {
  id?: string,
  rideId: string,
  userId: string,
  driverId?: string,
  carType?: string,
  pickupLocation: string,
  dropLocation: string,
  fare: number,
  status: RideStatus,
  dateTime: Date,
  receipientEmail: string,
}
