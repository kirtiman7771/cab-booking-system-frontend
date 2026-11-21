/**
 * driver-api-response.interface.ts
 * Represents the structure of the data received directly from the backend API.
 */

export interface BankingDetailsDTO {
    // Only includes fields if necessary for API contract completion, otherwise omitted
    bankName?: string;
}

export interface DriverDetailsDTO {
    // Only includes fields if necessary for API contract completion, otherwise omitted
    licenseNumber?: string;
}

export interface PersonalDetailsResponseDTO {
    firstName: string;
    lastName: string;
    email: string;
    phone: string; // <-- Needed for UI
    dateOfBirth: string;
}

export interface VehicleDetailsDTO {
    vehicleNumber: string; // <-- Needed for UI
    vehicleMake: string;
    vehicleModel: string; // <-- Needed for UI
    vehicleYear: number;
    vehicleColor: string;
}

export interface DriverResponseDTO {
    id: string;
    name: string; // <-- Needed for UI (Derived field)
    createdAt: string;
    updatedAt: string;

    personalDetails: PersonalDetailsResponseDTO;
    driverDetails: DriverDetailsDTO;
    vehicleDetails: VehicleDetailsDTO;
    bankingDetails: BankingDetailsDTO;
}