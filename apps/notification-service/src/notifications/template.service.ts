import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Handlebars from 'handlebars';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationChannelType } from './enums/notification-channel.enum';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

/**
 * Service responsible for managing and rendering notification templates.
 * Uses Handlebars for dynamic placeholder replacement.
 */
@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
  ) {}

  /**
   * Creates a new notification template.
   */
  async createTemplate(dto: CreateTemplateDto): Promise<NotificationTemplate> {
    // 1. Check if a template for this type and channel already exists
    const existing = await this.templateRepository.findOne({
      where: { type: dto.type, channel: dto.channel },
    });

    if (existing) {
      throw new ConflictException(
        `Template for ${dto.type} on ${dto.channel} already exists.`,
      );
    }

    // 2. Create and save the new template
    const template = this.templateRepository.create(dto);
    return this.templateRepository.save(template);
  }

  /**
   * Updates an existing notification template.
   */
  async updateTemplate(
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  /**
   * Retrieves all templates.
   */
  async findAllTemplates(): Promise<NotificationTemplate[]> {
    return this.templateRepository.find({
      order: { type: 'ASC', channel: 'ASC' },
    });
  }

  /**
   * Soft deletes (deactivates) a template.
   */
  async removeTemplate(id: string): Promise<{ success: boolean }> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    template.isActive = false;
    await this.templateRepository.save(template);
    return { success: true };
  }

  /**
   * Renders a template with the provided data.
...
   * @param type The notification type
   * @param channel The delivery channel
   * @param data The data to fill placeholders
   * @returns Rendered subject and body
   */
  async renderTemplate(
    type: NotificationType,
    channel: NotificationChannelType,
    data: Record<string, any>,
  ): Promise<{ subject: string; body: string }> {
    // 1. Fetch the active template for this type and channel
    const template = await this.templateRepository.findOne({
      where: { type, channel, isActive: true },
    });

    // 2. Fallback if no template is found
    if (!template) {
      // In a real system, we might have a global fallback or throw an error
      // For now, we'll return a generic message to prevent service failure
      return {
        subject: `Notification: ${type}`,
        body: JSON.stringify(data),
      };
    }

    // 3. Compile and render the subject (if it exists)
    let subject = template.subject || '';
    if (subject.includes('{{')) {
      const subjectDelegate = Handlebars.compile(subject);
      subject = subjectDelegate(data);
    }

    // 4. Compile and render the body
    const bodyDelegate = Handlebars.compile(template.body);
    const body = bodyDelegate(data);

    return { subject, body };
  }

  /**
   * Helper to find a template by its type and channel.
   */
  async getTemplateByType(
    type: NotificationType,
    channel: NotificationChannelType,
  ): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({
      where: { type, channel },
    });

    if (!template) {
      throw new NotFoundException(
        `Template for ${type} on channel ${channel} not found`,
      );
    }

    return template;
  }
}
