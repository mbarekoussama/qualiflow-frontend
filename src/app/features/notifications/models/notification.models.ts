export type NotificationCategory = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationType =
  | 'DOCUMENT_APPROVAL_REQUIRED'
  | 'DOCUMENT_EXPIRED'
  | 'DOCUMENT_NEW_VERSION'
  | 'PROCESS_WITHOUT_PILOT'
  | 'PROCEDURE_WITHOUT_RESPONSIBLE'
  | 'NONCONFORMITY_CREATED'
  | 'NONCONFORMITY_CRITICAL'
  | 'CORRECTIVE_ACTION_ASSIGNED'
  | 'CORRECTIVE_ACTION_DUE_SOON'
  | 'CORRECTIVE_ACTION_OVERDUE'
  | 'INDICATOR_ALERT'
  | 'USER_CREATED'
  | 'USER_DISABLED'
  | 'ORGANIZATION_SUSPENDED'
  | 'SYSTEM_ALERT';

export interface NotificationQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  isRead?: boolean;
  category?: NotificationCategory | '';
  priority?: NotificationPriority | '';
  type?: NotificationType | '';
  fromDate?: string;
  toDate?: string;
}

export interface NotificationListItemResponse {
  id: number;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  isArchived: boolean;
  actionUrl?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export interface NotificationResponse extends NotificationListItemResponse {
  organizationId?: number | null;
  userId: number;
  readAt?: string | null;
}

export interface PagedNotificationResponse {
  total: number;
  pageNumber: number;
  pageSize: number;
  items: NotificationListItemResponse[];
}

export interface NotificationStatisticsResponse {
  total: number;
  unread: number;
  read: number;
  archived: number;
  critical: number;
  high: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export const NOTIFICATION_CATEGORY_OPTIONS: Array<{ value: NotificationCategory; label: string }> = [
  { value: 'INFO', label: 'Information' },
  { value: 'SUCCESS', label: 'Succes' },
  { value: 'WARNING', label: 'Avertissement' },
  { value: 'ERROR', label: 'Erreur' }
];

export const NOTIFICATION_PRIORITY_OPTIONS: Array<{ value: NotificationPriority; label: string }> = [
  { value: 'LOW', label: 'Basse' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'CRITICAL', label: 'Critique' }
];
