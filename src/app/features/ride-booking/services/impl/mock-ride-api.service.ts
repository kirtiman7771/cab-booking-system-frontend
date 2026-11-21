// src/app/services/mock/mock-ride-repository.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, timer, switchMap, map, throwError } from 'rxjs';
import { CarFare } from '../../models/CarFair';
import { PaymentStatus } from '../../models/PaymentStatus';
import { Ride } from '../../models/Ride';
import { RideStatus } from '../../models/RideStatus';
import { PaymentMethod } from '../../models/PaymentMethod';
import { tap, delay } from 'rxjs/operators';
import { RideRepository } from '../interfaces/RideRepository';
import { environment } from '../../../../../environment/environment';

/**
 * In-memory data to simulate a backend database.
 */
const MOCK_CAR_FARES: CarFare[] = [
  { id: '1', type: 'Economy', pricePerKm: 15, finalPrice: 0 },
  { id: '2', type: 'Premium', pricePerKm: 25, finalPrice: 0 },
];

const MOCK_DRIVERS = [
  { id: "3272", name: "Sandhiya", email: "sanidhya123@gmail.com", phone: 8276860980, password: "Sanidhya@123", licenseNumber: "LIC1234", vehicleDetails: "Toyota Innova - KA01AB1234", status: "available", createdAt: "2024-08-31T10:20:30Z", updatedAt: "2024-08-31T10:20:30Z" },
  { id: "8493", name: "Kirtiman", email: "kirtiman123@gmail.com", phone: 8276860990, password: "kirtiman@123", licenseNumber: "LIC123", vehicleDetails: "Toyota Innova - KA01AB1234", status: "available", createdAt: "2024-08-31T10:20:30Z", updatedAt: "2024-08-31T10:20:30Z" }
];

// Changed to string for ID keys
const MOCK_PAYMENTS = new Map<string, any>();

// Helper function to load data from localStorage
const loadRidesFromLocalStorage = (): Ride[] => {
  const storedRides = localStorage.getItem('MOCK_RIDES');
  if (storedRides) {
    return JSON.parse(storedRides);
  }
  return [];
};

// Helper function to save data to localStorage
const saveRidesToLocalStorage = (rides: Ride[]) => {
  localStorage.setItem('MOCK_RIDES', JSON.stringify(rides));
};

// Initial data for the mock repo
const INITIAL_MOCK_RIDES: Ride[] = [
  {
    // Changed to string
    id: '1',
    // Changed to string
    rideId: '1',
    userId: '19351',
    pickupLocation: '456 Oak Ave',
    dropLocation: '789 Pine Rd',
    carType: 'Economy',
    fare: 150,
    status: RideStatus.LookingForDriver,
    dateTime: new Date(),
    receipientEmail: 'rider@example.com'
  },
  {
    // Changed to string
    id: '2',
    // Changed to string
    rideId: '2',
    userId: '19351',
    pickupLocation: '123 Maple St',
    dropLocation: '456 Oak Ave',
    carType: 'Premium',
    fare: 250,
    driverId: "3272",
    status: RideStatus.Ongoing,
    dateTime: new Date(),
    receipientEmail: 'rider@example.com'
  },
];

// Initialize MOCK_RIDES from localStorage or with default data
let MOCK_RIDES: Ride[] = loadRidesFromLocalStorage().length > 0
  ? loadRidesFromLocalStorage()
  : INITIAL_MOCK_RIDES;

// Logic to determine the next ID string (e.g., converting the largest existing ID number to a string and incrementing it)
let nextRideIdNum = MOCK_RIDES.length > 0 ? (Number(MOCK_RIDES[MOCK_RIDES.length - 1].id) || 0) + 1 : 1;
const pollingInterval = 3000;

@Injectable({
  providedIn: 'root',
})
export class MockRideApiService implements RideRepository {

  constructor() {
    console.log("MockRideRepository started");
    this.setupStorageListener();
    saveRidesToLocalStorage(MOCK_RIDES);
  }

  // Changed rideId parameter type to string
  updateRide(rideId: string, data: Partial<Ride>): Observable<Ride> {
    // 1. Find the existing ride - Comparing strings now
    const existingRideIndex = MOCK_RIDES.findIndex(r => r.rideId === rideId);

    if (existingRideIndex === -1) {
      // Mimics throwing a RideNotFound exception
      return throwError(() => new Error(`Ride with id ${rideId} not found`));
    }

    const existingRide = MOCK_RIDES[existingRideIndex];
    // Create a mutable copy to apply updates
    const updatedRide: Ride = { ...existingRide };

    try {
      // ... (rest of the updateRide function logic remains mostly the same, as it deals with keys/values in the partial data)
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const value = data[key as keyof Partial<Ride>];

          switch (key) {
            case 'userId':
              // Long.valueOf(String.valueOf(value)) -> String(value)
              updatedRide.userId = (String(value));
              break;
            case 'pickupLocation':
              updatedRide.pickupLocation = value as string;
              break;
            case 'dropLocation':
              updatedRide.dropLocation = value as string;
              break;
            case 'driverId':
              {
                const driverIdValue = value === undefined || value === null || String(value).toLowerCase() === 'null'
                  ? undefined // Use undefined for null/absence in TypeScript model
                  : String(value);

                if (driverIdValue === undefined) {
                  updatedRide.driverId = undefined; // explicitly set to null/undefined
                } else {
                  // Mimics existsByRideIdAndDriverIdIsNotNull check
                  const isRideAssignedAlready = existingRide.driverId !== undefined && existingRide.driverId !== null;

                  if (isRideAssignedAlready) {
                    // Mimics throwing AlreadyRideAssignedException
                    return throwError(() => new Error("Ride is Already Assigned"));
                  }

                  updatedRide.driverId = driverIdValue;
                  updatedRide.status = RideStatus.ConfirmedByDriver;
                }
              }
              break;
            case 'carType':
              updatedRide.carType = value as string;
              break;
            case 'fare':
              // Double.valueOf(String.valueOf(value)) -> Number(String(value))
              updatedRide.fare = Number(String(value));
              break;
            case 'status':
              // RideStatus.valueOf((String) value) -> Type assertion and validation
              const statusValue = String(value);
              if (!Object.values(RideStatus).includes(statusValue as RideStatus)) {
                // Note: Throwing a synchronous error here is fine, the catch block handles it.
                throw new Error(`Unexpected status value: ${statusValue}`);
              }
              updatedRide.status = statusValue as RideStatus;
              break;
            // Note: 'paymentMethod' case is skipped as it was commented out in the original Java code
            default:
              // Mimics throwing IllegalStateException
              throw new Error(`Unexpected value: ${key}`);
          }
        }
      }

      // 3. Save the updated ride (mirrors rideRepository.save)
      MOCK_RIDES[existingRideIndex] = updatedRide;
      saveRidesToLocalStorage(MOCK_RIDES);

      // 4. Return the saved ride as an Observable
      return of(updatedRide).pipe(
        tap(() => console.log(`Mock: Ride ${rideId} patched successfully.`, updatedRide)),
        delay(500) // Simulate network delay
      );
    } catch (error) {
      // Catch synchronous errors (like 'Unexpected value' or errors from validation logic)
      return throwError(() => error);
    }
  }

  // Changed rideId to string and driverId to string
  startRide(rideId: string, driverId: string): Observable<Ride> {
    return this.updateRideStatus(rideId, RideStatus.Ongoing);
  }

  // rideId is string
  getRideStatus(rideId: string): Observable<RideStatus> {
    // Comparing strings now
    const ride = MOCK_RIDES.find(r => r.rideId === rideId); 

    if (ride) {
      return of(ride.status as RideStatus).pipe(
        tap(() => console.log(`Mock: Fetching status for ride ${rideId}. Status: ${ride.status}`)),
        // Add a small delay to simulate network latency, consistent with other methods
        delay(500)
      );
    }
    else throw Error("Getting Status: Ride Not Found");
  }

  private setupStorageListener(): void {
    if (environment.repositoryType === 'mock') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === 'MOCK_RIDES' && event.newValue !== event.oldValue) {
          console.log('Storage event detected. Updating local MOCK_RIDES array.');
          MOCK_RIDES = loadRidesFromLocalStorage();
        }
      });
    }
  }

  // id is string
  updateRideStatus(id: string, newStatus: string): Observable<any> {
    // Comparing strings now
    const ride = MOCK_RIDES.find(r => r.rideId === id);
    if (ride) {
      ride.status = newStatus as RideStatus;
      saveRidesToLocalStorage(MOCK_RIDES);
      return of({ status: 'success', message: `Ride ${id} status updated to ${newStatus}` }).pipe(
        tap(() => console.log(`Mock: Ride ${id} status updated to '${newStatus}'.`)),
        delay(500)
      );
    }
    return throwError(() => new Error('Ride not found.'));
  }

  getCarFares(): Observable<CarFare[]> {
    return of(MOCK_CAR_FARES).pipe(
      tap(() => console.log('Mock: Fetching car fares...')),
      delay(1000)
    );
  }

  // userId is string | number but comparison is safe with ==
  getUserRides(userId: string | number): Observable<Ride[]> {
    const userRides = MOCK_RIDES.filter(ride => ride.userId == userId);
    return of(userRides).pipe(
      tap(() => console.log(`Mock: Getting rides for user ${userId}...`)),
      delay(500)
    );
  }

  // rideId is string
  getRideById(rideId: string, isPolling: boolean = false): Observable<Ride | null> {
    // Comparing strings now
    const singleRequest$ = of(MOCK_RIDES.find(r => r.rideId === rideId)).pipe(
      delay(500),
      tap(ride => console.log(`Mock: Getting ride by ID ${rideId}...`))
    );
    if (isPolling) {
      return timer(0, pollingInterval).pipe(
        switchMap(() => {
          const updatedRides = loadRidesFromLocalStorage();
          // Comparing strings now
          const ride = updatedRides.find(r => r.rideId === rideId);
          return of(ride);
        }),
        map(ride => ride || null)
      );
    }
    return singleRequest$;
  }

  bookRide(ride: Ride): Observable<Ride> {
    // Generate next ID as string and increment the number counter
    const idString = (nextRideIdNum++).toString(); 
    // Use string for id and rideId
    const newRide = { ...ride, id: idString, rideId: idString, dateTime: new Date() };
    MOCK_RIDES.push(newRide);
    saveRidesToLocalStorage(MOCK_RIDES);

    setTimeout(() => {
      const randomDriver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
      // newRide.id is a string now
      this.assignDriver(newRide.id, randomDriver.id).subscribe();
      console.log(`Mock: Attempting to assign random driver to ride ${newRide.id}`);
    }, 5000 + Math.random() * 5000);

    return of(newRide).pipe(
      tap(() => {
        console.log('Mock: Booking new ride...');
      }),
      delay(1500)
    );
  }

  processPayment(paymentInfo: any): Observable<any> {
    // Use string key for MOCK_PAYMENTS
    MOCK_PAYMENTS.set(String(paymentInfo.rideId), {
      rideId: String(paymentInfo.rideId),
      status: PaymentStatus.Pending,
    });
    console.log('Mock: Processing payment...');
    setTimeout(() => {
      const random = Math.random();
      const finalStatus = random < 0.8 ? PaymentStatus.Paid : PaymentStatus.Cancelled;
      // Use string key for MOCK_PAYMENTS
      const rideIdStr = String(paymentInfo.rideId);
      if (MOCK_PAYMENTS.has(rideIdStr)) {
        // Corrected key to access map element: should be rideIdStr
        const paymentRecord = MOCK_PAYMENTS.get(rideIdStr);
        if (paymentRecord) {
            paymentRecord.status = finalStatus;
        }
        console.log(`Mock: Payment for ride ${rideIdStr} status updated to ${finalStatus}`);
      }
    }, 5000 + Math.random() * 5000);
    return of(paymentInfo).pipe(delay(2000));
  }

  // userId is string | number but comparison is safe with ==
  getUpcomingRidesForUser(userId: string | number): Observable<Ride[]> {
    const upcomingRides = MOCK_RIDES.filter(
      (ride) =>
        ride.userId == userId &&
        (ride.status == RideStatus.Ongoing || ride.status == RideStatus.CancelledByDriver || ride.status == RideStatus.LookingForDriver || ride.status == RideStatus.ConfirmedByDriver)
    );
    return of(upcomingRides).pipe(
      tap(() => console.log(`Mock: Getting upcoming rides for user ${userId}...`)),
      delay(500)
    );
  }

  // rideId is string
  getReceipt(rideId: string, isPolling: boolean = false): Observable<any> {
    // Use string key for MOCK_PAYMENTS
    const singleRequest$ = of(MOCK_PAYMENTS.get(rideId)).pipe(
      delay(500),
      tap(receipt => console.log(`Mock: Getting receipt for ride ${rideId}... Current status: ${receipt?.status || 'Not Found'}`))
    );

    if (isPolling) {
      return timer(0, pollingInterval).pipe(
        switchMap(() => singleRequest$),
      );
    }
    return singleRequest$.pipe(map(receipt => receipt ? [receipt] : []));
  }

  // driverId is string | number but comparison is safe with ==
  getDriverDetailsById(driverId: string | number): Observable<any> {
    const driver = MOCK_DRIVERS.find(d => d.id == driverId);
    if (driver) {
      return of([driver]).pipe(
        tap(() => console.log(`Mock: Getting driver details for ID ${driverId}...`)),
        delay(500)
      );
    }
    return of([]).pipe(
      tap(() => console.log(`Mock: Driver not found for ID ${driverId}`)),
      delay(500)
    );
  }

  // rideId is string
  cancelRideByDriver(rideId: string): Observable<any> {
    // Comparing strings now
    const ride = MOCK_RIDES.find(r => r.rideId === rideId);
    if (ride) {
      ride.status = RideStatus.CancelledByDriver;
      ride.driverId = undefined;
      saveRidesToLocalStorage(MOCK_RIDES);
      return of({ status: 'success' }).pipe(
        tap(() => console.log(`Mock: Driver canceling ride ${rideId}...`)),
        delay(1000)
      );
    }
    return of({ status: 'error' }).pipe(
      tap(() => console.log(`Mock: Failed to cancel ride ${rideId}`)),
      delay(1000)
    );
  }

  // rideId is string
  cancelRideByUser(rideId: string): Observable<any> {
    // Comparing strings now
    const ride = MOCK_RIDES.find(r => r.rideId === rideId);
    if (ride) {
      ride.status = RideStatus.CancelledByUser;
      ride.driverId = undefined;
      saveRidesToLocalStorage(MOCK_RIDES);
      return of({ status: 'success' }).pipe(
        tap(() => console.log(`Mock: User canceling ride ${rideId}...`)),
        delay(1000)
      );
    }
    return of({ status: 'error' }).pipe(
      tap(() => console.log(`Mock: Failed to cancel ride ${rideId}`)),
      delay(1000)
    );
  }

  getUnassignedRides(): Observable<Ride[]> {
    const unassignedRides = MOCK_RIDES.filter(ride =>
      (ride.status === RideStatus.LookingForDriver || ride.status === RideStatus.CancelledByDriver) && !ride.driverId
    );
    return of(unassignedRides).pipe(
      tap(() => console.log('Mock: Getting unassigned rides...')),
      delay(500)
    );
  }

  // rideId is string
  markRideAsCompleted(rideId: string): Observable<Ride> {
    // Comparing strings now
    const ride = MOCK_RIDES.find(r => r.rideId === rideId);
    if (ride) {
      ride.status = RideStatus.Completed;
      saveRidesToLocalStorage(MOCK_RIDES);
      return of(ride).pipe(
        tap(() => console.log(`Mock: Marking ride ${rideId} as completed...`)),
        delay(1000)
      );
    }
    return of(null).pipe(
      tap(() => console.log(`Mock: Failed to mark ride ${rideId} as completed.`)),
      delay(1000)
    );
  }

  // rideId is string
  isRideAssigned(rideId: string): Observable<boolean> {
    // Comparing strings now
    const ride = MOCK_RIDES.find(r => r.rideId === rideId);
    return of(!!(ride && ride.driverId)).pipe(
      delay(500)
    );
  }

  // rideId and driverId are strings
  assignDriver(rideId: string, driverId: string): Observable<Ride> {
    return this.isRideAssigned(rideId).pipe(
      switchMap(isAssigned => {
        if (isAssigned) {
          console.warn(`Mock: Ride ${rideId} already has a driver assigned. Refusing to assign new driver.`);
          return throwError(() => new Error('Ride is already assigned to a driver.'));
        }

        // Comparing strings now
        const ride = MOCK_RIDES.find(r => r.rideId === rideId);
        if (ride) {
          ride.status = RideStatus.ConfirmedByDriver;
          // driverId is already a string
          ride.driverId = driverId; 
          saveRidesToLocalStorage(MOCK_RIDES);
          return of(ride).pipe(
            tap(() => console.log(`Mock: Assigning driver ${driverId} to ride ${rideId}...`)),
            delay(1000)
          );
        }
        return of(null).pipe(
          tap(() => console.log(`Mock: Failed to assign driver to ride ${rideId}.`)),
          delay(1000)
        );
      })
    );
  }

  // userId is string
  hasTwoActiveRides(userId: string): Observable<boolean> {
    // getUserRides handles string | number, but passing string is fine
    return this.getUserRides(userId).pipe(
      map((rides: Ride[]) => {
        const activeRides = rides.filter(ride =>
          ride.status !== RideStatus.Completed &&
          ride.status !== RideStatus.CancelledByUser
        );
        return activeRides.length >= 2;
      })
    );
  }

  // driverId is string
  public getUpcomingRidesForDriver(driverId: string, isPolling: boolean = false): Observable<Ride[]> {
    const getFilteredRides = () => {
      const upcomingRide = MOCK_RIDES.filter(
        // driverId is compared with == which is safe, but strict === is preferable if both are string.
        ride => ride && this.isToday(ride.dateTime)
          && ride.driverId === driverId
          && (ride.status === RideStatus.Ongoing || ride.status === RideStatus.ConfirmedByDriver)
      );
      return of(upcomingRide).pipe(
        tap(() => console.log(`Mock: Getting ongoing ride for driver ${driverId}...`))
      );
    };

    if (isPolling) {
      return timer(0, pollingInterval).pipe(
        switchMap(() => {
          MOCK_RIDES = loadRidesFromLocalStorage();
          return getFilteredRides();
        }),
        map(rides => rides.filter(ride =>
          // driverId is compared with == which is safe, but strict === is preferable if both are string.
          ride && this.isToday(ride.dateTime)
          && ride.driverId === driverId 
          && (ride.status === RideStatus.Ongoing || ride.status === RideStatus.ConfirmedByDriver)))
      );
    }
    return getFilteredRides();
  }

  isToday = (date: Date): boolean => {
    const today = new Date();
    // Ensure we compare against a valid Date object, handling strings if necessary
    const dateToCheck = typeof date === 'string' ? new Date(date) : date;

    return (
      dateToCheck.getDate() === today.getDate() &&
      dateToCheck.getMonth() === today.getMonth() &&
      dateToCheck.getFullYear() === today.getFullYear()
    );
  };
}