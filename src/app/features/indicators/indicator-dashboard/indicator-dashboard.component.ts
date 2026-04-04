import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, of } from 'rxjs';
import {
  IndicatorAlertResponse,
  IndicatorChartResponse,
  IndicatorListItemResponse,
  IndicatorStatisticsResponse
} from '../models/indicator.models';
import { IndicatorService } from '../services/indicator.service';

interface IndicatorTrendViewModel {
  indicator: IndicatorListItemResponse;
  chart: IndicatorChartResponse;
}

@Component({
  selector: 'app-indicator-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './indicator-dashboard.component.html',
  styleUrls: ['./indicator-dashboard.component.scss']
})
export class IndicatorDashboardComponent implements OnInit {
  loading = false;
  statistics: IndicatorStatisticsResponse | null = null;
  alerts: IndicatorAlertResponse[] = [];
  trends: IndicatorTrendViewModel[] = [];

  constructor(
    private readonly router: Router,
    private readonly indicatorService: IndicatorService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  goToList(): void {
    this.router.navigate(['/indicators']);
  }

  openIndicator(indicatorId: number): void {
    this.router.navigate(['/indicators', indicatorId]);
  }

  getTrendPoints(values: number[]): string {
    if (values.length === 0) {
      return '';
    }

    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
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

  private loadDashboard(): void {
    this.loading = true;

    forkJoin({
      stats: this.indicatorService.getIndicatorStatistics().pipe(catchError(() => of(null))),
      alerts: this.indicatorService.getIndicatorAlerts().pipe(catchError(() => of([] as IndicatorAlertResponse[]))),
      inAlertPage: this.indicatorService
        .getIndicators({ pageNumber: 1, pageSize: 8, isInAlert: true })
        .pipe(catchError(() => of({ total: 0, pageNumber: 1, pageSize: 8, items: [] as IndicatorListItemResponse[] }))),
      recentPage: this.indicatorService
        .getIndicators({ pageNumber: 1, pageSize: 8 })
        .pipe(catchError(() => of({ total: 0, pageNumber: 1, pageSize: 8, items: [] as IndicatorListItemResponse[] })))
    }).subscribe({
      next: ({ stats, alerts, inAlertPage, recentPage }) => {
        this.statistics = stats;
        this.alerts = alerts;

        const selected = [...inAlertPage.items];
        for (const indicator of recentPage.items) {
          if (selected.length >= 3) {
            break;
          }

          if (!selected.some(item => item.id === indicator.id)) {
            selected.push(indicator);
          }
        }

        if (selected.length === 0) {
          this.trends = [];
          this.loading = false;
          return;
        }

        forkJoin(
          selected.map(indicator =>
            this.indicatorService.getIndicatorChart(indicator.id).pipe(
              catchError(() =>
                of({
                  labels: [],
                  values: [],
                  targetValue: indicator.targetValue,
                  thresholdValue: indicator.alertThreshold
                } as IndicatorChartResponse)
              )
            )
          )
        ).subscribe({
          next: charts => {
            this.trends = selected.map((indicator, index) => ({
              indicator,
              chart: charts[index]
            }));
            this.loading = false;
          },
          error: () => {
            this.trends = [];
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
