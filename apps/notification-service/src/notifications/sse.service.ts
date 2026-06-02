import { Injectable } from '@nestjs/common';
import { Subject, Observable, interval, map, merge, filter, finalize } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { PinoLogger } from '@repo/common';
import { Gauge } from 'prom-client';

/**
 * Event structure for SSE updates.
 */
export interface NotificationEvent {
  type: 'NEW_NOTIFICATION' | 'READ_STATUS_CHANGED' | 'HEARTBEAT';
  userId: string;
  payload?: any;
}

// ─── Custom Metrics ──────────────────────────────────────────────────────────
const activeSseConnections = new Gauge({
  name: 'sse_connections_active',
  help: 'Total number of active SSE connections',
});

/**
 * Service to manage Server-Sent Events (SSE) connections.
 * Allows pushing real-time updates to specific users connected via the /stream endpoint.
 */
@Injectable()
export class SseService {
  // 1. Central subject to broadcast all internal events
  private readonly eventSubject = new Subject<NotificationEvent>();

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(SseService.name);
  }

  /**
   * Returns an event stream for a specific user.
   * 
   * @param userId The ID of the user to stream events for
   */
  getEventStream(userId: string): Observable<MessageEvent> {
    this.logger.info(`🔌 User ${userId} connected to notification stream`);
    activeSseConnections.inc();

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
    const heartbeat = interval(30000).pipe(
      map(() => ({
        data: { type: 'HEARTBEAT' },
      } as MessageEvent))
    );

    // 4. Merge heartbeat and user events into a single stream
    // Use finalize to decrement the gauge when the connection closes
    return merge(userEvents, heartbeat).pipe(
      finalize(() => {
        this.logger.info(`🔌 User ${userId} disconnected from notification stream`);
        activeSseConnections.dec();
      })
    );
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
