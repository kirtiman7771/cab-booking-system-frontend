import { PaymentMethod } from "./PaymentMethod";
import { RideStatus } from "./RideStatus";


export interface RidePayload {
  id?: string,
  userId: string,
  driverId?: string,
  carType?: string,
  pickupLocation: string,
  dropLocation: string,
  fare: number,
  status: RideStatus
  receipientEmail: string,
}
