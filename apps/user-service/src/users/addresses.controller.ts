import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { ClerkAuthGuard, CurrentUser } from '@repo/auth';
import type { ClerkUser } from '@repo/auth';
import { UsersService } from './users.service';

@Controller('users/me/addresses')
@UseGuards(ClerkAuthGuard)
export class AddressesController {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async getAddresses(@CurrentUser() user: ClerkUser) {
    const dbUser = await this.usersService.findByClerkId(user.userId);
    if (!dbUser) throw new NotFoundException('User not found');
    return this.addressRepo.find({ where: { user: { id: dbUser.id } } });
  }

  @Post()
  async createAddress(
    @CurrentUser() user: ClerkUser,
    @Body() data: Partial<Address>,
  ) {
    const dbUser = await this.usersService.findByClerkId(user.userId);
    if (!dbUser) throw new NotFoundException('User not found');
    
    const address = this.addressRepo.create({
      ...data,
      user: dbUser,
    });
    return this.addressRepo.save(address);
  }

  @Patch(':id')
  async updateAddress(
    @CurrentUser() user: ClerkUser,
    @Param('id') id: string,
    @Body() data: Partial<Address>,
  ) {
    const dbUser = await this.usersService.findByClerkId(user.userId);
    if (!dbUser) throw new NotFoundException('User not found');

    const address = await this.addressRepo.findOne({
      where: { id, user: { id: dbUser.id } },
    });
    if (!address) throw new NotFoundException('Address not found');

    Object.assign(address, data);
    return this.addressRepo.save(address);
  }

  @Delete(':id')
  async deleteAddress(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    const dbUser = await this.usersService.findByClerkId(user.userId);
    if (!dbUser) throw new NotFoundException('User not found');

    const address = await this.addressRepo.findOne({
      where: { id, user: { id: dbUser.id } },
    });
    if (!address) throw new NotFoundException('Address not found');

    await this.addressRepo.remove(address);
    return { success: true };
  }

  @Put(':id/default')
  async setDefault(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    const dbUser = await this.usersService.findByClerkId(user.userId);
    if (!dbUser) throw new NotFoundException('User not found');

    // Unset current default
    await this.addressRepo.update(
      { user: { id: dbUser.id }, isDefault: true },
      { isDefault: false },
    );

    // Set new default
    const address = await this.addressRepo.findOne({
      where: { id, user: { id: dbUser.id } },
    });
    if (!address) throw new NotFoundException('Address not found');

    address.isDefault = true;
    return this.addressRepo.save(address);
  }
}
