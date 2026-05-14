import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ClerkAuthGuard, Roles, RolesGuard } from '@repo/auth';

@Controller('users/admin')
@Roles('ADMIN')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Get('users')
  async getAllUsers() {
    // Basic implementation for management UI
    const users = await this.userRepo.find({
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });

    return users.map((u) => ({
      id: u.id,
      clerkId: u.clerkId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      roles: u.roles.map((r) => r.name),
      createdAt: u.createdAt,
    }));
  }
}
