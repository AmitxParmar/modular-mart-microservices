import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { PinoLogger } from '@repo/common';
import {
  createClerkClient,
  type ClerkClient,
  type UserJSON,
} from '@clerk/backend';

@Injectable()
export class UsersService {
  private readonly clerkClient: ClerkClient;

  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(UsersService.name);
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

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles'],
      order: { createdAt: 'DESC' },
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
      const email = clerkUserFull.emailAddresses?.[0]?.emailAddress;
      if (!email) {
        throw new Error('User sync failed: missing email');
      }
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

  async syncUserFromClerk(payload: UserJSON): Promise<User> {
    const email = payload.email_addresses?.[0]?.email_address;
    if (!email) {
      throw new Error('User sync failed: missing email');
    }
    return this.syncUser({
      id: payload.id,
      email,
      firstName: payload.first_name ?? '',
      lastName: payload.last_name ?? '',
    });
  }

  private async syncClerkMetadata(clerkId: string, user: User): Promise<void> {
    try {
      this.logger.info(`[SYNC] Pushing internalId ${user.id} back to Clerk for user ${clerkId}`);
      await this.clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          internalId: user.id,
          roles: user.roles?.map((r) => r.name) || ['CUSTOMER'],
        },
      });
      this.logger.info(`[SYNC] Clerk metadata sync complete for ${clerkId}`);
    } catch (clerkError) {
      const clerkMessage = clerkError instanceof Error ? clerkError.message : String(clerkError);
      this.logger.error(`[SYNC] Failed to update Clerk metadata: ${clerkMessage}`);
    }
  }

  private async createNewUser(
    clerkId: string,
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    this.logger.info(`[SYNC] Creating entirely new user record for ${email}.`);
    const user = this.userRepository.create({
      clerkId,
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

    const savedUser = await this.userRepository.save(user);
    this.logger.info(`[SYNC] Successfully created user record ${savedUser.id}`);
    return savedUser;
  }

  private async syncUser(payload: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const payloadId = payload.id;
    const email = payload.email;
    const firstName = payload.firstName;
    const lastName = payload.lastName;

    this.logger.info(`[SYNC] syncUser started for Clerk ID: ${payloadId}`);
    this.logger.info(`[SYNC] Processing user: ${email} (Clerk: ${payloadId})`);

    let user = await this.userRepository.findOne({
      where: { clerkId: payloadId },
      relations: ['roles'],
    });

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
          user = await this.createNewUser(payloadId, email, firstName, lastName);
        }
      }

      // Re-verify the save
      const verifyUser = await this.userRepository.findOne({ where: { id: user.id } });
      if (verifyUser) {
        this.logger.debug(`[SYNC] Save verified. Internal ID: ${user.id}`);
      } else {
        this.logger.error(`[SYNC] CRITICAL: User ${user.id} was 'saved' but cannot be found in DB immediately after!`);
      }

      // Sync internal ID back to Clerk Metadata
      await this.syncClerkMetadata(payloadId, user);

      return user;
    } catch (dbError) {
      const dbMessage = dbError instanceof Error ? dbError.message : String(dbError);
      this.logger.error(`[SYNC] Database operation failed: ${dbMessage}`);
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
