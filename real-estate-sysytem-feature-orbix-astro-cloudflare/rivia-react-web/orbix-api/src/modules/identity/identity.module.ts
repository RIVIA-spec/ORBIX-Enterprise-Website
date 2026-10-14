import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { InMemoryUserProfileRepository } from './repositories/in-memory-user-profile.repository';
import { USER_PROFILE_REPOSITORY } from './repositories/user-profile.repository';

@Module({
  controllers: [IdentityController],
  providers: [
    IdentityService,
    FirebaseAuthGuard,
    RolesGuard,
    InMemoryUserProfileRepository,
    {
      provide: USER_PROFILE_REPOSITORY,
      useExisting: InMemoryUserProfileRepository
    }
  ],
  exports: [IdentityService, FirebaseAuthGuard, RolesGuard]
})
export class IdentityModule {}
