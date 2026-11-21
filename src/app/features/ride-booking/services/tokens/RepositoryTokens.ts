import { InjectionToken } from '@angular/core';
import { IRideBookingService } from '../interfaces/IRideBookingService';
import { RideRepository } from '../interfaces/RideRepository';

export const RIDE_BOOKING_SERVICE_TOKEN = new InjectionToken<IRideBookingService>('RIDE_BOOKING_SERVICE_TOKEN');
export const RIDE_REPOSITORY_TOKEN = new InjectionToken<RideRepository>('RideRepository');