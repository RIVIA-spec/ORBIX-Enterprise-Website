import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import { AuditModule } from '../audit/audit.module';
import { FIREBASE_APP } from '../firebase/firebase.constants';
import { IdentityModule } from '../identity/identity.module';
import { PartnersModule } from '../partners/partners.module';
import { PropertiesService } from './application/properties.service';
import { PROPERTY_REPOSITORY } from './domain/property.repository';
import { InMemoryPropertyRepository } from './infrastructure/in-memory-property.repository';
import { FirestorePropertyRepository } from './infrastructure/firestore-property.repository';
import { PropertiesController } from './presentation/properties.controller';

@Module({
  imports: [AuditModule, IdentityModule, PartnersModule],
  controllers: [PropertiesController],
  providers: [
    PropertiesService,
    InMemoryPropertyRepository,
    {
      provide: PROPERTY_REPOSITORY,
      inject: [ConfigService, InMemoryPropertyRepository, FIREBASE_APP],
      useFactory: (config: ConfigService, memory: InMemoryPropertyRepository, app: App | null) => {
        if (config.get<string>('app.dataBackend') !== 'firestore') return memory;
        if (!app) throw new Error('Firestore properties repository requires Firebase Admin');
        return new FirestorePropertyRepository(app);
      }
    }
  ],
  exports: [PropertiesService]
})
export class PropertiesModule {}
