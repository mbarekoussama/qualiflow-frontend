import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserRole, UserService } from '../services/user.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './users-form.component.html',
  styleUrls: ['./users-form.component.scss']
})
export class UsersFormComponent implements OnInit {
  userForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  userId?: number;
  initialRole: UserRole = 'UTILISATEUR';
  initialIsActive = true;

  readonly roleOptions: Array<{ value: UserRole; label: string }> = [
    { value: 'ADMIN_ORG', label: 'Admin org' },
    { value: 'RESPONSABLE_QUALITE', label: 'Responsable qualite' },
    { value: 'CHEF_SERVICE', label: 'Chef service' },
    { value: 'AUDITEUR', label: 'Auditeur' },
    { value: 'UTILISATEUR', label: 'Utilisateur' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['UTILISATEUR', [Validators.required]],
      function: [''],
      department: [''],
      isActive: [true],
      password: ['', [Validators.minLength(6)]]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
      return;
    }

    this.isEditMode = true;
    this.userId = Number(id);
    this.loadUser(this.userId);
  }

  private loadUser(id: number): void {
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.initialRole = user.role as UserRole;
        this.initialIsActive = user.isActive;

        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          function: user.function || '',
          department: user.department || '',
          isActive: user.isActive
        });
      },
      error: () => {
        this.notificationService.showError('Utilisateur non trouve.');
        this.goBack();
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.userId) {
      this.submitEdit(this.userId);
      return;
    }

    this.submitCreate();
  }

  private submitCreate(): void {
    const formData = this.userForm.value;

    this.userService.createUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      function: formData.function,
      department: formData.department
    }).subscribe({
      next: (id) => {
        const afterCreate$: Observable<void> = formData.isActive
          ? of(void 0)
          : this.userService.toggleStatus(id, false);

        afterCreate$.subscribe({
          next: () => {
            this.notificationService.showSuccess('Utilisateur cree avec succes.');
            this.router.navigate(['/users']);
          },
          error: () => {
            this.isLoading = false;
            this.notificationService.showError('Erreur lors de la mise a jour du statut utilisateur.');
          },
          complete: () => {
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Erreur lors de la creation de l utilisateur.');
      }
    });
  }

  private submitEdit(id: number): void {
    const formData = this.userForm.value;

    const requests: Observable<unknown>[] = [
      this.userService.updateUser(id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        function: formData.function,
        department: formData.department
      })
    ];

    if (formData.role !== this.initialRole) {
      requests.push(this.userService.changeRole(id, { role: formData.role }));
    }

    if (formData.isActive !== this.initialIsActive) {
      requests.push(this.userService.toggleStatus(id, formData.isActive));
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.notificationService.showSuccess('Utilisateur modifie avec succes.');
        this.router.navigate(['/users']);
      },
      error: () => {
        this.notificationService.showError('Erreur lors de la mise a jour de l utilisateur.');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }
}
