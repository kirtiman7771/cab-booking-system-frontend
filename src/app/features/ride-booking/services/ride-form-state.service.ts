// src/app/modules/ride-booking/services/ride-form-state.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RideFormData } from '../models/RideFormData';
import { Location } from '../models/Locations';
import { CarFare } from '../models/CarFair';
import { MathUtils } from '../utils/MathUtils';

@Injectable({
  providedIn: 'root'
})
export class RideFormStateService {
  // State variables for form data and derived data
  private distance: number = 0; 
  private initialRideFormData = new RideFormData();
  
  // Subject for the form data state
  private rideFormDataSubject = new BehaviorSubject<RideFormData>(this.initialRideFormData);
  
  // Public Observable for components and services to subscribe to
  public rideFormData$: Observable<RideFormData> = this.rideFormDataSubject.asObservable();

  constructor() { }

  /**
   * Getter for the current synchronous value of RideFormData.
   */
  public getCurrentFormData(): RideFormData {
    return this.rideFormDataSubject.value;
  }

  /**
   * Getter for the calculated distance.
   */
  public getDistance(): number {
    return this.distance;
  }
  
  /**
   * Setter for the calculated distance.
   * This is called by the business logic service after calculation.
   */
  public setDistance(distance: number): void {
    this.distance = distance;
    // Note: We don't necessarily call .next() here, as distance is often updated
    // alongside setLocation, which will trigger the subject update.
  }

  /**
   * Component-facing method to update location.
   */
  public setLocation(location: Location): void {
    const currentData = this.getCurrentFormData();
    currentData.setLocation(location); 
    this.distance = MathUtils.calculateRandomDistance();
    // Emit the change to subscribers
    this.rideFormDataSubject.next(currentData);
  }
  
  /**
   * Component-facing method to set selected car fare.
   */
  public setSelectedCarFare(carFareModel: CarFare | null): void {
    const currentData = this.getCurrentFormData();
    currentData.setSelectedCarFare(carFareModel);
    // Emit the change to subscribers
    this.rideFormDataSubject.next(currentData);
  }

  /**
   * Component-facing method to update the form data partially.
   */
  public updateRideFormData(data: Partial<RideFormData>): void {
    const currentData = this.getCurrentFormData();
    
    if (data.getLocation && data.getLocation()) {
        currentData.setLocation(data.getLocation());
    }
    if (data.getSelectedCarFare && data.getSelectedCarFare()) {
        currentData.setSelectedCarFare(data.getSelectedCarFare());
    }
    
    // Emit the change to subscribers
    this.rideFormDataSubject.next(currentData);
  }

  /**
   * Reset the entire form state.
   */
  public resetState(): void {
    this.distance = 0; // Reset distance
    this.rideFormDataSubject.next(new RideFormData()); // Reset form data
  }

}