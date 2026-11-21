import { Ride } from "../../ride-booking/models/Ride";
import { RideStatus } from "../../ride-booking/models/RideStatus";

export interface RideHistory {
  rideId: string
  userId: string
  pickupLocation: string
  dropLocation: string
  driverId: string
  carType: string
  fare: number
  status: RideStatus
  dateTime: string
  rating?: Rating
}

export interface Rating {
  id: string
  userId: string
  driverId: string
  rating: number
  comments: string
  rideId: string
}

