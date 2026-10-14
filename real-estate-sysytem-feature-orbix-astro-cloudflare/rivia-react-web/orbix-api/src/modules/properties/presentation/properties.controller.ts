import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { FirebaseAuthGuard } from '../../identity/guards/firebase-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { PropertiesService } from '../application/properties.service';
import { CreatePropertyDto, RejectPropertyDto, UpdatePropertyDto, UpdatePropertyVerificationDto } from '../dto/property.dto';

@ApiTags('properties')
@Controller()
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get('properties')
  list(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.properties.listPublic(Math.min(Number(limit ?? 20), 100), cursor);
  }

  @Get('properties/:id')
  get(@Param('id') id: string) {
    return this.properties.getPublic(id);
  }

  @Post('properties')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePropertyDto) {
    return this.properties.create(user, dto);
  }

  @Get('partners/:partnerId/properties')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  listPartner(@CurrentUser() user: AuthenticatedUser, @Param('partnerId') partnerId: string, @Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.properties.listByPartner(user, partnerId, Math.min(Number(limit ?? 20), 100), cursor);
  }

  @Patch('properties/:id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.properties.update(user, id, dto);
  }

  @Post('properties/:id/submit')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.properties.submit(user, id);
  }

  @Post('properties/:id/archive')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.properties.archive(user, id);
  }

  @Get('admin/properties/pending')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  pending(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.properties.pending(Math.min(Number(limit ?? 20), 100), cursor);
  }

  @Post('admin/properties/:id/publish')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.properties.publish(user, id);
  }

  @Post('admin/properties/:id/reject')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: RejectPropertyDto) {
    return this.properties.reject(user, id, dto.reason);
  }

  @Patch('admin/properties/:id/verification')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  verification(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePropertyVerificationDto) {
    return this.properties.updateVerification(user, id, dto.verificationStatus);
  }
}
