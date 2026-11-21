import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  constructor(private snackBar: MatSnackBar) { }

  /**
   * Shows a global snackbar message.
   * If a snackbar is already open, it will be dismissed and the new one will appear.
   * @param message The message to show.
   * @param action The action label (e.g., 'Close', 'Undo'). Optional.
   * @param duration The duration in milliseconds. Defaults to 3000ms.
   * @param panelClass Custom CSS class for styling. Optional.
   */
  show(
    message: string, 
    action: string = 'Close', 
    duration: number = 3000, 
    panelClass: string[] = []
  ): void {
    const config: MatSnackBarConfig = {
      duration: duration,
      panelClass: panelClass,
      // Set the position here
      verticalPosition: 'top',
      horizontalPosition: 'end'
    };

    // The MatSnackBar service automatically handles the override.
    // If a new snackbar is opened while another is visible,
    // the old one is automatically dismissed.
    this.snackBar.open(message, action, config);
  }

  /**
   * Helper method for success messages.
   * @param message The success message.
   */
  showSuccess(message: string): void {
    this.show(message, 'Close', 3000, ['snackbar-success']);
  }

  /**
   * Helper method for error messages.
   * @param message The error message.
   */
  showError(message: string): void {
    this.show(message, 'Close', 5000, ['snackbar-error']);
  }

  /**
   * Helper method for warning messages.
   * @param message The warning message.
   */
  showWarning(message: string): void {
    this.show(message, 'Close', 5000, ['snackbar-warning']);
  }
}