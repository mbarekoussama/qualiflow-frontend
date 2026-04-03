import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ORGANIZATION_STATUS_OPTIONS,
  ORGANIZATION_TYPE_OPTIONS,
  OrganizationResponse
} from '../models/organization.models';
import { OrganizationService } from '../services/organization.service';

@Component({
  selector: 'app-super-admin-organization-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './organization-details.component.html',
  styleUrls: ['./organization-details.component.scss']
})
export class OrganizationDetailsComponent implements OnInit {
  readonly displayedAdminColumns: string[] = ['name', 'email', 'status', 'createdAt'];

  loading = false;
  organization: OrganizationResponse | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly organizationService: OrganizationService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId ? Number(rawId) : Number.NaN;

    if (Number.isNaN(id)) {
      this.notificationService.showError('Identifiant organisation invalide.');
      this.router.navigate(['/super-admin/organizations']);
      return;
    }

    this.loading = true;
    this.organizationService.getOrganizationById(id).subscribe({
      next: (response) => {
        this.organization = response;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Impossible de charger l organisation.');
        this.router.navigate(['/super-admin/organizations']);
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/super-admin/organizations']);
  }

  editOrganization(): void {
    if (!this.organization) {
      return;
    }

    this.router.navigate(['/super-admin/organizations', this.organization.id, 'edit']);
  }

  getTypeLabel(type: string | null | undefined): string {
    if (!type) {
      return 'N/A';
    }

    return ORGANIZATION_TYPE_OPTIONS.find(item => item.value === type)?.label ?? type;
  }

  getStatusLabel(status: string): string {
    return ORGANIZATION_STATUS_OPTIONS.find(item => item.value === status)?.label ?? status;
  }
}
