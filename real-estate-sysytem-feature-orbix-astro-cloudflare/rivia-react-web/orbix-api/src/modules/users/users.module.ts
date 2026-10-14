import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import { FIREBASE_APP } from '../firebase/firebase.constants';
import { AuditModule } from '../audit/audit.module';
import { IdentityModule } from '../identity/identity.module';
import { UsersService } from './application/users.service';
import { USER_PROFILE_REPOSITORY_V2 } from './domain/user-profile.repository';
import { InMemoryUserProfileRepositoryV2 } from './infrastructure/in-memory-user-profile.repository';
import { FirestoreUserProfileRepository } from './infrastructure/firestore-user-profile.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [AuditModule, IdentityModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    InMemoryUserProfileRepositoryV2,
    {
      provide: USER_PROFILE_REPOSITORY_V2,
      inject: [ConfigService, InMemoryUserProfileRepositoryV2, FIREBASE_APP],
      useFactory: (config: ConfigService, memory: InMemoryUserProfileRepositoryV2, app: App | null) => {
        if (config.get<string>('app.dataBackend') !== 'firestore') return memory;
        if (!app) throw new Error('Firestore users repository requires Firebase Admin');
        return new FirestoreUserProfileRepository(app);
      }
    }
  ],
  exports: [UsersService]
})
export class UsersModule {}
