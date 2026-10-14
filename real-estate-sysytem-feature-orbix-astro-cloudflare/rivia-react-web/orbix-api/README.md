# Orbix API

NestJS Modular Monolith API for Orbix.

## Scope

This project contains phase one only:

- Health endpoint.
- Firebase Admin initialization.
- Firebase ID Token guard.
- Current user decorator.
- Roles decorator and guard.
- Global validation.
- Unified exception filter.
- Helmet and CORS.
- Request ID and basic request logging.
- Audit module skeleton.
- Swagger in development only.

It does not implement Properties, Partners, Leads, Bookings, Payments, PostgreSQL, R2, Qdrant, or Cloud Run deployment.

## Requirements

- Node.js 20+ recommended.
- npm.
- Firebase Emulator Suite for local auth/firestore testing.

## Setup

```bash
npm install
cp .env.example .env
npm run start:dev
```

The API defaults to `http://localhost:4000`.

Swagger is available at `/docs` only when:

- `NODE_ENV=development`
- `SWAGGER_ENABLED=true`

## Verification

```bash
npm run build
npm run lint
npm test
```

## Environment Variables

See `.env.example`. Do not commit real service account values.
