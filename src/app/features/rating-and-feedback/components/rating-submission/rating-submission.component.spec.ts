import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RatingSubmissionComponent } from './rating-submission.component';
import { RatingService } from '../../services/rating.service';
import { AuthService } from '../../../auth/services/auth.service';
import { MessageService } from '../../../../core/services/message.service';
import { of, throwError } from 'rxjs';
import { RideReview } from '../../models/reviewsandrating';

describe('RatingSubmissionComponent', () => {
  let component: RatingSubmissionComponent;
  let fixture: ComponentFixture<RatingSubmissionComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<RatingSubmissionComponent>>;
  let mockRatingService: jasmine.SpyObj<RatingService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let rideId = 'ride-123', driverId = 'driver-456';

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockRatingService = jasmine.createSpyObj('RatingService', ['submitReview']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);
    mockMessageService = jasmine.createSpyObj('MessageService', ['sendMessage']);

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [RatingSubmissionComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { rideId, driverId } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: RatingService, useValue: mockRatingService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingSubmissionComponent);
    component = fixture.componentInstance;
    mockAuthService.getUserId.and.returnValue('user-999');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header', () => {
    const header = fixture.nativeElement.querySelector('h4');
    expect(header.textContent).toContain('Rate Your Ride');
  });

  it('should display error when rating is invalid on submit', () => {
    component.rating = 0;
    component.submitFeedback();
    expect(component.errorMessage).toBe('Please select a rating between 1 and 5 stars.');
    expect(component.isSubmitting).toBe(false);
  });

  it('should call submitReview with correct payload', fakeAsync(() => {
    component.rating = 5;
    component.comments = 'Great ride!';
    const response: RideReview = {
      rideId, driverId, userId: 'user-999', rating: 5, comments: 'Great ride!'
    };
    mockRatingService.submitReview.and.returnValue(of(response));

    component.submitFeedback();
    tick();

    expect(component.isSubmitting).toBe(false);
    expect(mockRatingService.submitReview).toHaveBeenCalledWith(response);
    expect(mockDialogRef.close).toHaveBeenCalledWith(response);
    expect(mockMessageService.sendMessage)
      .toHaveBeenCalledWith('success', 'Rating submitted Successfully!');
    // Don't check for window.location.reload. It's not testable in browser.
  }));

  it('should set errorMessage on failed submission', fakeAsync(() => {
    component.rating = 4;
    component.comments = 'Nice';
    mockRatingService.submitReview.and.returnValue(
      throwError({ error: { message: 'Server error' }, statusText: 'Bad Request' })
    );

    component.submitFeedback();
    tick();

    expect(component.errorMessage).toContain('Submission failed. Please try again.');
    expect(component.isSubmitting).toBe(false);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  }));

  it('should close dialog when closeLogin is called', () => {
    component.closeLogin();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

});