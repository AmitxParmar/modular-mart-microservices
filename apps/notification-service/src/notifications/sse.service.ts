import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, interval, map, merge, filter } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

/**
 * Event structure for SSE updates.
 */
export interface NotificationEvent {
  type: 'NEW_NOTIFICATION' | 'READ_STATUS_CHANGED' | 'HEARTBEAT';
  userId: string;
  payload?: any;
}

/**
 * Service to manage Server-Sent Events (SSE) connections.
 * Allows pushing real-time updates to specific users connected via the /stream endpoint.
 */
@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  
  // 1. Central subject to broadcast all internal events
  private readonly eventSubject = new Subject<NotificationEvent>();

  /**
   * Returns an event stream for a specific user.
   * 
   * @param userId The ID of the user to stream events for
   */
  getEventStream(userId: string): Observable<MessageEvent> {
    this.logger.log(`🔌 User ${userId} connected to notification stream`);

    // 2. Filter the central stream for events belonging to this user
    const userEvents = this.eventSubject.asObservable().pipe(
      filter((event) => event.userId === userId || event.userId === 'ALL'),
      map((event) => ({
        data: {
          type: event.type,
          payload: event.payload,
        },
      } as MessageEvent))
    );

    // 3. Create a heartbeat interval (30 seconds) to keep the connection alive
    // This prevents proxies and load balancers from closing "idle" connections.
    const heartbeat = interval(30000).pipe(
      map(() => ({
        data: { type: 'HEARTBEAT' },
      } as MessageEvent))
    );

    // 4. Merge heartbeat and user events into a single stream
    return merge(userEvents, heartbeat);
  }

  /**
   * Pushes a "New Notification" event to a specific user.
   */
  pushNewNotification(userId: string, notification: any) {
    this.eventSubject.next({
      type: 'NEW_NOTIFICATION',
      userId,
      payload: notification,
    });
  }

  /**
   * Pushes a status update (e.g. unread count change) to a specific user.
   */
  pushStatusUpdate(userId: string, payload: any) {
    this.eventSubject.next({
      type: 'READ_STATUS_CHANGED',
      userId,
      payload,
    });
  }

  /**
   * Broadcasts an event to all connected users.
   */
  broadcast(type: 'NEW_NOTIFICATION' | 'READ_STATUS_CHANGED', payload: any) {
    this.eventSubject.next({
      type,
      userId: 'ALL',
      payload,
    });
  }
}
