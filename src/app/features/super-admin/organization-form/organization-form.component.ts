import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CreateOrganizationRequest,
  ORGANIZATION_STATUS_OPTIONS,
  ORGANIZATION_TYPE_OPTIONS,
  OrganizationStatus,
  OrganizationType,
  UpdateOrganizationRequest
} from '../models/organization.models';
import { OrganizationService } from '../services/organization.service';

@Component({
  selector: 'app-super-admin-organization-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './organization-form.component.html',
  styleUrls: ['./organization-form.component.scss']
})
export class OrganizationFormComponent implements OnInit {
  readonly typeOptions = ORGANIZATION_TYPE_OPTIONS;
  readonly statusOptions = ORGANIZATION_STATUS_OPTIONS;

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    code: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    description: this.fb.control<string>(''),
    type: this.fb.nonNullable.control<OrganizationType>('INSTITUT', Validators.required),
    address: this.fb.control<string>(''),
    email: this.fb.control<string>('', Validators.email),
    phone: this.fb.control<string>(''),
    status: this.fb.nonNullable.control<OrganizationStatus>('ACTIF', Validators.required),
    createFirstAdmin: this.fb.nonNullable.control(false),
    firstAdminFirstName: this.fb.control<string>(''),
    firstAdminLastName: this.fb.control<string>(''),
    firstAdminEmail: this.fb.control<string>('', Validators.email),
    firstAdminTemporaryPassword: this.fb.control<string>('')
  });

  loading = false;
  saving = false;
  isEdit = false;
  organizationId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly organizationService: OrganizationService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const parsedId = rawId ? Number(rawId) : Number.NaN;

    this.isEdit = !Number.isNaN(parsedId);
    this.organizationId = this.isEdit ? parsedId : null;

    if (this.isEdit && this.organizationId) {
      this.loading = true;
      this.form.controls.code.disable();
      this.form.controls.createFirstAdmin.disable();
      this.organizationService.getOrganizationById(this.organizationId).subscribe({
        next: (organization) => {
          this.form.patchValue({
            name: organization.name,
            code: organization.code,
            description: organization.description ?? '',
            type: (organization.type as OrganizationType) ?? 'INSTITUT',
            address: organization.address ?? '',
            email: organization.email ?? '',
            phone: organization.phone ?? '',
            status: (organization.status as OrganizationStatus) ?? 'ACTIF',
            createFirstAdmin: false
          });
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.notificationService.showError('Impossible de charger l organisation.');
          this.router.navigate(['/super-admin/organizations']);
        }
      });
    }
  }

  get title(): string {
    return this.isEdit ? 'Modifier une organisation' : 'Creer une organisation';
  }

  get subtitle(): string {
    return this.isEdit
      ? 'Mettez a jour les informations de l institut.'
      : 'Ajoutez une nouvelle organisation a la plateforme.';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;

    if (this.isEdit && this.organizationId) {
      const updatePayload: UpdateOrganizationRequest = {
        name: payload.name,
        description: payload.description,
        type: payload.type,
        address: payload.address,
        email: payload.email,
        phone: payload.phone,
        status: payload.status
      };

      this.organizationService.updateOrganization(this.organizationId, updatePayload).subscribe({
        next: () => {
          this.saving = false;
          this.notificationService.showSuccess('Organisation modifiee avec succes.');
          this.router.navigate(['/super-admin/organizations', this.organizationId]);
        },
        error: () => {
          this.saving = false;
          this.notificationService.showError('Mise a jour impossible.');
        }
      });
      return;
    }

    this.organizationService.createOrganization(payload).subscribe({
      next: (id) => {
        this.saving = false;
        this.notificationService.showSuccess('Organisation creee avec succes.');
        this.router.navigate(['/super-admin/organizations', id]);
      },
      error: () => {
        this.saving = false;
        this.notificationService.showError('Creation impossible.');
      }
    });
  }

  goBack(): void {
    if (this.isEdit && this.organizationId) {
      this.router.navigate(['/super-admin/organizations', this.organizationId]);
      return;
    }

    this.router.navigate(['/super-admin/organizations']);
  }

  private buildPayload(): CreateOrganizationRequest {
    const raw = this.form.getRawValue();

    const payload: CreateOrganizationRequest = {
      name: raw.name.trim(),
      code: raw.code.trim().toUpperCase(),
      description: raw.description?.trim() || null,
      type: raw.type,
      address: raw.address?.trim() || null,
      email: raw.email?.trim() || null,
      phone: raw.phone?.trim() || null,
      status: raw.status,
      firstAdmin: null
    };

    if (!this.isEdit && raw.createFirstAdmin) {
      payload.firstAdmin = {
        firstName: (raw.firstAdminFirstName || '').trim(),
        lastName: (raw.firstAdminLastName || '').trim(),
        email: (raw.firstAdminEmail || '').trim(),
        temporaryPassword: raw.firstAdminTemporaryPassword || ''
      };
    }

    return payload;
  }
}
