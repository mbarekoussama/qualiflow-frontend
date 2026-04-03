import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, LoginResponse, MeResponse } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface DemoAccount {
  label: string;
  role: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  isLoading = false;

  readonly demoAccounts: DemoAccount[] = [
    {
      label: 'Super Admin',
      role: 'SUPER_ADMIN',
      email: 'superadmin@demo.local',
      password: 'SuperAdmin@123'
    },
    {
      label: 'Super Admin 2',
      role: 'Fsm admin ',
      email: 'admin@test.com',
      password: 'admin@123'
    },
    {
      label: 'Admin Organisation',
      role: 'ADMIN_ORG',
      email: 'admin@demo.local',
      password: 'Admin@123'
    },
    {
      label: 'Responsable Qualite',
      role: 'RESPONSABLE_QUALITE',
      email: 'qualite@demo.local',
      password: 'Qualite@123'
    },
    {
      label: 'Chef Service',
      role: 'CHEF_SERVICE',
      email: 'chef@demo.local',
      password: 'Chef@123'
    },
    {
      label: 'Utilisateur',
      role: 'UTILISATEUR',
      email: 'user@demo.local',
      password: 'User@123'
    },
    {
      label: 'Auditeur',
      role: 'AUDITEUR',
      email: 'auditeur@demo.local',
      password: 'Auditeur@123'
    }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: [this.demoAccounts[0].email, [Validators.required, Validators.email]],
      password: [this.demoAccounts[0].password, [Validators.required]]
    });

    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.loginForm.patchValue({
        email: emailFromQuery,
        password: ''
      });
    }
  }

  useDemoAccount(account: DemoAccount): void {
    this.loginForm.patchValue({
      email: account.email,
      password: account.password
    });

    this.hidePassword = true;
    this.loginForm.markAsDirty();
    this.loginForm.markAsTouched();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: LoginResponse) => {
        this.authService.getProfile().subscribe({
          next: (profile: MeResponse) => {
            this.notificationService.showSuccess('Connexion reussie !');
            this.navigateAfterLogin(profile.role);
          },
          error: (_profileError: HttpErrorResponse) => {
            this.notificationService.showWarning('Profil non charge. Redirection par role du token.');
            this.navigateAfterLogin(response.role);
          }
        });
      },
      error: (_error: HttpErrorResponse) => {
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private navigateAfterLogin(role: string): void {
    if (role === 'SUPER_ADMIN') {
      this.router.navigate(['/super-admin/dashboard']);
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}
