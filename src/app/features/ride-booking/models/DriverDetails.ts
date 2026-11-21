/**
 * driver.view-model.ts
 * View Model representing the minimal driver details required for UI display.
 */
export interface DriverDetails {
  /** The driver's full name (mapped from DriverResponseDTO.name). */
  name: string; 

  /** The driver's phone number (mapped from PersonalDetailsResponseDTO.phone). */
  phone: string;

  /** A formatted string combining the vehicle model and number. */
  vehicleInfo: string;
}