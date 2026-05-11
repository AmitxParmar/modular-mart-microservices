import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { Role } from './entities/role.entity';
import { Seller } from './entities/seller.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressesController } from './addresses.controller';
import { AdminUsersController } from './admin-users.controller';
import { ClerkAuthGuard, RolesGuard } from '@repo/auth';

@Module({
  imports: [TypeOrmModule.forFeature([User, Address, Role, Seller])],
  providers: [UsersService, ClerkAuthGuard, RolesGuard],
  controllers: [UsersController, AddressesController, AdminUsersController],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}

