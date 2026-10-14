# Security Model

## Principles

- React never decides roles or sensitive business state.
- NestJS is the only trusted layer for sensitive operations.
- Controllers do not access Firestore directly.
- Firebase access is behind interfaces and repositories.
- All input DTOs must pass validation.
- Production is not used for development tests.
- No secrets or service account JSON files are committed.

## Authentication

Clients send:

```http
Authorization: Bearer <firebase-id-token>
```

`FirebaseAuthGuard` verifies the token with Firebase Admin SDK and attaches a server-built `AuthenticatedUser` to the request.

## Authorization

`RolesGuard` reads roles from the authenticated server-side user. Roles must come from trusted sources:

- Firebase Custom Claims.
- Server-owned user profile repository.

Never trust roles sent in request body, query params, local storage, or arbitrary headers.

## Initial Roles

- `customer`
- `partner`
- `partner_staff`
- `moderator`
- `admin`

## Audit

`AuditModule` is present as a skeleton. Booking, payment, commission, and admin mutations must write audit events when those modules are implemented.

## Error Handling

`AllExceptionsFilter` returns a consistent error envelope with:

- `statusCode`
- `message`
- `error`
- `requestId`
- `path`
- `timestamp`

Internal exception details are not exposed for unexpected server errors.
