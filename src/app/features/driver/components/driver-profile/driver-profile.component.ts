import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { DriverAllDetails } from '../../models/driverAllDetails';
import { DriverService } from '../../services/driver.service';
import { MessageService } from '../../../../core/services/message.service';
import { DriverUpdatePayload } from '../../models/driverUpdateDetails';

@Component({
  selector: 'app-driver-profile',
  standalone: false,
  templateUrl: './driver-profile.component.html',
  styleUrls: ['./driver-profile.component.css']
})
export class DriverProfileComponent implements OnInit {
  driverForm!: FormGroup;
  driverId: string = '';
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  originalDriverData!: DriverAllDetails;
  driverData! : DriverAllDetails;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private driverService: DriverService,
    private messageService : MessageService
  ) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      const authUser = JSON.parse(savedUser);
      this.driverId = authUser.userId;
    }

    this.initializeForm();
    if (this.driverId) {
      this.fetchDriverDetails();
    }
  }

  initializeForm(): void {
    this.driverForm = this.fb.group({
      personalDetails: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]], // Email is read-only
        phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        dateOfBirth: ['', Validators.required]
      }),
      driverDetails: this.fb.group({
        licenseNumber: ['', Validators.required],
        licenseExpiry: ['', Validators.required],
        experience: ['', [Validators.required, Validators.pattern(/^[0-9]*$/)]],
        emergencyName: [''],
        emergencyPhone: ['', [Validators.pattern(/^\d{10}$/)]],
        emergencyRelation: ['']
      }),
      vehicleDetails: this.fb.group({
        vehicleNumber: ['', Validators.required],
        vehicleMake: ['', Validators.required],
        vehicleModel: ['', Validators.required],
        vehicleYear: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
        vehicleColor: ['']
      }),
      bankingDetails: this.fb.group({
        bankAccount: ['', [Validators.required, Validators.pattern(/^[0-9]*$/)]],
        routingNumber: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]]
      })
    });
  }

  fetchDriverDetails(): void {
    this.isLoading = true;
    this.driverService.getDriverProfileById(this.driverId).subscribe({
      next: (data) => {
        // const driverData: DriverAllDetails = data[0];
        // if (driverData) {
        //   this.originalDriverData = driverData; 
        //   this.driverForm.patchValue(driverData);
        //   this.isLoading = false;
        // } else {
        //   console.error('Driver data not found.');
        //   this.isLoading = false;
        // }
        this.driverData = data;
        console.log("Driver data " , this.driverData);
      },
      error: (err) => {
        console.error('Failed to fetch driver data', err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.driverForm.valid) {
      this.isSubmitting = true;

      // 1. Get the raw value of the nested form
      const formValue = this.driverForm.getRawValue();

      // 2. Flatten the nested form data into the DriverUpdatePayload structure
      const updatedData: DriverUpdatePayload = {
        ...formValue.personalDetails,
        ...formValue.driverDetails,
        ...formValue.vehicleDetails,
        ...formValue.bankingDetails,
        // NOTE: The 'email' field is disabled in your form,
        // so it might not be included in getRawValue() depending on Angular version/settings.
        // It's also NOT in your DriverUpdatePayload, so we exclude it here.
        // If it was needed, you'd merge it manually or check if getRawValue() includes disabled fields.

        // You also need to manually include 'status' if it's not in the form but required by the payload.
        // Assuming 'status' is a field that is managed elsewhere or is the current status:
        status: this.driverData ? this.driverData.status : 'active' // Example status assignment
      } as DriverUpdatePayload;

      // You might need to adjust 'experience' and 'vehicleYear' if they are numbers in the payload
      // but were strings from the form input, ensure correct type conversion.
      updatedData.experience = Number(updatedData.experience);
      updatedData.vehicleYear = Number(updatedData.vehicleYear);

      this.driverService.updateDriverProfile(this.driverId, updatedData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.messageService.sendMessage('success', 'Profile updated successfully!');
          this.originalDriverData = response;
        },
        error: (err) => {
          this.isSubmitting = false;
          this.messageService.sendMessage('error', 'Failed to update profile. Please try again later.');
        }
      });
    } else {
      this.driverForm.markAllAsTouched();
      this.messageService.sendMessage('error', 'Please correct the errors in the form before submitting.');
    }
  }

  onCancel(): void {
    if (this.originalDriverData) {
      this.driverForm.patchValue(this.originalDriverData);
      this.driverForm.markAsPristine();
      this.driverForm.markAsUntouched();
    }
  }
}