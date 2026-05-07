# ADR 0012: Legal Copy Source

**Status:** Active
**Date:** 2026-05-07
**Decision:** Termly for Privacy Policy + Terms of Service. Use Termly's hosted URLs at first; migrate to `blockmerge.app/privacy` + `/terms` via Cloudflare Pages once a production domain is ready.

## Context

Phase 3 left placeholders at `assets/legal/{privacy-policy,terms-of-service}.md` and `app.json` points to `https://blockmerge.app/{privacy,terms}` URLs that 404. App Store Connect requires non-404 privacy URLs for any subscription product.

Three options:

| Option | Cost | Speed | Quality |
|---|---|---|---|
| Termly subscription | $99/yr | 1 hour to live | High — generated from a questionnaire matching CCPA/GDPR/UK-DPA |
| Generic template (TermsFeed, Iubenda free tier) | $0 | 30 min | Medium — boilerplate, may miss subscription-specific clauses |
| Law firm | $1.5–4k | 2–4 weeks | Highest — bespoke |

## Decision

**Termly** for v1. Reasons:
1. Speed — we need URLs live before App Store submission. Termly delivers in an hour.
2. Coverage — Termly's questionnaire asks the right questions for our stack (subscriptions, anonymous auth, RevenueCat, PostHog, Firebase, Sentry). Generic templates miss this.
3. Cost — $99/yr is negligible vs. delaying launch.
4. Replaceable — when MRR justifies a real lawyer (post-launch, ~$10k MRR), we swap in their copy. URL stays the same.

## Setup procedure (manual user task)

1. Sign up at https://termly.io with the company email used for App Store Connect.
2. Use Termly's questionnaire to generate:
   - Privacy Policy
   - Terms of Service
3. Each generated document gets a permanent URL like `https://app.termly.io/policy-viewer/policy.html?policyUUID=xxxxxxxx`.
4. Either:
   - **(Phase 4 default)** Use Termly's hosted URLs directly. Update `app.json`'s `privacyPolicyUrl` and `termsOfServiceUrl` to those URLs. App Store Connect accepts them.
   - **(Post-launch)** Set up `blockmerge.app/privacy` and `/terms` as redirects on Cloudflare Pages or Netlify. Termly provides an embeddable iframe + auto-update mechanism.

For Phase 4 we do option (a) — fastest path to non-404 URLs.

## Consequences

- T11 of the Phase 4 plan replaces `app.json`'s placeholder URLs with the Termly URLs once the user generates them.
- The `assets/legal/*.md` stubs are deleted (no longer authoritative).
- `settings.tsx`'s `Linking.openURL(...)` calls also update to the Termly URLs.

## Revisit if

MRR > $10k/month (real lawyer becomes worth it) or a regulatory change requires bespoke language.
