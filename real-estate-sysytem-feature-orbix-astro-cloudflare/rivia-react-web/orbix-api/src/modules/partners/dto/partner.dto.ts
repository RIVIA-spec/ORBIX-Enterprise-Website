import { IsEmail, IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import type { PartnerMemberRole, PartnerType, PartnerVerificationStatus } from '../domain/partner';

export class CreatePartnerDto {
  @IsIn(['real_estate_office', 'developer', 'hotel', 'host'])
  type!: PartnerType;

  @IsString()
  @MaxLength(180)
  legalName!: string;

  @IsString()
  @MaxLength(120)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  website?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  logoUrl?: string;
}

export class UpdatePartnerDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  website?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  logoUrl?: string;
}

export class AddPartnerMemberDto {
  @IsString()
  userId!: string;

  @IsIn(['manager', 'agent', 'content_editor', 'viewer'])
  role!: Exclude<PartnerMemberRole, 'owner'>;
}

export class UpdatePartnerMemberDto {
  @IsOptional()
  @IsIn(['manager', 'agent', 'content_editor', 'viewer'])
  role?: Exclude<PartnerMemberRole, 'owner'>;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class UpdatePartnerVerificationDto {
  @IsIn(['verified', 'rejected', 'pending', 'unverified'])
  verificationStatus!: PartnerVerificationStatus;
}
