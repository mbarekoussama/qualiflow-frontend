import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  IndicatorChartResponse,
  IndicatorDetailsResponse,
  IndicatorStatus,
  INDICATOR_FREQUENCY_OPTIONS,
  INDICATOR_STATUS_OPTIONS
} from '../models/indicator.models';
import { IndicatorService } from '../services/indicator.service';
import { IndicatorValuesComponent } from '../indicator-values/indicator-values.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type IndicatorTab = 'overview' | 'chart' | 'values';

@Component({
  selector: 'app-indicator-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    IndicatorValuesComponent,
    TranslatePipe
  ],
  templateUrl: './indicator-details.component.html',
  styleUrls: ['./indicator-details.component.scss']
})
export class IndicatorDetailsComponent implements OnInit {
  readonly statusOptions = INDICATOR_STATUS_OPTIONS;
  readonly frequencyOptions = INDICATOR_FREQUENCY_OPTIONS;

  loading = false;
  indicatorId!: number;
  details: IndicatorDetailsResponse | null = null;
  chart: IndicatorChartResponse | null = null;
  activeTab: IndicatorTab = 'overview';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly indicatorService: IndicatorService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = idParam ? Number(idParam) : Number.NaN;

    if (Number.isNaN(parsedId)) {
      this.notificationService.showError('Identifiant indicateur invalide.');
      this.router.navigate(['/indicators']);
      return;
    }

    this.indicatorId = parsedId;
    const tabParam = (this.route.snapshot.queryParamMap.get('tab') || '').toLowerCase();
    if (tabParam === 'chart' || tabParam === 'values') {
      this.activeTab = tabParam;
    }

    this.loadData();
  }

  get canWrite(): boolean {
    return this.authService.hasRole(['ADMIN_ORG', 'RESPONSABLE_QUALITE']);
  }

  get statusLabel(): string {
    if (!this.details) {
      return '';
    }

    return this.statusOptions.find(option => option.value === this.details!.indicator.status)?.label ?? this.details.indicator.status;
  }

  get frequencyLabel(): string {
    if (!this.details) {
      return '';
    }

    return this.frequencyOptions.find(option => option.value === this.details!.indicator.measurementFrequency)?.label
      ?? this.details.indicator.measurementFrequency;
  }

  get chartPoints(): string {
    if (!this.chart || this.chart.values.length === 0) {
      return '';
    }

    const values = this.chart.values;
    const maxValue = Math.max(...values, this.chart.targetValue, this.chart.thresholdValue, 1);
    const minValue = Math.min(...values, this.chart.targetValue, this.chart.thresholdValue, 0);
    const range = Math.max(1, maxValue - minValue);
    const width = 100;
    const height = 34;

    return values.map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const normalized = (value - minValue) / range;
      const y = height - (normalized * height);
      return `${x},${y}`;
    }).join(' ');
  }

  get targetY(): number {
    return this.computeReferenceY(this.chart?.targetValue);
  }

  get thresholdY(): number {
    return this.computeReferenceY(this.chart?.thresholdValue);
  }

  goBack(): void {
    this.router.navigate(['/indicators']);
  }

  edit(): void {
    this.router.navigate(['/indicators', this.indicatorId, 'edit']);
  }

  delete(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer indicateur',
        message: 'Confirmer la suppression de cet indicateur ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.indicatorService.deleteIndicator(this.indicatorId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Indicateur supprime.');
          this.router.navigate(['/indicators']);
        },
        error: () => this.notificationService.showError('Suppression impossible.')
      });
    });
  }

  toggleStatus(): void {
    this.indicatorService.toggleIndicatorStatus(this.indicatorId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Statut indicateur mis a jour.');
        this.loadData();
      },
      error: () => this.notificationService.showError('Mise a jour du statut impossible.')
    });
  }

  selectTab(tab: IndicatorTab): void {
    this.activeTab = tab;
  }

  onValuesChanged(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;

    forkJoin({
      details: this.indicatorService.getIndicatorById(this.indicatorId),
      chart: this.indicatorService.getIndicatorChart(this.indicatorId)
    }).subscribe({
      next: ({ details, chart }) => {
        this.details = details;
        this.chart = chart;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Impossible de charger cet indicateur.');
        this.router.navigate(['/indicators']);
      }
    });
  }

  private computeReferenceY(referenceValue?: number | null): number {
    if (!this.chart || this.chart.values.length === 0 || referenceValue === null || referenceValue === undefined) {
      return 34;
    }

    const values = this.chart.values;
    const maxValue = Math.max(...values, this.chart.targetValue, this.chart.thresholdValue, 1);
    const minValue = Math.min(...values, this.chart.targetValue, this.chart.thresholdValue, 0);
    const range = Math.max(1, maxValue - minValue);
    const normalized = (referenceValue - minValue) / range;
    return 34 - (normalized * 34);
  }

  getStatusLabel(status: IndicatorStatus): string {
    return this.statusOptions.find(option => option.value === status)?.label ?? status;
  }
}
