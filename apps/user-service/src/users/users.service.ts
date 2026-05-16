import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { InjectPinoLogger, PinoLogger } from '@repo/common';
import {
  createClerkClient,
  type ClerkClient,
  type UserJSON,
} from '@clerk/backend';

@Injectable()
export class UsersService {
  private readonly clerkClient: ClerkClient;

  constructor(
    @InjectPinoLogger(UsersService.name) private readonly logger: PinoLogger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
    });
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { clerkId },
      relations: ['addresses', 'roles'],
    });
  }

  async countAll(): Promise<number> {
    return this.userRepository.count();
  }

  async getUserRoles(clerkId: string): Promise<string[]> {
    const user = await this.findByClerkId(clerkId);
    if (!user?.roles) return [];
    return user.roles.map((r) => r.name);
  }

  async syncClerkUser(clerkId: string): Promise<User> {
    try {
      const clerkUserFull = await this.clerkClient.users.getUser(clerkId);
      return await this.syncUserFromClerk(clerkUserFull);
    } catch (error) {
      this.logger.error(`Failed to fetch user ${clerkId} from Clerk for JIT sync: ${error.message}`);
      throw error;
    }
  }

  async syncUserFromClerk(payload: UserJSON | any): Promise<User> {
    const payloadId = payload.id;
    this.logger.info(`[SYNC] syncUserFromClerk started for Clerk ID: ${payloadId}`);
    this.logger.debug(`[SYNC] Payload keys: ${Object.keys(payload).join(', ')}`);
    
    // Robust extraction for email
    let email = payload.email;
    if (!email && payload.email_addresses?.length > 0) {
      email = payload.email_addresses[0].email_address;
    }
    if (!email && payload.emailAddresses?.length > 0) {
      email = payload.emailAddresses[0].emailAddress;
    }

    if (!payloadId || !email) {
      this.logger.error(`[SYNC] Critical data missing. ID: ${payloadId}, Email: ${email}`);
      throw new Error(`User sync failed: missing critical data (ID or Email)`);
    }

    this.logger.info(`[SYNC] Processing user: ${email} (Clerk: ${payloadId})`);

    let user = await this.userRepository.findOne({
      where: { clerkId: payloadId },
      relations: ['roles'],
    });

    const firstName = payload.first_name || payload.firstName || '';
    const lastName = payload.last_name || payload.lastName || '';

    try {
      if (user) {
        this.logger.info(`[SYNC] Found existing user ${user.id}. Updating profile.`);
        user.email = email;
        user.firstName = firstName;
        user.lastName = lastName;
        user = await this.userRepository.save(user);
        this.logger.info(`[SYNC] Successfully updated user ${user.id}`);
      } else {
        this.logger.info(`[SYNC] User not found by Clerk ID. Checking for existing email ${email}.`);
        const existingEmail = await this.userRepository.findOne({
          where: { email },
          relations: ['roles'],
        });

        if (existingEmail) {
          this.logger.warn(`[SYNC] Email ${email} exists with different Clerk ID. Migrating to ${payloadId}.`);
          existingEmail.clerkId = payloadId;
          existingEmail.firstName = firstName || existingEmail.firstName;
          existingEmail.lastName = lastName || existingEmail.lastName;
          user = await this.userRepository.save(existingEmail);
        } else {
          this.logger.info(`[SYNC] Creating entirely new user record for ${email}.`);
          user = this.userRepository.create({
            clerkId: payloadId,
            email,
            firstName,
            lastName,
          });

          const customerRole = await this.roleRepository.findOne({
            where: { name: 'CUSTOMER' },
          });
          if (customerRole) {
            this.logger.debug(`[SYNC] Assigning default CUSTOMER role.`);
            user.roles = [customerRole];
          } else {
            this.logger.error(`[SYNC] CUSTOMER role NOT FOUND in database! User will be created without roles.`);
          }

          user = await this.userRepository.save(user);
          this.logger.info(`[SYNC] Successfully created user record ${user.id}`);
        }
      }

      // Re-verify the save
      const verifyUser = await this.userRepository.findOne({ where: { id: user.id } });
      if (!verifyUser) {
        this.logger.error(`[SYNC] CRITICAL: User ${user.id} was 'saved' but cannot be found in DB immediately after!`);
      } else {
        this.logger.debug(`[SYNC] Save verified. Internal ID: ${user.id}`);
      }

      // Sync internal ID back to Clerk Metadata
      try {
        this.logger.info(`[SYNC] Pushing internalId ${user.id} back to Clerk for user ${payloadId}`);
        await this.clerkClient.users.updateUserMetadata(payloadId, {
          publicMetadata: {
            internalId: user.id,
            roles: user.roles?.map((r) => r.name) || ['CUSTOMER'],
          },
        });
        this.logger.info(`[SYNC] Clerk metadata sync complete for ${payloadId}`);
      } catch (clerkError) {
        this.logger.error(`[SYNC] Failed to update Clerk metadata: ${clerkError.message}`);
        // We don't throw here because the DB record is already saved
      }

      return user;
    } catch (dbError) {
      this.logger.error(`[SYNC] Database operation failed: ${dbError.message}`);
      throw dbError;
    }
  }

  async deleteUserByClerkId(clerkId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { clerkId } });
    if (user) {
      // Soft delete wouldn't trigger cascade cleanly with TypeORM standard rules unless configured,
      // Here we just hard delete them as per privacy requirements usually associated with Account Deletion
      await this.userRepository.remove(user);
      this.logger.info(`Deleted user ${user.id} from Clerk webhooks`);
    }
  }

  async getAddressById(addressId: string): Promise<any> {
    // This will be called internally by other services to snapshot addresses
    const address = await this.dataSource
      .getRepository('addresses')
      .findOne({ where: { id: addressId } });

    if (!address) {
      throw new Error('Address not found');
    }
    return address;
  }
}
