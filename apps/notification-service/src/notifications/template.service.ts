import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Handlebars from 'handlebars';
import { PinoLogger } from '@repo/common';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationChannelType } from './enums/notification-channel.enum';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

/**
 * Service responsible for managing and rendering notification templates.
 */
@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TemplateService.name);
  }

  async createTemplate(dto: CreateTemplateDto): Promise<NotificationTemplate> {
    const existing = await this.templateRepository.findOne({
      where: { type: dto.type, channel: dto.channel },
    });

    if (existing) {
      throw new ConflictException(`Template for ${dto.type} on ${dto.channel} already exists.`);
    }

    const template = this.templateRepository.create(dto);
    this.logger.info(`Created new template for ${dto.type} on channel ${dto.channel}`);
    return this.templateRepository.save(template);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    Object.assign(template, dto);
    this.logger.info(`Updated template ${id}`);
    return this.templateRepository.save(template);
  }

  async findAllTemplates(): Promise<NotificationTemplate[]> {
    return this.templateRepository.find({
      order: { type: 'ASC', channel: 'ASC' },
    });
  }

  async removeTemplate(id: string): Promise<{ success: boolean }> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    template.isActive = false;
    await this.templateRepository.save(template);
    this.logger.info(`Deactivated template ${id}`);
    return { success: true };
  }

  async renderTemplate(
    type: NotificationType,
    channel: NotificationChannelType,
    data: Record<string, any>,
  ): Promise<{ subject: string; body: string }> {
    const template = await this.templateRepository.findOne({
      where: { type, channel, isActive: true },
    });

    if (!template) {
      this.logger.warn(`No template found for ${type} on channel ${channel}. Using fallback.`);
      return {
        subject: `Notification: ${type}`,
        body: JSON.stringify(data),
      };
    }

    let subject = template.subject || '';
    if (subject.includes('{{')) {
      const subjectDelegate = Handlebars.compile(subject);
      subject = subjectDelegate(data);
    }

    const bodyDelegate = Handlebars.compile(template.body);
    const body = bodyDelegate(data);

    return { subject, body };
  }

  async getTemplateByType(
    type: NotificationType,
    channel: NotificationChannelType,
  ): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({
      where: { type, channel },
    });

    if (!template) {
      throw new NotFoundException(`Template for ${type} on channel ${channel} not found`);
    }

    return template;
  }
}
