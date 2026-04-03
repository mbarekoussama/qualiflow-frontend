import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DashboardAlertResponse,
  DashboardKpiResponse,
  DashboardChartDataPointResponse,
  DashboardMonthlyTrendPointResponse,
  SuperAdminDashboardResponse,
  TopOrganizationResponse
} from '../models/dashboard.models';
import {
  ORGANIZATION_STATUS_OPTIONS,
  ORGANIZATION_TYPE_OPTIONS,
  OrganizationListItemResponse
} from '../models/organization.models';
import { DashboardService } from '../services/dashboard.service';
import { OrganizationService } from '../services/organization.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.scss']
})
export class SuperAdminDashboardComponent implements OnInit {
  readonly now = new Date();

  readonly chartColorPalette = ['#0f7a3f', '#0369a1', '#7c3aed', '#b45309', '#be123c', '#334155'];

  readonly periods = [
    { value: '1M', label: '1 mois' },
    { value: '3M', label: '3 mois' },
    { value: '6M', label: '6 mois' },
    { value: '12M', label: '12 mois' }
  ];

  readonly statusOptions = ORGANIZATION_STATUS_OPTIONS;
  readonly typeOptions = ORGANIZATION_TYPE_OPTIONS;

  readonly filterForm = this.fb.group({
    period: ['12M'],
    organizationId: [null as number | null],
    status: [''],
    type: ['']
  });

  loading = false;
  dashboard: SuperAdminDashboardResponse | null = null;
  organizations: OrganizationListItemResponse[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly dashboardService: DashboardService,
    private readonly organizationService: OrganizationService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
    this.loadDashboard();
  }

  refresh(): void {
    this.loadDashboard();
  }

  applyFilters(): void {
    this.loadDashboard();
  }

  resetFilters(): void {
    this.filterForm.reset({ period: '12M', organizationId: null, status: '', type: '' });
    this.loadDashboard();
  }

  goToCreateOrganization(): void {
    this.router.navigate(['/super-admin/organizations/create']);
  }

  goToOrganizations(): void {
    this.router.navigate(['/super-admin/organizations']);
  }

  goToSuspendedOrganizations(): void {
    this.router.navigate(['/super-admin/organizations'], {
      queryParams: { status: 'SUSPENDUE' }
    });
  }

  getMaxValue(values: number[]): number {
    if (!values.length) {
      return 1;
    }

    const max = Math.max(...values);
    return max <= 0 ? 1 : max;
  }

  getDataPointMax(points: DashboardChartDataPointResponse[] | undefined): number {
    return this.getMaxValue((points ?? []).map(point => point.value));
  }

  getAlertClass(alert: DashboardAlertResponse): string {
    const severity = (alert.severity || '').toUpperCase();
    if (severity === 'HIGH') {
      return 'alert-high';
    }

    if (severity === 'MEDIUM') {
      return 'alert-medium';
    }

    if (severity === 'LOW') {
      return 'alert-low';
    }

    return 'alert-info';
  }

  private loadOrganizations(): void {
    this.organizationService.getOrganizations({ pageNumber: 1, pageSize: 200, sortBy: 'Name', sortDirection: 'ASC' }).subscribe({
      next: (response) => {
        this.organizations = response.items;
      },
      error: () => {
        this.notificationService.showError('Impossible de charger les organisations pour les filtres.');
      }
    });
  }

  private loadDashboard(): void {
    this.loading = true;
    const raw = this.filterForm.getRawValue();

    this.dashboardService.getSuperAdminDashboard({
      period: raw.period || '12M',
      organizationId: raw.organizationId,
      status: raw.status || null,
      type: raw.type || null
    }).subscribe({
      next: (response) => {
        this.dashboard = response;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Chargement du dashboard super admin impossible.');
      }
    });
  }

  asDataPoints(values: DashboardChartDataPointResponse[] | undefined): DashboardChartDataPointResponse[] {
    return values ?? [];
  }

  asTrendPoints(values: DashboardMonthlyTrendPointResponse[] | undefined): DashboardMonthlyTrendPointResponse[] {
    return values ?? [];
  }

  asTopOrganizations(values: TopOrganizationResponse[] | undefined): TopOrganizationResponse[] {
    return values ?? [];
  }

  getKpiCards(kpis: DashboardKpiResponse): Array<{ title: string; value: number; icon: string; tone: string; hint: string }> {
    return [
      {
        title: 'Organisations',
        value: kpis.totalOrganizations,
        icon: 'business',
        tone: 'tone-info',
        hint: 'Total plateformes actives et suspendues'
      },
      {
        title: 'Organisations actives',
        value: kpis.activeOrganizations,
        icon: 'check_circle',
        tone: 'tone-success',
        hint: 'Actuellement operationnelles'
      },
      {
        title: 'Organisations suspendues',
        value: kpis.suspendedOrganizations,
        icon: 'block',
        tone: 'tone-danger',
        hint: 'A verifier prioritairement'
      },
      {
        title: 'Utilisateurs',
        value: kpis.totalUsers,
        icon: 'groups',
        tone: 'tone-info',
        hint: 'Comptes utilisateurs globaux'
      },
      {
        title: 'Admins organisation',
        value: kpis.totalOrganizationAdmins,
        icon: 'admin_panel_settings',
        tone: 'tone-accent',
        hint: 'Admins locaux actifs'
      },
      {
        title: 'Processus',
        value: kpis.totalProcesses,
        icon: 'account_tree',
        tone: 'tone-info',
        hint: 'Volume total des processus'
      },
      {
        title: 'Documents',
        value: kpis.totalDocuments,
        icon: 'description',
        tone: 'tone-info',
        hint: 'Base documentaire globale'
      },
      {
        title: 'NC ouvertes',
        value: kpis.openNonConformities,
        icon: 'report_problem',
        tone: 'tone-warning',
        hint: 'Non-conformites non cloturees'
      },
      {
        title: 'Actions en retard',
        value: kpis.overdueCorrectiveActions,
        icon: 'event_busy',
        tone: 'tone-danger',
        hint: 'Actions correctives en depassement'
      },
      {
        title: 'Indicateurs en alerte',
        value: kpis.alertIndicators,
        icon: 'monitor_heart',
        tone: 'tone-warning',
        hint: 'KPI sous seuil'
      }
    ];
  }

  getProgressWidth(value: number, max: number): number {
    if (max <= 0) {
      return 0;
    }

    return Math.max(4, (value / max) * 100);
  }

  getTrendPointHeight(value: number, points: DashboardMonthlyTrendPointResponse[] | undefined): number {
    const max = this.getTrendMax(points);
    return this.getProgressWidth(value, max);
  }

  getTrendMax(points: DashboardMonthlyTrendPointResponse[] | undefined): number {
    return this.getMaxValue((points ?? []).map(point => point.value));
  }

  getSeverityIcon(alert: DashboardAlertResponse): string {
    const severity = (alert.severity || '').toUpperCase();
    if (severity === 'HIGH') {
      return 'error';
    }

    if (severity === 'MEDIUM') {
      return 'warning';
    }

    if (severity === 'LOW') {
      return 'info';
    }

    return 'notifications_active';
  }

  getSeverityLabel(alert: DashboardAlertResponse): string {
    const severity = (alert.severity || '').toUpperCase();
    if (severity === 'HIGH') {
      return 'Haute';
    }

    if (severity === 'MEDIUM') {
      return 'Moyenne';
    }

    if (severity === 'LOW') {
      return 'Basse';
    }

    return 'Info';
  }

  trackByLabel(_index: number, item: DashboardChartDataPointResponse): string {
    return item.label;
  }

  trackByPeriod(_index: number, item: DashboardMonthlyTrendPointResponse): string {
    return item.period;
  }

  trackByOrganization(_index: number, item: TopOrganizationResponse): number {
    return item.organizationId;
  }
}
