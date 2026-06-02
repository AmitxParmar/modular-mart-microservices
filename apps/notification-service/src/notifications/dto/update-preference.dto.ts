import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for updating user notification preferences.
 */
export class UpdatePreferenceDto {
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  marketingEnabled?: boolean;
}
