import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationListItemResponse } from '../models/notification.models';
import { UserNotificationService } from '../services/user-notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  private readonly subscriptions = new Subscription();

  unreadCount = 0;
  loading = false;
  recentNotifications: NotificationListItemResponse[] = [];

  constructor(
    private readonly notificationService: UserNotificationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    this.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onMenuOpened(): void {
    this.refreshUnreadCount();
    this.loadRecentNotifications();
  }

  markAsRead(item: NotificationListItemResponse, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAsRead(item.id).subscribe({
      next: () => {
        item.isRead = true;
        this.refreshUnreadCount();
      }
    });
  }

  markAllAsRead(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.recentNotifications = this.recentNotifications.map(item => ({ ...item, isRead: true }));
        this.refreshUnreadCount();
      }
    });
  }

  openNotification(item: NotificationListItemResponse): void {
    const navigate = () => {
      if (!item.actionUrl) {
        this.router.navigate(['/notifications']);
        return;
      }

      const normalized = item.actionUrl.startsWith('/') ? item.actionUrl : `/${item.actionUrl}`;
      this.router.navigateByUrl(normalized);
    };

    if (item.isRead) {
      navigate();
      return;
    }

    this.notificationService.markAsRead(item.id).subscribe({
      next: () => {
        item.isRead = true;
        this.refreshUnreadCount();
        navigate();
      },
      error: () => navigate()
    });
  }

  openCenter(): void {
    this.router.navigate(['/notifications']);
  }

  getIcon(item: NotificationListItemResponse): string {
    if (item.category === 'ERROR') {
      return 'error';
    }

    if (item.category === 'WARNING') {
      return 'warning';
    }

    if (item.category === 'SUCCESS') {
      return 'check_circle';
    }

    return 'notifications';
  }

  trackById(_index: number, item: NotificationListItemResponse): number {
    return item.id;
  }

  private refreshUnreadCount(): void {
    this.notificationService.refreshUnreadCount().subscribe();
  }

  private loadRecentNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications({ pageNumber: 1, pageSize: 6 }).subscribe({
      next: response => {
        this.recentNotifications = response.items;
        this.loading = false;
      },
      error: () => {
        this.recentNotifications = [];
        this.loading = false;
      }
    });
  }
}
