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
  Post,
  Delete,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { SseService } from './sse.service';
import { PreferenceService } from './preference.service';
import { TemplateService } from './template.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CurrentUser, ClerkAuthGuard, Roles, RolesGuard } from '@repo/auth';
import type { ClerkUser } from '@repo/auth';

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
    private readonly templateService: TemplateService,
  ) {}

  // ─── Authenticated User Endpoints ──────────────────────────────────────────

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
   */
  @Get('unread-count')
  @UseGuards(ClerkAuthGuard)
  async getUnreadCount(@CurrentUser() user: ClerkUser) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  /**
   * Server-Sent Events (SSE) endpoint for real-time notification updates.
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
    this.sseService.pushStatusUpdate(user.userId, { notificationId: id, isRead: true });
    return updated;
  }

  /**
   * Marks all notifications for the user as read.
   */
  @Patch('read-all')
  @UseGuards(ClerkAuthGuard)
  async markAllAsRead(@CurrentUser() user: ClerkUser) {
    const result = await this.notificationsService.markAllAsRead(user.userId);
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

  // ─── Admin Endpoints ───────────────────────────────────────────────────────

  /**
   * Admin: List all notifications across all users.
   */
  @Get('admin/list')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async adminListNotifications(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('type') type?: string,
  ) {
    return this.notificationsService.findAllNotifications(page, limit, type);
  }

  /**
   * Admin: Get delivery statistics.
   */
  @Get('admin/stats')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async adminGetStats() {
    return this.notificationsService.getStats();
  }

  /**
   * Admin: Create a message template.
   */
  @Post('admin/templates')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.templateService.createTemplate(dto);
  }

  /**
   * Admin: List all message templates.
   */
  @Get('admin/templates')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async listTemplates() {
    return this.templateService.findAllTemplates();
  }

  /**
   * Admin: Update a message template.
   */
  @Patch('admin/templates/:id')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templateService.updateTemplate(id, dto);
  }

  /**
   * Admin: Deactivate a message template.
   */
  @Delete('admin/templates/:id')
  @Roles('ADMIN')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  async removeTemplate(@Param('id') id: string) {
    return this.templateService.removeTemplate(id);
  }

  // ─── Internal Endpoints ────────────────────────────────────────────────────

  /**
   * Internal: Create a notification (service-to-service).
   * Note: This would typically be protected by a shared API key or IP whitelist.
   */
  @Post('internal/create')
  async internalCreateNotification(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(dto);
  }
}
