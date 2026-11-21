// ride-form-state.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { RideFormStateService } from './ride-form-state.service';
import { Location } from '../models/Locations';
import { CarFare } from '../models/CarFair';
import { RideFormData } from '../models/RideFormData';

describe('RideFormStateService', () => {
  let service: RideFormStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RideFormStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentFormData', () => {
    it('should return initial RideFormData on creation', () => {
      const formData = service.getCurrentFormData();
      expect(formData).toBeInstanceOf(RideFormData);
    });

    it('should return the current synchronous value', () => {
      const location = new Location();
      location.pickupLocation = 'Home';
      location.dropLocation = 'Airport';
      
      service.setLocation(location);
      const formData = service.getCurrentFormData();
      
      expect(formData.getLocation().pickupLocation).toBe('Home');
      expect(formData.getLocation().dropLocation).toBe('Airport');
    });
  });

  describe('getDistance and setDistance', () => {
    it('should return 0 initially', () => {
      expect(service.getDistance()).toBe(0);
    });

    it('should set and get distance correctly', () => {
      service.setDistance(25);
      expect(service.getDistance()).toBe(25);
    });

    it('should update distance value', () => {
      service.setDistance(10);
      service.setDistance(30);
      expect(service.getDistance()).toBe(30);
    });
  });

  describe('setLocation', () => {
    it('should update location in form data', (done) => {
      const location = new Location();
      location.pickupLocation = 'Home';
      location.dropLocation = 'Airport';
      
      // Skip the initial emission
      let emissionCount = 0;
      service.rideFormData$.subscribe(formData => {
        emissionCount++;
        if (emissionCount === 2) { // Second emission after setLocation
          const loc = formData.getLocation();
          expect(loc.pickupLocation).toBe('Home');
          expect(loc.dropLocation).toBe('Airport');
          done();
        }
      });
      
      service.setLocation(location);
    });

    it('should calculate random distance when location is set', () => {
      const location = new Location();
      location.pickupLocation = 'Home';
      location.dropLocation = 'Airport';
      
      service.setLocation(location);
      const distance = service.getDistance();
      
      expect(distance).toBeGreaterThanOrEqual(1);
      expect(distance).toBeLessThanOrEqual(50);
    });

    it('should emit changes to subscribers', (done) => {
      const location = new Location();
      location.pickupLocation = 'Office';
      location.dropLocation = 'Mall';
      
      let emissionCount = 0;
      service.rideFormData$.subscribe(formData => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial emission
          const loc = formData.getLocation();
          expect(loc.pickupLocation).toBe('Office');
          done();
        }
      });
      
      service.setLocation(location);
    });
  });

  describe('setSelectedCarFare', () => {
    it('should update selected car fare in form data', (done) => {
      const carFare: CarFare = {
        id: '1',
        type: 'Sedan',
        pricePerKm: 10,
        finalPrice: 100
      };
      
      let emissionCount = 0;
      service.rideFormData$.subscribe(formData => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial emission
          const selectedFare = formData.getSelectedCarFare();
          expect(selectedFare).toBeTruthy();
          expect(selectedFare?.type).toBe('Sedan');
          expect(selectedFare?.finalPrice).toBe(100);
          done();
        }
      });
      
      service.setSelectedCarFare(carFare);
    });

    it('should handle null car fare', () => {
      const formData = service.getCurrentFormData();
      expect(formData.getSelectedCarFare()).toBeNull();
    });

    it('should emit changes to subscribers', (done) => {
      const carFare: CarFare = {
        id: '2',
        type: 'SUV',
        pricePerKm: 15,
        finalPrice: 150
      };
      
      let emissionCount = 0;
      service.rideFormData$.subscribe(formData => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(formData.getSelectedCarFare()?.type).toBe('SUV');
          done();
        }
      });
      
      service.setSelectedCarFare(carFare);
    });
  });

  describe('updateRideFormData', () => {
    it('should update location when provided', (done) => {
      const location = new Location();
      location.pickupLocation = 'Station';
      location.dropLocation = 'Hotel';
      
      const partialData = new RideFormData();
      partialData.setLocation(location);
      
      let emissionCount = 0;
      service.rideFormData$.subscribe(formData => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial emission
          const loc = formData.getLocation();
          expect(loc.pickupLocation).toBe('Station');
          expect(loc.dropLocation).toBe('Hotel');
          done();
        }
      });
      
      service.updateRideFormData(partialData);
    });

    it('should update car fare when provided', (done) => {
      const carFare: CarFare = {
        id: '3',
        type: 'Luxury',
        pricePerKm: 20,
        finalPrice: 200
      };
      
      const partialData = new RideFormData();
      partialData.setSelectedCarFare(carFare);
      
      let emissionCount = 0;
      service.rideFormData$.subscribe(formData => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial emission
          const fare = formData.getSelectedCarFare();
          expect(fare?.type).toBe('Luxury');
          expect(fare?.finalPrice).toBe(200);
          done();
        }
      });
      
      service.updateRideFormData(partialData);
    });

    it('should update both location and car fare', (done) => {
      const location = new Location();
      location.pickupLocation = 'Home';
      location.dropLocation = 'Work';
      
      const carFare: CarFare = {
        id: '4',
        type: 'Economy',
        pricePerKm: 8,
        finalPrice: 80
      };
      
      const partialData = new RideFormData();
      partialData.setLocation(location);
      partialData.setSelectedCarFare(carFare);
      
      let emissionCount = 0;
      service.rideFormData$.subscribe(formData => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial emission
          const loc = formData.getLocation();
          const fare = formData.getSelectedCarFare();
          expect(loc.pickupLocation).toBe('Home');
          expect(loc.dropLocation).toBe('Work');
          expect(fare?.type).toBe('Economy');
          expect(fare?.finalPrice).toBe(80);
          done();
        }
      });
      
      service.updateRideFormData(partialData);
    });
  });

  describe('resetState', () => {
    it('should reset distance to 0', () => {
      service.setDistance(45);
      service.resetState();
      expect(service.getDistance()).toBe(0);
    });

    it('should reset form data to initial state', () => {
      const location = new Location();
      location.pickupLocation = 'Home';
      location.dropLocation = 'Airport';
      
      const carFare: CarFare = {
        id: '1',
        type: 'Sedan',
        pricePerKm: 10,
        finalPrice: 100
      };
      
      service.setLocation(location);
      service.setSelectedCarFare(carFare);
      
      // Verify data is set
      let beforeReset = service.getCurrentFormData();
      expect(beforeReset.getLocation().pickupLocation).toBe('Home');
      
      // Reset
      service.resetState();
      
      // Verify data is reset
      let afterReset = service.getCurrentFormData();
      expect(afterReset.getSelectedCarFare()).toBeNull();
    });

    it('should emit reset state to all subscribers', (done) => {
      const location = new Location();
      location.pickupLocation = 'Office';
      location.dropLocation = 'Mall';
      
      let emissionCount = 0;
      
      // Subscribe BEFORE making changes
      service.rideFormData$.subscribe(formData => {
        emissionCount++;
        // Initial emission (1) + setLocation (2) + resetState (3)
        if (emissionCount === 3) {
          const currentFormData = service.getCurrentFormData();
          expect(currentFormData).toBeInstanceOf(RideFormData);
          expect(currentFormData.getSelectedCarFare()).toBeNull();
          done();
        }
      });
      
      // Now make changes after subscription
      service.setLocation(location);
      service.resetState();
    });
  });

  describe('rideFormData$ Observable', () => {
    it('should emit initial value on subscription', (done) => {
      service.rideFormData$.subscribe(formData => {
        expect(formData).toBeInstanceOf(RideFormData);
        done();
      });
    });

    it('should emit on every state change', (done) => {
      const emissions: RideFormData[] = [];
      
      service.rideFormData$.subscribe(formData => {
        emissions.push(formData);
        if (emissions.length === 3) { // Initial + 2 updates
          expect(emissions.length).toBe(3);
          done();
        }
      });
      
      const location = new Location();
      location.pickupLocation = 'A';
      location.dropLocation = 'B';
      service.setLocation(location);
      
      const carFare: CarFare = {
        id: '1',
        type: 'Test',
        pricePerKm: 5,
        finalPrice: 50
      };
      service.setSelectedCarFare(carFare);
    });
  });
});