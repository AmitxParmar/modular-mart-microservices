import {
  Controller,
  Post,
  RawBody,
  Headers,
  Get,
  UnauthorizedException,
  Logger,
  HttpCode,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { CurrentUser, ClerkAuthGuard } from '@repo/auth';
import type { ClerkUser } from '@repo/auth';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

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

    let evt: any;

    try {
      // Verify against the raw bytes — re-serializing a parsed object would break the HMAC
      evt = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const eventType = evt.type;
    this.logger.log(`Received Clerk webhook: ${eventType}`);

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
