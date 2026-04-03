import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService } from '../../../core/services/notification.service';
import {
  NOTIFICATION_CATEGORY_OPTIONS,
  NOTIFICATION_PRIORITY_OPTIONS,
  NotificationListItemResponse,
  NotificationQueryParams,
  NotificationStatisticsResponse
} from '../models/notification.models';
import { NotificationListComponent } from '../notification-list/notification-list.component';
import { UserNotificationService } from '../services/user-notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    NotificationListComponent
  ],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss']
})
export class NotificationCenterComponent implements OnInit {
  readonly categoryOptions = NOTIFICATION_CATEGORY_OPTIONS;
  readonly priorityOptions = NOTIFICATION_PRIORITY_OPTIONS;

  readonly filtersForm = this.fb.group({
    search: [''],
    isRead: ['' as '' | 'true' | 'false'],
    category: ['' as string],
    priority: ['' as string]
  });

  notifications: NotificationListItemResponse[] = [];
  statistics: NotificationStatisticsResponse | null = null;
  loading = false;

  total = 0;
  pageNumber = 1;
  pageSize = 10;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userNotificationService: UserNotificationService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  onFilter(): void {
    this.pageNumber = 1;
    this.loadData();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      isRead: '',
      category: '',
      priority: ''
    });
    this.pageNumber = 1;
    this.loadData();
  }

  markAllAsRead(): void {
    this.userNotificationService.markAllAsRead().subscribe({
      next: () => {
        this.notificationService.showSuccess('Toutes les notifications ont ete marquees comme lues.');
        this.loadData();
      },
      error: () => this.notificationService.showError('Impossible de marquer toutes les notifications comme lues.')
    });
  }

  onMarkRead(notificationId: number): void {
    this.userNotificationService.markAsRead(notificationId).subscribe({
      next: () => this.loadData(),
      error: () => this.notificationService.showError('Impossible de marquer la notification comme lue.')
    });
  }

  onArchive(notificationId: number): void {
    this.userNotificationService.archiveNotification(notificationId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Notification archivee.');
        this.loadData();
      },
      error: () => this.notificationService.showError('Impossible d\'archiver la notification.')
    });
  }

  onOpen(item: NotificationListItemResponse): void {
    const navigate = () => {
      if (!item.actionUrl) {
        return;
      }

      const normalizedUrl = item.actionUrl.startsWith('/') ? item.actionUrl : `/${item.actionUrl}`;
      this.router.navigateByUrl(normalizedUrl);
    };

    if (item.isRead) {
      navigate();
      return;
    }

    this.userNotificationService.markAsRead(item.id).subscribe({
      next: () => {
        navigate();
        this.loadData();
      },
      error: () => {
        navigate();
      }
    });
  }

  onPageChanged(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;

    forkJoin({
      page: this.userNotificationService.getNotifications(this.buildQueryParams()),
      stats: this.userNotificationService.getStatistics(),
      _unread: this.userNotificationService.refreshUnreadCount()
    }).subscribe({
      next: ({ page, stats }) => {
        this.notifications = page.items;
        this.total = page.total;
        this.pageNumber = page.pageNumber;
        this.pageSize = page.pageSize;
        this.statistics = stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Erreur lors du chargement des notifications.');
      }
    });
  }

  private buildQueryParams(): NotificationQueryParams {
    const raw = this.filtersForm.getRawValue();

    let isRead: boolean | undefined;
    if (raw.isRead === 'true') {
      isRead = true;
    } else if (raw.isRead === 'false') {
      isRead = false;
    } else {
      isRead = undefined;
    }

    return {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: raw.search?.trim() || undefined,
      isRead,
      category: (raw.category as any) || undefined,
      priority: (raw.priority as any) || undefined
    };
  }
}
