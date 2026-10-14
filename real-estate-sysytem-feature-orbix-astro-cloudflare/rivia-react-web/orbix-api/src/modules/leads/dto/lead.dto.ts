import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { LeadSource, LeadStatus, LeadType } from '../domain/lead';

export class CreateLeadDto {
  @IsIn(['property_inquiry', 'viewing_request', 'partnership_request'])
  type!: LeadType;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  partnerId?: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsIn(['web', 'mobile', 'admin', 'campaign', 'organic'])
  source!: LeadSource;
}

export class UpdateLeadStatusDto {
  @IsIn(['new', 'contacted', 'qualified', 'closed', 'rejected'])
  status!: LeadStatus;
}

export class AssignLeadDto {
  @IsString()
  assignedToUid!: string;
}
