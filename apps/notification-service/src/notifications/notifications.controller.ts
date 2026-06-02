import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Sse,
  UseGuards,
  ParseBoolPipe,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { SseService } from './sse.service';
import { PreferenceService } from './preference.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { CurrentUser, ClerkAuthGuard, ClerkUser } from '@repo/auth';

/**
 * Controller for managing user notifications.
 * Provides endpoints for history, status updates, preferences, and real-time streaming.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sseService: SseService,
    private readonly preferenceService: PreferenceService,
  ) {}

  /**
   * Retrieves a paginated list of notifications for the authenticated user.
   */
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getMyNotifications(
    @CurrentUser() user: ClerkUser,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('unreadOnly', new ParseBoolPipe({ optional: true })) unreadOnly = false,
  ) {
    return this.notificationsService.getUserNotifications(
      user.userId,
      page,
      limit,
      unreadOnly,
    );
  }

  /**
   * Retrieves the unread count for the authenticated user.
   * Useful for showing a badge in the UI.
   */
  @Get('unread-count')
  @UseGuards(ClerkAuthGuard)
  async getUnreadCount(@CurrentUser() user: ClerkUser) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  /**
   * Server-Sent Events (SSE) endpoint for real-time notification updates.
   * Pushes "NEW_NOTIFICATION" and status change events to the frontend.
   */
  @Sse('stream')
  @UseGuards(ClerkAuthGuard)
  stream(@CurrentUser() user: ClerkUser): Observable<any> {
    return this.sseService.getEventStream(user.userId);
  }

  /**
   * Marks a specific notification as read.
   */
  @Patch(':id/read')
  @UseGuards(ClerkAuthGuard)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: ClerkUser,
  ) {
    const updated = await this.notificationsService.markAsRead(id, user.userId);
    
    // Push update via SSE to synchronize other open tabs
    this.sseService.pushStatusUpdate(user.userId, { 
      notificationId: id, 
      isRead: true 
    });
    
    return updated;
  }

  /**
   * Marks all notifications for the user as read.
   */
  @Patch('read-all')
  @UseGuards(ClerkAuthGuard)
  async markAllAsRead(@CurrentUser() user: ClerkUser) {
    const result = await this.notificationsService.markAllAsRead(user.userId);
    
    // Push update via SSE
    this.sseService.pushStatusUpdate(user.userId, { allRead: true });
    
    return result;
  }

  /**
   * Retrieves notification preferences for the authenticated user.
   */
  @Get('preferences')
  @UseGuards(ClerkAuthGuard)
  async getPreferences(@CurrentUser() user: ClerkUser) {
    return this.preferenceService.getUserPreferences(user.userId);
  }

  /**
   * Updates notification preferences for the authenticated user.
   */
  @Patch('preferences')
  @UseGuards(ClerkAuthGuard)
  async updatePreferences(
    @CurrentUser() user: ClerkUser,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.preferenceService.updatePreferences(user.userId, dto);
  }
}
