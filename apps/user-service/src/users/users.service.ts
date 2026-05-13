import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { InjectPinoLogger, PinoLogger } from '@repo/common';
import { createClerkClient, type ClerkClient, type UserJSON } from '@clerk/backend';


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

  async getUserRoles(clerkId: string): Promise<string[]> {
    const user = await this.findByClerkId(clerkId);
    if (!user?.roles) return [];
    return user.roles.map((r) => r.name);
  }

  async syncUserFromClerk(payload: UserJSON): Promise<void> {
    const { id, email_addresses, first_name, last_name } = payload;
    const email = email_addresses?.[0]?.email_address;

    if (!id || !email) {
      this.logger.warn(
        `Received Clerk webhook without ID or Email. Payload: ${JSON.stringify(payload)}`,
      );
      return;
    }

    let user = await this.userRepository.findOne({ where: { clerkId: id } });

    if (user) {
      // Update existing user
      user.email = email;
      user.firstName = first_name || user.firstName;
      user.lastName = last_name || user.lastName;
      await this.userRepository.save(user);
      this.logger.info(`Updated user ${user.id} from Clerk webhooks`);
    } else {
      // Check if email already exists (maybe they signed up differently)
      const existingEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingEmail) {
        this.logger.warn(
          `Email ${email} already exists but with different Clerk ID. Updating Clerk ID.`,
        );
        existingEmail.clerkId = id;
        existingEmail.firstName = first_name || existingEmail.firstName;
        existingEmail.lastName = last_name || existingEmail.lastName;
        await this.userRepository.save(existingEmail);
        user = existingEmail;
      } else {
        // Create new user and fetch default CUSTOMER Role
        user = this.userRepository.create({
          clerkId: id,
          email,
          firstName: first_name || undefined,
          lastName: last_name || undefined,
        });

        const customerRole = await this.roleRepository.findOne({
          where: { name: 'CUSTOMER' },
        });
        if (customerRole) {
          user.roles = [customerRole];
        }

        await this.userRepository.save(user);
        this.logger.info(`Created new user ${user.id} from Clerk webhooks`);
      }
    }

    // Crucial: Sync internal ID back to Clerk Metadata
    try {
      await this.clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          internalId: user.id,
          roles: user.roles?.map((r) => r.name) || [],
        },
      });
      this.logger.info(`Synced internal ID ${user.id} to Clerk for user ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync internal ID to Clerk for user ${id}: ${error.message}`,
      );
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
