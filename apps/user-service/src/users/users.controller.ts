import { Controller, Post, Body, Headers, Req, Get, UnauthorizedException, Logger, HttpCode, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import type { Request } from 'express';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { CurrentUser, ClerkAuthGuard } from '@repo/auth';
import type { ClerkUser } from '@repo/auth';
import { UseGuards } from '@nestjs/common';

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
      this.logger.warn(`User ${clerkUser.userId} not found in DB but authenticated.`);
      throw new NotFoundException('User profile not found. It may take a moment to sync.');
    }
    return user;
  }

  @Post('webhooks/clerk')
  @HttpCode(200)
  async handleClerkWebhook(
    @Req() req: Request,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.error('CLERK_WEBHOOK_SECRET is not configured');
      return { success: false };
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new UnauthorizedException('Missing svix headers');
    }

    const payload = req.body;
    const payloadString = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(payloadString, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err: any) {
      this.logger.error('Error verifying webhook:', err.message);
      throw new UnauthorizedException('Invalid signature');
    }

    const eventType = evt.type;
    this.logger.log(`Received Clerk Webhook: ${eventType}`);

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
