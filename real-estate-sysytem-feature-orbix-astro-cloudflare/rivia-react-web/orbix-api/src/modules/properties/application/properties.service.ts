import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { AuditService } from '../../audit/audit.service';
import { PartnersService } from '../../partners/application/partners.service';
import type { Property, PropertyVerificationStatus } from '../domain/property';
import { PROPERTY_REPOSITORY, type PropertyRepository } from '../domain/property.repository';
import type { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PROPERTY_REPOSITORY) private readonly properties: PropertyRepository,
    private readonly partners: PartnersService,
    private readonly audit: AuditService
  ) {}

  listPublic(limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }> {
    return this.properties.listPublished(limit, cursor);
  }

  async getPublic(id: string): Promise<Property> {
    const property = await this.get(id);
    if (property.status !== 'published') throw new NotFoundException('Property not found');
    return property;
  }

  async get(id: string): Promise<Property> {
    const property = await this.properties.findById(id);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async getPublishedForLeads(id: string): Promise<Property> {
    return this.getPublic(id);
  }

  async create(user: AuthenticatedUser, dto: CreatePropertyDto): Promise<Property> {
    await this.partners.requireMembership(dto.partnerId, user, ['owner', 'manager', 'agent', 'content_editor']);
    const now = new Date();
    return this.properties.create({
      id: randomUUID(),
      partnerId: dto.partnerId,
      ownerUid: user.uid,
      listingType: dto.listingType,
      propertyType: dto.propertyType,
      title: dto.title,
      description: dto.description,
      city: dto.city,
      price: dto.price,
      features: [],
      mediaIds: [],
      status: 'draft',
      verificationStatus: 'unverified',
      createdAt: now,
      updatedAt: now
    });
  }

  async listByPartner(user: AuthenticatedUser, partnerId: string, limit: number, cursor?: string) {
    await this.partners.requireMembership(partnerId, user);
    return this.properties.listByPartner(partnerId, limit, cursor);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdatePropertyDto): Promise<Property> {
    const property = await this.get(id);
    await this.partners.requireMembership(property.partnerId, user, ['owner', 'manager', 'agent', 'content_editor']);
    const status = property.status === 'published' ? 'pending_review' : property.status;
    return this.properties.save({ ...property, ...dto, status, updatedAt: new Date(), publishedAt: status === 'pending_review' ? undefined : property.publishedAt });
  }

  async submit(user: AuthenticatedUser, id: string): Promise<Property> {
    const property = await this.get(id);
    await this.partners.requireMembership(property.partnerId, user, ['owner', 'manager', 'agent', 'content_editor']);
    if (!property.title || !property.city || property.price === undefined || !property.listingType || !property.propertyType) {
      throw new BadRequestException('Property is missing required publish fields');
    }
    if (property.status !== 'draft') throw new ConflictException('Invalid property status transition');
    return this.properties.save({ ...property, status: 'pending_review', verificationStatus: 'pending', updatedAt: new Date() });
  }

  async archive(user: AuthenticatedUser, id: string): Promise<Property> {
    const property = await this.get(id);
    await this.partners.requireMembership(property.partnerId, user, ['owner', 'manager']);
    if (property.status !== 'published') throw new ConflictException('Invalid property status transition');
    return this.properties.save({ ...property, status: 'archived', updatedAt: new Date() });
  }

  pending(limit: number, cursor?: string) {
    return this.properties.listPending(limit, cursor);
  }

  async publish(user: AuthenticatedUser, id: string): Promise<Property> {
    if (!user.roles.includes('admin') && !user.roles.includes('moderator')) throw new ForbiddenException('Moderator role required');
    const property = await this.get(id);
    if (property.status !== 'pending_review') throw new ConflictException('Invalid property status transition');
    const updated = await this.properties.save({ ...property, status: 'published', publishedAt: new Date(), updatedAt: new Date() });
    await this.audit.append({ actorUid: user.uid, action: 'property.published', resourceType: 'property', resourceId: id });
    return updated;
  }

  async reject(user: AuthenticatedUser, id: string, reason?: string): Promise<Property> {
    if (!user.roles.includes('admin') && !user.roles.includes('moderator')) throw new ForbiddenException('Moderator role required');
    const property = await this.get(id);
    if (property.status !== 'pending_review') throw new ConflictException('Invalid property status transition');
    const updated = await this.properties.save({ ...property, status: 'rejected', updatedAt: new Date() });
    await this.audit.append({ actorUid: user.uid, action: 'property.rejected', resourceType: 'property', resourceId: id, metadata: { reason } });
    return updated;
  }

  async updateVerification(user: AuthenticatedUser, id: string, verificationStatus: PropertyVerificationStatus): Promise<Property> {
    if (!user.roles.includes('admin') && !user.roles.includes('moderator')) throw new ForbiddenException('Moderator role required');
    const property = await this.get(id);
    const updated = await this.properties.save({ ...property, verificationStatus, updatedAt: new Date() });
    await this.audit.append({ actorUid: user.uid, action: 'property.verification_updated', resourceType: 'property', resourceId: id, metadata: { verificationStatus } });
    return updated;
  }
}
