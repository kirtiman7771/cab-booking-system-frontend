import { Component, OnInit, OnDestroy, signal, effect, Inject } from '@angular/core';
import { catchError, map, Observable, of, Subscription } from 'rxjs';
import { CarFare } from '../../models/CarFair';
import { RideRepository } from '../../services/interfaces/RideRepository';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RideBookingService } from '../../services/impl/ride-booking.service';
import { InternetUtils } from '../../../../core/utils/InternetUtils';
import { RideFormData } from '../../models/RideFormData';
import { RideFormStateService } from '../../services/ride-form-state.service';
import { RIDE_BOOKING_SERVICE_TOKEN, RIDE_REPOSITORY_TOKEN } from '../../services/tokens/RepositoryTokens';
import { IRideBookingService } from '../../services/interfaces/IRideBookingService';
import { AuthService } from '../../../auth/services/auth.service';
import { MessageService } from '../../../../core/services/message.service';


@Component({
  selector: 'app-car-selection',
  standalone: false,
  templateUrl: './car-selection.component.html',
  styleUrl: './car-selection.component.css'
})
export class CarSelectionComponent implements OnInit, OnDestroy {

  errorMessage = signal<string>('');
  bookingRide: boolean = false;
  carsFairModels: CarFare[] | null = null;
  rideFormData!: RideFormData;

  // Property to store the locally selected car before confirmation
  selectedCar: CarFare | null = null;

  private bookingStateSubscription: Subscription;
  public currentDistance: number = 0;
  showTryAgainButton: boolean = false;

  // Interface for car metadata
  private carMetadata: { [key: string]: { description: string; category: string } } = {
    'MINI': {
      description: 'Budget-friendly & Quick',
      category: 'Economy'
    },
    'MICRO': {
      description: 'Budget-friendly & Quick',
      category: 'Economy'
    },
    'PRIME_SEDAN': {
      description: 'Comfortable Ride',
      category: 'Standard'
    },
    'PRIME_SUV': {
      description: 'Spacious & Premium',
      category: 'Premium'
    },
    'LUXURY': {
      description: 'Luxury Experience',
      category: 'Luxury'
    },
    'E_RICKSHAW': {
      description: 'Eco-Friendly Choice',
      category: 'Budget'
    },
    'AUTO': {
      description: 'Quick & Easy',
      category: 'Budget'
    },
    'BIKE': {
      description: 'Quick & Easy',
      category: 'Budget'
    },
    'XL': {
      description: 'Spacious & Premium',
      category: 'Premium'
    },
    'POOL': {
      description: 'Quick & Easy',
      category: 'Economy'
    },
    'SEDAN': {
      description: 'Comfortable Ride',
      category: 'Standard'
    },
    'SUV': {
      description: 'Spacious & Premium',
      category: 'Premium'
    }
  };

  // SVG icon paths mapping to assets folder
  private carIconPaths: { [key: string]: string } = {
    'MINI': 'icons/Mini.svg',
    'MICRO': 'icons/Micro.svg',
    'PRIME_SEDAN': 'icons/Prime Sedan.svg',
    'PRIME_SUV': 'icons/Prime SUV.svg',
    'LUXURY': 'icons/Luxury.svg',
    'E_RICKSHAW': 'icons/E-Rickshaw.svg',
    'AUTO': 'icons/Mini.svg', // Using Mini as fallback
    'BIKE': 'assets/icons/Mini.svg', // Using Mini as fallback
    'XL': 'assets/icons/Prime SUV.svg', // Using SUV as fallback
    'POOL': 'assets/icons/Mini.svg', // Using Mini as fallback
    'SEDAN': 'assets/icons/Mini.svg', // Using Mini as fallback
    'SUV': 'assets/icons/Prime SUV.svg'
  };

  constructor(
    @Inject(RIDE_REPOSITORY_TOKEN) private rideRepo: RideRepository,
    private snackBarService: MessageService,
    @Inject(RIDE_BOOKING_SERVICE_TOKEN)
    private rideBookingService: IRideBookingService,
    private rideFormStateService: RideFormStateService,
    private authService: AuthService
  ) {

    effect(() => {
      const error = this.errorMessage();
      if (error.length > 0) {
        snackBarService.sendMessage('error', error);
      }
    });
  }

  ngOnInit(): void {
    this.rideFormData = this.rideFormStateService.getCurrentFormData();
    this.currentDistance = this.rideFormStateService.getDistance()
    if(this.currentDistance > 0) {
      this.loadCarFares();
    }
  }

  loadCarFares() {
    this.showTryAgainButton = false;
    this.rideBookingService.loadCarFares().subscribe({
      next: (carFares: CarFare[]) => {
        this.carsFairModels = carFares;
      },
      error: (err) => {
        this.showTryAgainButton = true;
        console.log(err);
      }
    })
  }

  ngOnDestroy(): void {
    this.bookingStateSubscription?.unsubscribe();
  }

  trackByCarId(index: number, car: CarFare): string {
    return car.id;
  }

  /**
   * Get SVG icon path for car type
   */
  getCarIconPath(carType: string): string {
    const normalizedType = carType.toUpperCase().replace(/[\s-]/g, '_');
    return this.carIconPaths[normalizedType] || this.carIconPaths['MINI'];
  }

  /**
   * Get the description based on car type
   */
  getCarDescription(carType: string): string {
    const normalizedType = carType.toUpperCase().replace(/[\s-]/g, '_');
    const metadata = this.carMetadata[normalizedType];
    return metadata ? metadata.description : 'Comfortable & Reliable';
  }

  /**
   * Get the category badge based on car type
   */
  getCarCategory(carType: string): string {
    const normalizedType = carType.toUpperCase().replace(/[\s-]/g, '_');
    const metadata = this.carMetadata[normalizedType];
    return metadata ? metadata.category : 'Standard';
  }

  /**
   * Get color class for category badge
   */
  getCategoryColorClass(carType: string): string {
    const category = this.getCarCategory(carType);
    const colorMap: { [key: string]: string } = {
      'Economy': 'badge-economy',
      'Budget': 'badge-budget',
      'Standard': 'badge-standard',
      'Premium': 'badge-premium',
      'Luxury': 'badge-luxury'
    };
    return colorMap[category] || 'badge-standard';
  }

  onCardClick(carFare: CarFare) {
    // Toggle selection: if the same car is clicked, deselect it; otherwise, select the new one.
    this.selectedCar = (this.selectedCar?.id === carFare.id) ? null : carFare;
  }

  confirmCarSelection() {
    if (!this.selectedCar) {
      this.snackBarService.sendMessage('error', "Please select a car before confirming.");
      return;
    }

    const userId = this.authService.getUserId();
    const isOnline = InternetUtils.IsOnline();

    if (isOnline && userId) {
      this.bookingRide = true;
      try {
        this.rideFormStateService.setSelectedCarFare(this.selectedCar);
        this.bookingStateSubscription = this.rideBookingService.bookRide().subscribe({
          next: (isBooked) => {
            if (isBooked) {
              this.bookingStateSubscription.unsubscribe();
            }
          },
          error: (err) => {
            this.snackBarService.sendMessage('error', "Sorry! Try again to book.")
          }
        })
      }catch {

      }
      finally {
        this.bookingRide = false;
      }
    } else if (isOnline && !userId) {
      this.errorMessage.set("Login First!");
    } else {
      this.errorMessage.set("You are Offline");
    }
  }
}