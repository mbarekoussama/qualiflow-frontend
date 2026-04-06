import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    constructor(private snackBar: MatSnackBar) { }

    showSuccess(message: string): void {
        this.snackBar.open(message, 'OK', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
        });
    }

    showError(message: string): void {
        this.snackBar.open(message, 'OK', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
        });
    }

    showInfo(message: string): void {
        this.snackBar.open(message, 'OK', {
            duration: 3000,
            panelClass: ['info-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
        });
    }

    showWarning(message: string): void {
        this.snackBar.open(message, 'OK', {
            duration: 4000,
            panelClass: ['warning-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
        });
    }
}
