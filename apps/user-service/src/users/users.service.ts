import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { clerkId }, relations: ['addresses'] });
  }

  async syncUserFromClerk(payload: any): Promise<void> {
    const { id, email_addresses, first_name, last_name } = payload;
    const email = email_addresses?.[0]?.email_address;

    if (!id || !email) {
      this.logger.warn(`Received Clerk webhook without ID or Email. Payload: ${JSON.stringify(payload)}`);
      return;
    }

    let user = await this.userRepository.findOne({ where: { clerkId: id } });

    if (user) {
      // Update existing user
      user.email = email;
      user.firstName = first_name || user.firstName;
      user.lastName = last_name || user.lastName;
      await this.userRepository.save(user);
      this.logger.log(`Updated user ${user.id} from Clerk webhooks`);
    } else {
      // Check if email already exists (maybe they signed up differently)
      const existingEmail = await this.userRepository.findOne({ where: { email } });
      if (existingEmail) {
        this.logger.warn(`Email ${email} already exists but with different Clerk ID. Updating Clerk ID.`);
        existingEmail.clerkId = id;
        existingEmail.firstName = first_name || existingEmail.firstName;
        existingEmail.lastName = last_name || existingEmail.lastName;
        await this.userRepository.save(existingEmail);
        return;
      }

      // Create new user
      user = this.userRepository.create({
        clerkId: id,
        email,
        firstName: first_name,
        lastName: last_name,
        role: UserRole.CUSTOMER, // default role
      });
      await this.userRepository.save(user);
      this.logger.log(`Created new user ${user.id} from Clerk webhooks`);
    }
  }

  async deleteUserByClerkId(clerkId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { clerkId } });
    if (user) {
      // Soft delete wouldn't trigger cascade cleanly with TypeORM standard rules unless configured,
      // Here we just hard delete them as per privacy requirements usually associated with Account Deletion
      await this.userRepository.remove(user);
      this.logger.log(`Deleted user ${user.id} from Clerk webhooks`);
    }
  }
}
