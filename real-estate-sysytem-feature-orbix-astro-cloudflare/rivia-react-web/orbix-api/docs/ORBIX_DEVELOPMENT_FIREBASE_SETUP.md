# Orbix Development Firebase Setup

## Environments

| Environment | Purpose | Firebase target | Allowed now |
| --- | --- | --- | --- |
| Emulator | Local persistence and integration tests | `emulator` | Yes |
| Development | Future shared Firebase project for backend development | `development` | Only after explicit approval |
| Production | Existing live Firebase project | `production` | No |

Production is blocked in code during this phase. Do not put the production Project ID in source, examples, tests, or local config.

## Required Environment Variables

| Variable | Emulator | Development | Production |
| --- | --- | --- | --- |
| `APP_ENV` | `local` | `development` | `production` |
| `DATA_BACKEND` | `memory` or `firestore` | `firestore` | `firestore` |
| `FIREBASE_TARGET` | `emulator` for Firestore emulator | `development` | `production` |
| `FIREBASE_PROJECT_ID` | `orbix-local-dev` | `replace-with-development-project-id` | not allowed in this phase |
| `FIRESTORE_EMULATOR_HOST` | `127.0.0.1:8080` | unset | unset |
| `FIREBASE_AUTH_EMULATOR_HOST` | `127.0.0.1:9099` | unset | unset |
| `ALLOW_REAL_FIREBASE` | `false` | `true` only after approval | `false` |

## Manual Project Creation

Create the future Development project manually in the Google Cloud/Firebase console under the `riviaprop.com` organization.

Suggested display name: `Orbix Development`.

Before creating Firestore for Development, confirm the Firestore location used by Production. Choose a Development location deliberately; do not guess.

Do not copy users, Firestore documents, Storage files, Auth exports, or operational data from Production into Development.

Do not register Android, iOS, or Web apps now. Client app registration needs a separate decision.

## Credentials

Use Application Default Credentials in future deployed environments. Do not create, download, or commit Service Account JSON keys.

Real Firebase access requires both:

- `FIREBASE_TARGET=development`
- `ALLOW_REAL_FIREBASE=true`

The application also requires an explicit `FIREBASE_PROJECT_ID`; it must not infer a real project from gcloud or ADC.

## Firestore Rules And Indexes

Rules and indexes can be deployed to Development only after explicit approval:

```bash
npm run check:firebase:development
npm run deploy:firestore:development
```

The deploy script targets only Firestore rules and indexes and passes `--project` explicitly. It does not deploy Hosting, Functions, Storage, or Cloud Run.

Do not run `firebase deploy` directly.

## Rollback

Before changing rules or indexes:

1. Record the current Git commit.
2. Review `firestore.rules` and `firestore.indexes.json`.
3. Deploy only to Development.
4. Run backend integration tests against Emulator and a manual Development smoke test.

Rollback plan:

1. Revert the rules/indexes commit.
2. Re-run `npm run check:firebase:development`.
3. Re-run the Firestore-only deploy command.
4. Confirm reads/writes are still blocked from Firebase Client SDK where required.

## Budget Alert

Before any shared Development project is used, configure a Google Cloud budget alert under the organization billing account.
