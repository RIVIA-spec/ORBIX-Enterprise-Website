# Transactions, Contracts, and Commission Setup

Do not store DocuSeal or Stripe secrets in Flutter, Git, or tracked config files.

## Firebase Functions Secrets

The project owner should set these secrets manually:

```bash
firebase functions:secrets:set DOCUSEAL_API_KEY
firebase functions:secrets:set DOCUSEAL_WEBHOOK_SECRET
firebase functions:secrets:set DOCUSEAL_TEMPLATE_DIRECT_PARTY_CONTRACT_ID
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

## DocuSeal

Create one Cloud template for direct party contracts with exactly these roles:

- `Party A`
- `Party B`

Configure the webhook URL to the deployed `docusealWebhook` endpoint. The webhook secret must match `DOCUSEAL_WEBHOOK_SECRET`. Signing URLs are returned only from callable Functions and are not stored in Firestore.

## Stripe

Configure a Stripe webhook to the deployed `stripeWebhook` endpoint and subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Stripe is used only for Orbix commission checkout. Property prices, rents, hotel booking totals, payouts, Connect, and escrow are out of scope for this MVP.
