import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest, RegisterResponse } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage: string | null = null;

  readonly nationalities = [
    { code: 'TN', label: 'Tunisie', flag: '🇹🇳' },
    { code: 'FR', label: 'France', flag: '🇫🇷' },
    { code: 'DZ', label: 'Algérie', flag: '🇩🇿' },
    { code: 'MA', label: 'Maroc', flag: '🇲🇦' },
    { code: 'LY', label: 'Libye', flag: '🇱🇾' },
    { code: 'MR', label: 'Mauritanie', flag: '🇲🇷' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(8)]],
      nationality: ['Tunisie', [Validators.required]],
      organizationCode: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      birthDate: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.passwordMismatch) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const payload: RegisterRequest = {
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      email: this.registerForm.value.email,
      phone: this.registerForm.value.phone,
      nationality: this.registerForm.value.nationality,
      organizationCode: this.registerForm.value.organizationCode,
      birthDate: this.registerForm.value.birthDate,
      password: this.registerForm.value.password,
      confirmPassword: this.registerForm.value.confirmPassword
    };

    this.authService.register(payload).subscribe({
      next: (_response: RegisterResponse) => {
        this.notificationService.showSuccess('Compte cree. Connectez-vous.');
        this.router.navigate(['/login'], {
          queryParams: { email: payload.email }
        });
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message || "Impossible de creer le compte.";
        this.errorMessage = message;
        this.notificationService.showError(message);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  get passwordMismatch(): boolean {
    const password = this.registerForm?.get('password')?.value;
    const confirmPassword = this.registerForm?.get('confirmPassword')?.value;
    return !!password && !!confirmPassword && password !== confirmPassword;
  }
}
