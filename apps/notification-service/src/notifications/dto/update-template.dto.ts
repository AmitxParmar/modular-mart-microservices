import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateDto } from './create-template.dto';

/**
 * DTO for updating an existing notification template.
 * All fields are optional.
 */
export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}
