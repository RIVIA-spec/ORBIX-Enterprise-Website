import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import { AuditModule } from '../audit/audit.module';
import { FIREBASE_APP } from '../firebase/firebase.constants';
import { IdentityModule } from '../identity/identity.module';
import { PartnersService } from './application/partners.service';
import { PARTNER_MEMBER_REPOSITORY, PARTNER_REPOSITORY } from './domain/partner.repository';
import { InMemoryPartnerMemberRepository, InMemoryPartnerRepository } from './infrastructure/in-memory-partner.repository';
import { FirestorePartnerMemberRepository, FirestorePartnerRepository } from './infrastructure/firestore-partner.repository';
import { PartnersController } from './presentation/partners.controller';

@Module({
  imports: [AuditModule, IdentityModule],
  controllers: [PartnersController],
  providers: [
    PartnersService,
    InMemoryPartnerRepository,
    InMemoryPartnerMemberRepository,
    {
      provide: PARTNER_REPOSITORY,
      inject: [ConfigService, InMemoryPartnerRepository, FIREBASE_APP],
      useFactory: (config: ConfigService, memory: InMemoryPartnerRepository, app: App | null) => {
        if (config.get<string>('app.dataBackend') !== 'firestore') return memory;
        if (!app) throw new Error('Firestore partners repository requires Firebase Admin');
        return new FirestorePartnerRepository(app);
      }
    },
    {
      provide: PARTNER_MEMBER_REPOSITORY,
      inject: [ConfigService, InMemoryPartnerMemberRepository, FIREBASE_APP],
      useFactory: (config: ConfigService, memory: InMemoryPartnerMemberRepository, app: App | null) => {
        if (config.get<string>('app.dataBackend') !== 'firestore') return memory;
        if (!app) throw new Error('Firestore partner member repository requires Firebase Admin');
        return new FirestorePartnerMemberRepository(app);
      }
    }
  ],
  exports: [PartnersService]
})
export class PartnersModule {}
