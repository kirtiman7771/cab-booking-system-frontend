import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RideReview } from '../../models/reviewsandrating';
import { RatingService } from '../../services/rating.service';
import { AuthService } from '../../../auth/services/auth.service';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-rating-submission',
  standalone: false,
  templateUrl: './rating-submission.component.html',
  styleUrls: ['./rating-submission.component.css'],
})

export class RatingSubmissionComponent  {
  rating: number = 0; // Must be between 1 and 5
  comments: string = '';

  // UI state
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  
  // Note: Assuming AuthService has a method getUserId() that returns a string (UUID)
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { rideId: string, driverId: string },
    private dialogRef: MatDialogRef<RatingSubmissionComponent>,
    private apiService: RatingService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  submitFeedback(): void {
    // Basic Client-Side Validation
    if (this.rating < 1 || this.rating > 5) {
      this.errorMessage = 'Please select a rating between 1 and 5 stars.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Use the actual bound values (this.rating and this.comments)
    const reviewPayload: RideReview = {
      rideId: this.data.rideId,
      driverId: this.data.driverId,
      // Ensure the userId is correctly retrieved as a string (UUID)
      userId: String(this.authService.getUserId()),
      rating: this.rating,
      comments: this.comments,
    };

    this.apiService.submitReview(reviewPayload).subscribe({
      next: (response: RideReview) => {
        console.log('Review submitted successfully:', response);
        this.isSubmitting = false;
        // Close the dialog upon successful submission
        this.dialogRef.close(response); 
        this.messageService.sendMessage('success', 'Rating submitted Successfully!');  
        window.location.reload();
      },
      error: (err) => {
        console.error('Failed to submit review:', err);
        // Display a user-friendly error message instead of an alert
        this.errorMessage = 'Submission failed. Please try again. (Details: ' + (err.error?.message || err.statusText) + ')';
        this.isSubmitting = false;
      },
    });
  }

  closeLogin(): void {
    // Close the dialog without submitting data
    this.dialogRef.close();
  }
}