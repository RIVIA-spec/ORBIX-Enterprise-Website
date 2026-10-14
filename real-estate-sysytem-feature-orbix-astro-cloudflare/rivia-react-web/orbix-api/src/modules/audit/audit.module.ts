import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import { AuditService } from './audit.service';
import { InMemoryAuditRepository } from './repositories/in-memory-audit.repository';
import { AUDIT_REPOSITORY } from './repositories/audit.repository';
import { FirestoreAuditRepository } from './repositories/firestore-audit.repository';
import { FirebaseModule } from '../firebase/firebase.module';
import { FIREBASE_APP } from '../firebase/firebase.constants';

@Module({
  imports: [FirebaseModule],
  providers: [
    AuditService,
    InMemoryAuditRepository,
    {
      provide: AUDIT_REPOSITORY,
      inject: [ConfigService, InMemoryAuditRepository, FIREBASE_APP],
      useFactory: (config: ConfigService, memory: InMemoryAuditRepository, app: App | null) => {
        if (config.get<string>('app.dataBackend') !== 'firestore') return memory;
        if (!app) throw new Error('Firestore audit repository requires Firebase Admin');
        return new FirestoreAuditRepository(app);
      }
    }
  ],
  exports: [AuditService]
})
export class AuditModule {}
