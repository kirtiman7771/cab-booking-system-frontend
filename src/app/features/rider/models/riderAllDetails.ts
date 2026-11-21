export interface RiderAllDetails {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdAt: any
  updatedAt: any
  role: string
  todaySpent: number
  todayRides: number
  rating: number
  totalSpent: number
  totalRides: number
}

export interface RiderLoginPayload {
  email: string
  passwordHash: string
}

export interface CarTypesCount {
  [carType: string]: number
}