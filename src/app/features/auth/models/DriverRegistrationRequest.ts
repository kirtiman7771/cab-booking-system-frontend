export interface DriverRegistrationRequest {
  personalDetails: PersonalDetails
  driverDetails: DriverDetails
  vehicleDetails: VehicleDetails
  bankingDetails: BankingDetails
}

export interface PersonalDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  password: string
  confirmPassword: string
}

export interface DriverDetails {
  licenseNumber: string
  licenseExpiry: string
  experience: number
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
}

export interface VehicleDetails {
  vehicleNumber: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: number
  vehicleColor: string
}

export interface BankingDetails {
  bankAccount: string
  routingNumber: string
}
