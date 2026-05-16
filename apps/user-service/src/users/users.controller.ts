import {
  Controller,
  Post,
  RawBody,
  Headers,
  Get,
  UnauthorizedException,
  HttpCode,
  NotFoundException,
  UseGuards,
  Param,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { CurrentUser, ClerkAuthGuard } from '@repo/auth';
import { EVENT_PATTERNS } from '@repo/contracts';
import type { GetUserRolePayload, GetUserRoleResponse, GetUserIdPayload, GetUserIdResponse } from '@repo/contracts';
import type { ClerkUser } from '@repo/auth';
import { InjectPinoLogger, PinoLogger } from '@repo/common';

import type { WebhookEvent } from '@clerk/backend';

@Controller('users')
export class UsersController {
  constructor(
    @InjectPinoLogger(UsersController.name) private readonly logger: PinoLogger,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @MessagePattern(EVENT_PATTERNS.GET_USER_ROLE)
  async getUserRole(
    @Payload() data: GetUserRolePayload,
  ): Promise<GetUserRoleResponse> {
    this.logger.info(`Received internal role request for ${data.userId}`);
    return this.usersService.getUserRoles(data.userId);
  }

  @MessagePattern(EVENT_PATTERNS.GET_USER_ID)
  async getUserId(
    @Payload() data: GetUserIdPayload,
  ): Promise<GetUserIdResponse> {
    this.logger.info(`[MSG] GET_USER_ID request received for Clerk ID: ${data.clerkId}`);
    let user = await this.usersService.findByClerkId(data.clerkId);
    
    if (user) {
      this.logger.debug(`[MSG] Found user ${user.id} for Clerk ID ${data.clerkId}`);
    } else {
      this.logger.info(`[MSG] User ${data.clerkId} not found in DB. Triggering JIT sync via messaging fallback.`);
      try {
        user = await this.usersService.syncClerkUser(data.clerkId);
        this.logger.info(`[MSG] JIT sync successful for ${data.clerkId}. Internal ID: ${user.id}`);
      } catch (error) {
        this.logger.error(`[MSG] JIT sync failed for ${data.clerkId} during messaging fallback: ${error.message}`);
        return { internalId: null };
      }
    }
    
    return { internalId: user?.id || null };
  }

  @MessagePattern('users.count')
  async countUsers(): Promise<number> {
    return this.usersService.countAll();
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getProfile(@CurrentUser() clerkUser: ClerkUser) {
    let user = await this.usersService.findByClerkId(clerkUser.userId);
    
    if (!user) {
      this.logger.info(
        `User ${clerkUser.userId} authenticated but not in DB. Triggering JIT sync.`,
      );
      
      try {
        user = await this.usersService.syncClerkUser(clerkUser.userId);
      } catch (error) {
        this.logger.error(`JIT sync failed for ${clerkUser.userId}: ${error.message}`);
        throw new NotFoundException(
          'User profile not found and auto-sync failed. Please contact support.',
        );
      }
    }
    
    return user;
  }

  @Get('addresses/:id')
  async getAddress(@Param('id') id: string) {
    try {
      return await this.usersService.getAddressById(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('webhooks/clerk')
  @HttpCode(200)
  async handleClerkWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = this.configService.get<string>(
      'CLERK_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      this.logger.error('CLERK_WEBHOOK_SECRET is not configured');
      return { success: false };
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new UnauthorizedException('Missing svix headers');
    }

    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent;

    try {
      // Verify against the raw bytes — re-serializing a parsed object would break the HMAC
      evt = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const eventType = evt.type;
    this.logger.info(`Received Clerk webhook: ${eventType}`);

    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        await this.usersService.syncUserFromClerk(evt.data);
        break;
      case 'user.deleted':
        if (evt.data.id) {
          await this.usersService.deleteUserByClerkId(evt.data.id);
        }
        break;
      default:
        this.logger.debug(`Unhandled webhook event type: ${eventType}`);
    }

    return { success: true };
  }
}
