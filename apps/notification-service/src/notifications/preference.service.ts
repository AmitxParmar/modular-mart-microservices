import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { NotificationChannelType } from './enums/notification-channel.enum';

/**
 * Service to manage user-specific notification preferences.
 * Handles opt-in/opt-out for various delivery channels.
 */
@Injectable()
export class PreferenceService {
  constructor(
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  /**
   * Retrieves preferences for a specific user.
   * If no preferences exist yet, it creates a default set.
   * 
   * @param userId The external ID of the user
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    // 1. Try to find existing preferences
    let preferences = await this.preferenceRepository.findOne({
      where: { userId },
    });

    // 2. If not found, create and save default preferences
    if (!preferences) {
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

  /**
   * Updates user preferences.
   * 
   * @param userId The external ID of the user
   * @param dto The partial preference updates
   */
  async updatePreferences(
    userId: string,
    dto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    // 1. Ensure preferences exist (get or create default)
    const preferences = await this.getUserPreferences(userId);

    // 2. Apply updates from DTO
    Object.assign(preferences, dto);

    // 3. Persist changes
    return this.preferenceRepository.save(preferences);
  }

  /**
   * Checks if a specific channel is enabled for a user.
   * 
   * @param userId The external ID of the user
   * @param channel The channel to check
   */
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
        return true; // In-app is always enabled by default
      default:
        return false;
    }
  }
}
