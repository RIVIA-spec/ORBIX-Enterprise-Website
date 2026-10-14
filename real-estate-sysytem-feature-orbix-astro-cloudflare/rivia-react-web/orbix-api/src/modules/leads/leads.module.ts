import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import { AuditModule } from '../audit/audit.module';
import { FIREBASE_APP } from '../firebase/firebase.constants';
import { IdentityModule } from '../identity/identity.module';
import { PartnersModule } from '../partners/partners.module';
import { PropertiesModule } from '../properties/properties.module';
import { LeadsService } from './application/leads.service';
import { LEAD_REPOSITORY } from './domain/lead.repository';
import { InMemoryLeadRepository } from './infrastructure/in-memory-lead.repository';
import { FirestoreLeadRepository } from './infrastructure/firestore-lead.repository';
import { LeadsController } from './presentation/leads.controller';

@Module({
  imports: [AuditModule, IdentityModule, PartnersModule, PropertiesModule],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    InMemoryLeadRepository,
    {
      provide: LEAD_REPOSITORY,
      inject: [ConfigService, InMemoryLeadRepository, FIREBASE_APP],
      useFactory: (config: ConfigService, memory: InMemoryLeadRepository, app: App | null) => {
        if (config.get<string>('app.dataBackend') !== 'firestore') return memory;
        if (!app) throw new Error('Firestore leads repository requires Firebase Admin');
        return new FirestoreLeadRepository(app);
      }
    }
  ]
})
export class LeadsModule {}
