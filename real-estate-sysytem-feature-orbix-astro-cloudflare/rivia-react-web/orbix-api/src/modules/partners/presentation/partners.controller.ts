import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { FirebaseAuthGuard } from '../../identity/guards/firebase-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { PartnersService } from '../application/partners.service';
import { AddPartnerMemberDto, CreatePartnerDto, UpdatePartnerDto, UpdatePartnerMemberDto, UpdatePartnerVerificationDto } from '../dto/partner.dto';

@ApiTags('partners')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller()
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Post('partners')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePartnerDto) {
    return this.partners.create(user, dto);
  }

  @Get('partners/my')
  my(@CurrentUser() user: AuthenticatedUser) {
    return this.partners.my(user);
  }

  @Get('partners/:id')
  get(@Param('id') id: string) {
    return this.partners.get(id);
  }

  @Patch('partners/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partners.update(user, id, dto);
  }

  @Post('partners/:id/submit')
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.partners.submit(user, id);
  }

  @Post('partners/:id/members')
  addMember(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: AddPartnerMemberDto) {
    return this.partners.addMember(user, id, dto);
  }

  @Get('partners/:id/members')
  members(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.partners.listMembers(user, id);
  }

  @Patch('partners/:id/members/:memberId')
  updateMember(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: UpdatePartnerMemberDto) {
    return this.partners.updateMember(user, id, memberId, dto);
  }

  @Delete('partners/:id/members/:memberId')
  removeMember(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.partners.removeMember(user, id, memberId);
  }

  @Patch('admin/partners/:id/verification')
  @Roles('admin', 'moderator')
  updateVerification(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePartnerVerificationDto) {
    return this.partners.updateVerification(user, id, dto.verificationStatus);
  }
}
