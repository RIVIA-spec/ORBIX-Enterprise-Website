# API Routes

## Public Routes

### GET /health

Returns API health.

Example response:

```json
{
  "status": "ok",
  "service": "orbix-api",
  "timestamp": "2026-08-18T00:00:00.000Z"
}
```

## Authenticated Routes

### GET /auth/me

Requires:

```http
Authorization: Bearer <firebase-id-token>
```

## Phase 2

All routes use `/api/v1`.

### Users

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:uid`
- `PATCH /api/v1/admin/users/:uid/status`
- `PATCH /api/v1/admin/users/:uid/role`

### Partners

- `POST /api/v1/partners`
- `GET /api/v1/partners/my`
- `GET /api/v1/partners/:id`
- `PATCH /api/v1/partners/:id`
- `POST /api/v1/partners/:id/submit`
- `POST /api/v1/partners/:id/members`
- `GET /api/v1/partners/:id/members`
- `PATCH /api/v1/partners/:id/members/:memberId`
- `DELETE /api/v1/partners/:id/members/:memberId`
- `PATCH /api/v1/admin/partners/:id/verification`

### Properties

- `GET /api/v1/properties`
- `GET /api/v1/properties/:id`
- `POST /api/v1/properties`
- `GET /api/v1/partners/:partnerId/properties`
- `PATCH /api/v1/properties/:id`
- `POST /api/v1/properties/:id/submit`
- `POST /api/v1/properties/:id/archive`
- `GET /api/v1/admin/properties/pending`
- `POST /api/v1/admin/properties/:id/publish`
- `POST /api/v1/admin/properties/:id/reject`
- `PATCH /api/v1/admin/properties/:id/verification`

### Leads

- `POST /api/v1/leads`
- `GET /api/v1/leads/my`
- `GET /api/v1/partners/:partnerId/leads`
- `GET /api/v1/leads/:id`
- `PATCH /api/v1/leads/:id/status`
- `PATCH /api/v1/leads/:id/assign`

Returns the authenticated Firebase user mapped to Orbix roles.

Example response:

```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "emailVerified": true,
  "roles": ["customer"]
}
```

## Not Implemented In Phase One

- Properties.
- Partners.
- Leads.
- Bookings.
- Payments.
- Commissions.
- Virtual tours.
- Strapi content proxy.
