# Firebase Setup

## Production

Do not use the production Firebase project for feature experiments or automated tests.

Cloud Run uses Application Default Credentials from its attached runtime service account.
Do not create service account JSON files and do not put Firebase private keys in `.env` files.

## Local Development

Use Firebase Emulator where possible:

```bash
firebase emulators:start --only auth,firestore
```

Set:

```bash
APP_ENV=local
DATA_BACKEND=firestore
FIREBASE_TARGET=emulator
ALLOW_REAL_FIREBASE=false
FIREBASE_PROJECT_ID=orbix-local-dev
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

For Phase 3-A Firestore persistence tests use:

```bash
DATA_BACKEND=firestore
FIREBASE_TARGET=emulator
FIREBASE_PROJECT_ID=orbix-local-dev
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

Real Firebase targets require `FIREBASE_TARGET=development`, an explicit non-placeholder `FIREBASE_PROJECT_ID`, and `ALLOW_REAL_FIREBASE=true`.
`FIREBASE_TARGET=production` is rejected in this phase.

Firebase Admin SDK bypasses Firestore Security Rules. Authorization checks must stay in NestJS guards and application services.

## Credentials

Do not create or commit service account JSON files.

For deployed environments, use Application Default Credentials. Set `FIREBASE_PROJECT_ID`
only when the runtime cannot infer the intended project.

The Firebase emulator does not require service account key environment variables.

## Access Rule

React uses Firebase Client SDK only for login/logout and token retrieval. Sensitive reads/writes go through NestJS.
