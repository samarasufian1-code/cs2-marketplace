# Dynamic Market production roadmap

## Current state

- Steam login, public inventory preview, market reference prices, marketplace listings, private support tickets, language selection, and an online-session count are implemented.
- Demo wallet funding remains development-only.
- Steam item transfers, real payments, purchase bots, and sale bots are disabled.

## Steam trading

Use a reviewed Steam trade-offer provider or a controlled bot service. The provider must:

1. Create offers only after the marketplace records an unpaid order.
2. Verify the offer and item asset IDs on the server, not from browser input.
3. Receive signed webhooks and make fulfillment idempotent.
4. Never request a user's Steam password, Steam Guard code, or session cookie.
5. Keep bot credentials outside the repository and rotate them.

Set `STEAM_TRADE_PROVIDER=enabled` only after the provider implementation and callback verification are complete. The current gateway intentionally reports disabled/provider-required and does not transfer items.

## Payments

Choose a payment processor that supports webhooks and refunds. Treat the provider webhook as the source of truth; never mark a deposit paid from a browser redirect. Store provider event IDs with a unique index to prevent duplicate credits. Keep the current demo deposit disabled in production.

## Bots

Enable purchase or sale automation only after trade settlement, payment settlement, fraud checks, rate limits, and manual cancellation paths are complete. Bots must not operate from browser credentials or accept arbitrary asset IDs without ownership and offer verification.

## Deployment checklist

- Use HTTPS and a real `BASE_URL`.
- Set a random `SESSION_SECRET` of at least 32 characters.
- Use a hosted MongoDB with authentication, network restrictions, backups, and TLS.
- Set `NODE_ENV=production`; test that demo deposits and private test listings return unavailable.
- Keep `.env` out of version control and use `.env.example` as a template only.
- Add centralized logs and alerts for failed webhooks, failed rollbacks, and repeated rate-limit violations.
- Run `npm.cmd test` and a staging smoke test before each release.
