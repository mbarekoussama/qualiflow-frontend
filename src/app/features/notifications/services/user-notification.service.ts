import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  NotificationQueryParams,
  NotificationResponse,
  NotificationStatisticsResponse,
  PagedNotificationResponse,
  UnreadCountResponse
} from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class UserNotificationService {
  private readonly endpoint = 'notifications';
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);

  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getNotifications(params: NotificationQueryParams = {}): Observable<PagedNotificationResponse> {
    return this.apiService.get<PagedNotificationResponse>(this.endpoint, params);
  }

  getNotificationById(id: number): Observable<NotificationResponse> {
    return this.apiService.get<NotificationResponse>(`${this.endpoint}/${id}`);
  }

  getUnreadCount(): Observable<number> {
    return this.apiService
      .get<UnreadCountResponse>(`${this.endpoint}/unread-count`)
      .pipe(map(response => response.unreadCount));
  }

  refreshUnreadCount(): Observable<number> {
    return this.getUnreadCount().pipe(
      tap(unreadCount => this.unreadCountSubject.next(unreadCount))
    );
  }

  getStatistics(): Observable<NotificationStatisticsResponse> {
    return this.apiService.get<NotificationStatisticsResponse>(`${this.endpoint}/statistics`);
  }

  markAsRead(id: number): Observable<NotificationResponse> {
    return this.apiService.patch<NotificationResponse>(`${this.endpoint}/${id}/mark-read`, {}).pipe(
      tap(() => this.refreshUnreadCount().subscribe())
    );
  }

  markAllAsRead(): Observable<{ updatedCount: number }> {
    return this.apiService.patch<{ updatedCount: number }>(`${this.endpoint}/mark-all-read`, {}).pipe(
      tap(() => this.refreshUnreadCount().subscribe())
    );
  }

  archiveNotification(id: number): Observable<NotificationResponse> {
    return this.apiService.patch<NotificationResponse>(`${this.endpoint}/${id}/archive`, {}).pipe(
      tap(() => this.refreshUnreadCount().subscribe())
    );
  }

  deleteNotification(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => this.refreshUnreadCount().subscribe())
    );
  }
}
