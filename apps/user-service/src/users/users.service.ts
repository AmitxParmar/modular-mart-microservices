import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { PinoLogger } from '@repo/common';
import { UserJSON } from '@clerk/backend';
import { ClerkSyncService } from './services/clerk-sync.service';

/**
 * Service for managing user profiles and basic account operations.
 * Coordinates with ClerkSyncService for identity synchronization.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly syncService: ClerkSyncService,
  ) {
    this.logger.setContext(UsersService.name);
  }

  /**
   * Finds a user by their Clerk ID.
   */
  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { clerkId },
      relations: ['addresses', 'roles'],
    });
  }

  /**
   * Fetches all registered users.
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns the total count of registered users.
   */
  async countAll(): Promise<number> {
    return this.userRepository.count();
  }

  /**
   * Returns a list of role names for a specific user.
   */
  async getUserRoles(clerkId: string): Promise<string[]> {
    const user = await this.findByClerkId(clerkId);
    return user?.roles?.map((r) => r.name) || [];
  }

  /**
   * Delegates JIT user sync to ClerkSyncService.
   */
  async syncClerkUser(clerkId: string): Promise<User> {
    return this.syncService.syncClerkUser(clerkId);
  }

  /**
   * Delegates webhook-based user sync to ClerkSyncService.
   */
  async syncUserFromClerk(payload: UserJSON): Promise<User> {
    return this.syncService.syncUserFromClerk(payload);
  }

  /**
   * Deletes a user record (triggered by account deletion).
   */
  async deleteUserByClerkId(clerkId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { clerkId } });
    if (user) {
      await this.userRepository.remove(user);
      this.logger.info(`Deleted user ${user.id} following account closure.`);
    }
  }

  /**
   * Fetches a specific address by ID for snapshotting purposes.
   */
  async getAddressById(addressId: string): Promise<any> {
    const address = await this.dataSource
      .getRepository('addresses')
      .findOne({ where: { id: addressId } });

    if (!address) throw new Error('Address not found');
    return address;
  }
}
