# OrbixCity Admin Email Worker

Minimal Cloudflare Worker starter for admin notification emails. This is intended to be called by Firebase later, not by Flutter directly.

## File structure

```text
cloudflare/
  admin-email-worker/
    package.json
    README.md
    src/
      index.js
    wrangler.toml.example
```

## Endpoint design

- `GET /health`
  - Lightweight health check.
- `POST /send-admin-notification`
  - Requires `Authorization: Bearer <FIREBASE_SHARED_SECRET>`.
  - Accepts a JSON body from Firebase.
  - Sends one admin email from `info@orbixcity.com` to the verified destination address.

## Example request body

```json
{
  "eventType": "property_submitted",
  "summary": "A new property was submitted and is waiting for admin review.",
  "entityId": "prop_12345",
  "actorId": "user_67890",
  "metadata": {
    "city": "Damascus",
    "listingType": "sale"
  }
}
```

## Example Firebase call later

Firebase should call the Worker server-to-server:

```js
await fetch("https://orbixcity-admin-email-worker.<your-workers-subdomain>.workers.dev/send-admin-notification", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "authorization": `Bearer ${process.env.CF_WORKER_SHARED_SECRET}`,
  },
  body: JSON.stringify({
    eventType: "property_submitted",
    summary: "A new property was submitted and is waiting for admin review.",
    entityId: "prop_12345",
    actorId: "user_67890",
    metadata: {
      city: "Damascus",
      listingType: "sale"
    }
  }),
});
```

## Cloudflare setup steps

1. In Cloudflare for `orbixcity.com`, keep Email Routing enabled.
2. Create `info@orbixcity.com` as the custom address or sender identity you will use with Email Routing.
3. Verify the destination mailbox in Email Routing.
4. In this folder, copy `wrangler.toml.example` to `wrangler.toml`.
5. Replace `verified-destination@example.com` in `wrangler.toml` with the actual verified destination email.
6. Install dependencies with `npm install`.
7. Authenticate Wrangler with your Cloudflare account.
8. Set the shared secret with `wrangler secret put FIREBASE_SHARED_SECRET`.
9. Deploy with `npm run deploy`.
10. Keep the Worker URL private to backend use; only Firebase should hold the bearer token.

## Exact Firebase-side next integration step

Create one new Firebase server-side function or backend helper that:

1. Detects the admin-notification event you care about.
2. Builds the JSON payload.
3. Sends a `POST` request to `/send-admin-notification`.
4. Adds `Authorization: Bearer <shared-secret>` from Firebase config or Secret Manager.
5. Does not expose the Worker URL or bearer token to Flutter.

Do not wire Flutter to this endpoint directly.

## Risks and limitations

- This starter uses a shared bearer secret. It is simple, but it is not as strong as mTLS or signed request validation.
- Cloudflare Email Routing send behavior still depends on the domain sender setup being valid for `info@orbixcity.com`.
- The Worker is public on the internet, so auth is mandatory and rate limiting should be considered later.
- This starter sends a single fixed-recipient admin email path only. It does not yet support templates, retries, or queues.
- Local testing of `send_email` may be limited compared with deployed behavior.
