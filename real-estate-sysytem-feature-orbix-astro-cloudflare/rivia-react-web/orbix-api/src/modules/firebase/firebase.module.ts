import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type AppOptions
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { decodeFirebaseServiceAccountBase64 } from '../../config/firebase-credential';
import { FIREBASE_APP } from './firebase.constants';
import { FirebaseTokenVerifier } from './firebase-token-verifier.service';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_APP,
      inject: [ConfigService],
      useFactory: (config: ConfigService): App | null => {
        const dataBackend = config.get<string>('app.dataBackend');
        const firebaseTarget = config.get<string>('app.firebase.target');

        if (dataBackend === 'memory' && !firebaseTarget) {
          return null;
        }

        const existing = getApps()[0];

        if (existing) {
          return existing;
        }

        const projectId = config.get<string>('app.firebase.projectId');

        if (!projectId) {
          throw new Error(
            'Firebase Admin initialization requires FIREBASE_PROJECT_ID'
          );
        }

        const credentialSource =
          config.get<string>('app.firebase.credentialSource') ?? 'adc';
        const options: AppOptions = { projectId };

        if (credentialSource === 'base64') {
          if (firebaseTarget !== 'development') {
            throw new Error(
              'Base64 Firebase credentials are allowed only for Development'
            );
          }

          const developmentProjectId = config.get<string>(
            'app.firebase.developmentProjectId'
          );

          if (
            !developmentProjectId ||
            projectId !== developmentProjectId
          ) {
            throw new Error(
              'Firebase Admin projectId does not match the Development project'
            );
          }

          const serviceAccount =
            decodeFirebaseServiceAccountBase64(
              config.get<string>(
                'app.firebase.serviceAccountJsonBase64'
              )
            );

          if (serviceAccount.projectId !== developmentProjectId) {
            throw new Error(
              'Firebase service account project_id does not match the Development project'
            );
          }

          options.credential = cert({
            projectId: serviceAccount.projectId,
            clientEmail: serviceAccount.clientEmail,
            privateKey: serviceAccount.privateKey
          });
        } else if (credentialSource !== 'adc') {
          throw new Error('Unsupported Firebase credential source');
        }

        const app = initializeApp(options);

        if (app.options.projectId !== projectId) {
          throw new Error(
            'Firebase Admin projectId does not match FIREBASE_PROJECT_ID'
          );
        }

        return app;
      }
    },
    {
      provide: FirebaseTokenVerifier,
      inject: [FIREBASE_APP],
      useFactory: (app: App | null): FirebaseTokenVerifier =>
        app
          ? new FirebaseTokenVerifier(getAuth(app))
          : ({
              verifyIdToken: () =>
                Promise.reject(
                  new Error('Firebase Admin is not configured')
                )
            } as unknown as FirebaseTokenVerifier)
    }
  ],
  exports: [FIREBASE_APP, FirebaseTokenVerifier]
})
export class FirebaseModule {}
