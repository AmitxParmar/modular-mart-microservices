import { NotificationResponseDto } from './notification-response.dto';

/**
 * Paginated response for a list of notifications.
 */
export class NotificationListDto {
  items: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}
