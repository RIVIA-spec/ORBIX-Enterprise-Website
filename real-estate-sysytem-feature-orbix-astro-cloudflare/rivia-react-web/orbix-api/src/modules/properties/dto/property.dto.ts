import { IsArray, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ListingType, PropertyType, PropertyVerificationStatus } from '../domain/property';

export class CreatePropertyDto {
  @IsString()
  partnerId!: string;

  @IsIn(['sale', 'long_term_rent'])
  listingType!: ListingType;

  @IsIn(['apartment', 'villa', 'house', 'land', 'office', 'shop', 'building', 'project'])
  propertyType!: PropertyType;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  price?: number;
}

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  addressText?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  areaSize?: number;

  @IsOptional()
  @IsString()
  areaUnit?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];
}

export class RejectPropertyDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdatePropertyVerificationDto {
  @IsIn(['verified', 'rejected', 'pending', 'unverified'])
  verificationStatus!: PropertyVerificationStatus;
}
