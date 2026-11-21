import { Location } from "./Locations";
import { CarFare } from "./CarFair";

export class RideFormData {
  private locationData: Location;
  private selectedCarFare: CarFare | null = null;

//   constructor(pickupLocation: string = '', dropLocation: string = '', selectedCarFare: CarFare | null = null) {
//     this.locationData.pickupLocation = pickupLocation;
//     this.locationData.dropLocation = dropLocation;
//     this.selectedCarFare = selectedCarFare;
//   }

  public getLocation(): Location {
    return this.locationData;
  }

  public setLocation(location: Location) {
    this.locationData = location;
  }

  // Getter and Setter for selectedCarFare
  public getSelectedCarFare(): CarFare | null{
    return this.selectedCarFare;
  }

  public setSelectedCarFare(fare: CarFare): void {
    this.selectedCarFare = fare;
  }

  public isAnyFieldEmpty(): boolean {
    return this.locationData.pickupLocation.length === 0 || this.locationData.dropLocation.length === 0
        || !this.selectedCarFare || !this.selectedCarFare.finalPrice || this.selectedCarFare.finalPrice === 0
  }
}
