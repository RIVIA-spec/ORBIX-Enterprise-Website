import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { FirebaseAuthGuard } from '../../identity/guards/firebase-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { AssignLeadDto, CreateLeadDto, UpdateLeadStatusDto } from '../dto/lead.dto';
import { LeadsService } from '../application/leads.service';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller()
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post('leads')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLeadDto) {
    return this.leads.create(user, dto);
  }

  @Get('leads/my')
  my(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.leads.my(user, Math.min(Number(limit ?? 20), 100), cursor);
  }

  @Get('partners/:partnerId/leads')
  partnerLeads(@CurrentUser() user: AuthenticatedUser, @Param('partnerId') partnerId: string, @Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.leads.partnerLeads(user, partnerId, Math.min(Number(limit ?? 20), 100), cursor);
  }

  @Get('leads/:id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leads.get(user, id);
  }

  @Patch('leads/:id/status')
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.leads.updateStatus(user, id, dto.status);
  }

  @Patch('leads/:id/assign')
  assign(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: AssignLeadDto) {
    return this.leads.assign(user, id, dto.assignedToUid);
  }
}
