import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinoLogger } from '@repo/common';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { NotificationChannelType } from './enums/notification-channel.enum';

/**
 * Service to manage user-specific notification preferences.
 */
@Injectable()
export class PreferenceService {
  constructor(
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PreferenceService.name);
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    let preferences = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      this.logger.info(`Creating default preferences for user ${userId}`);
      preferences = this.preferenceRepository.create({
        userId,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        marketingEnabled: false,
      });
      await this.preferenceRepository.save(preferences);
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    const preferences = await this.getUserPreferences(userId);
    Object.assign(preferences, dto);
    this.logger.info(`Updated preferences for user ${userId}`);
    return this.preferenceRepository.save(preferences);
  }

  async isChannelEnabled(
    userId: string,
    channel: NotificationChannelType,
  ): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);

    switch (channel) {
      case NotificationChannelType.EMAIL:
        return preferences.emailEnabled;
      case NotificationChannelType.SMS:
        return preferences.smsEnabled;
      case NotificationChannelType.PUSH:
        return preferences.pushEnabled;
      case NotificationChannelType.IN_APP:
        return true;
      default:
        return false;
    }
  }
}
