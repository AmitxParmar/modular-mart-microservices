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
import type { GetUserRolePayload, GetUserRoleResponse } from '@repo/contracts';
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

  @MessagePattern('users.count')
  async countUsers(): Promise<number> {
    return this.usersService.countAll();
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getProfile(@CurrentUser() clerkUser: ClerkUser) {
    const user = await this.usersService.findByClerkId(clerkUser.userId);
    if (!user) {
      this.logger.warn(
        `User ${clerkUser.userId} not found in DB but authenticated.`,
      );
      throw new NotFoundException(
        'User profile not found. It may take a moment to sync.',
      );
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
