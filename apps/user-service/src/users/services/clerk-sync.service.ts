import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { PinoLogger } from '@repo/common';
import { createClerkClient, type ClerkClient, type UserJSON } from '@clerk/backend';

/**
 * Service responsible for synchronizing user data between Clerk and the local database.
 * Handles JIT sync, webhooks, and metadata updates.
 */
@Injectable()
export class ClerkSyncService {
  private readonly clerkClient: ClerkClient;

  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly configService: ConfigService,
  ) {
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
    });
  }

  /**
   * Performs a Just-In-Time sync for a user by fetching their latest data from Clerk.
   */
  async syncClerkUser(clerkId: string): Promise<User> {
    try {
      const clerkUserFull = await this.clerkClient.users.getUser(clerkId);
      const email = clerkUserFull.emailAddresses?.[0]?.emailAddress;
      
      if (!email) throw new Error('User sync failed: missing email');

      return await this.syncUser({
        id: clerkUserFull.id,
        email,
        firstName: clerkUserFull.firstName ?? '',
        lastName: clerkUserFull.lastName ?? '',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch user ${clerkId} from Clerk for JIT sync: ${message}`);
      throw error;
    }
  }

  /**
   * Processes a user sync payload from a Clerk webhook.
   */
  async syncUserFromClerk(payload: UserJSON): Promise<User> {
    const email = payload.email_addresses?.[0]?.email_address;
    if (!email) throw new Error('User sync failed: missing email');

    return this.syncUser({
      id: payload.id,
      email,
      firstName: payload.first_name ?? '',
      lastName: payload.last_name ?? '',
    });
  }

  /**
   * Core logic for finding or creating/updating a user record.
   * Ensures that the local database is in sync with Clerk's view of the user.
   */
  private async syncUser(payload: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const { id: clerkId, email, firstName, lastName } = payload;
    this.logger.info(`[SYNC] Starting sync for user: ${email} (Clerk: ${clerkId})`);

    let user = await this.userRepository.findOne({
      where: { clerkId },
      relations: ['roles'],
    });

    if (user) {
      // 1. Update existing user
      user.email = email;
      user.firstName = firstName;
      user.lastName = lastName;
      user = await this.userRepository.save(user);
    } else {
      // 2. Check for email collisions/migration
      const existingEmail = await this.userRepository.findOne({
        where: { email },
        relations: ['roles'],
      });

      if (existingEmail) {
        this.logger.warn(`[SYNC] Email ${email} exists with different ID. Migrating to ${clerkId}.`);
        existingEmail.clerkId = clerkId;
        existingEmail.firstName = firstName || existingEmail.firstName;
        existingEmail.lastName = lastName || existingEmail.lastName;
        user = await this.userRepository.save(existingEmail);
      } else {
        // 3. Create entirely new user
        user = await this.createNewUser(clerkId, email, firstName, lastName);
      }
    }

    // 4. Update Clerk with our internal database ID and roles
    await this.syncClerkMetadata(clerkId, user);

    return user;
  }

  /**
   * Pushes the internal user ID and roles back to Clerk metadata.
   * This enables downstream services to get the internal ID directly from the JWT.
   */
  private async syncClerkMetadata(clerkId: string, user: User): Promise<void> {
    try {
      await this.clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          internalId: user.id,
          roles: user.roles?.map((r) => r.name) || ['CUSTOMER'],
        },
      });
    } catch (err) {
      this.logger.error(`[SYNC] Failed to update Clerk metadata for ${clerkId}: ${err.message}`);
    }
  }

  /**
   * Creates a new user record with the default CUSTOMER role.
   */
  private async createNewUser(
    clerkId: string,
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    const user = this.userRepository.create({ clerkId, email, firstName, lastName });
    const customerRole = await this.roleRepository.findOne({ where: { name: 'CUSTOMER' } });
    
    if (customerRole) {
      user.roles = [customerRole];
    } else {
      this.logger.error(`[SYNC] Default CUSTOMER role not found! Creating user without roles.`);
    }

    return await this.userRepository.save(user);
  }
}
