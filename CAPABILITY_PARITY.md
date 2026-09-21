# Dynamoi MCP capability parity

## Release truth

The September 21, 2026 source snapshot does **not** implement 100% dashboard,
iOS, Android and MCP workflow parity. Universal client registration and full
catalog access are authorization capabilities, not evidence of workflow parity.
The canonical catalog owner is `getDynamoiToolDefinitions` in
`src/server/create-server.ts`; do not maintain a second availability registry here.

The snapshot has 27 registered tools and 17 in the restricted profile. A verified
client with user-granted `dynamoi:mcp.full` receives the full catalog irrespective
of vendor or client-ID format. Each call still requires its domain scopes and
resource RBAC. Anonymous discovery remains restricted and cannot execute tools.

## Implemented boundaries and gaps

| Family | Existing agent surface | Not equivalent or still missing |
| --- | --- | --- |
| Account/artist orientation | Account overview, roster and single-artist reads | Organization invites/roles, full artist settings and account deletion |
| Smart Links | Spotify ingestion, list/detail, description, artist theme/pixels, per-link analytics and theme previews | Full studio/availability controls, every field, aggregate analytics and promotion request workflow |
| Campaigns | List/detail, provider analytics, readiness, existing-asset launch, pause/resume and eligible single-provider budgets | Draft state machines, source uploads, creative generation/selection/approval, screening, existing targeting edits and multi-provider budgets |
| Analytics | Campaign-provider rollups and per-link analytics | Feature.fm audience, Soundcharts playlists, growth audit and artist-wide Smart Link aggregation |
| Connections | Meta and YouTube browser OAuth handoffs and status reads | Headless provider login, owner selection or bypass of ownership verification |
| Distribution | Five scored requirements, application state and explicit adult-attested application submission for manual review | Agreement execution, release intake/catalog, rights/splits, royalties, tax, payout and takedown workflows |
| Billing and Shop | Managed billing observations; full-profile Shop quote and unpaid Stripe checkout creation | Managed subscription changes, invoice/funding workflows or agent payment settlement. Shop checkout is not a campaign launch or paid order. |

A real campaign launch or budget edit first returns a signed, five-minute
`confirmation_required` proposal with exact customer budget, USD currency and
targeting. No financial mutation occurs at that stage. The host must obtain human
approval and repeat unchanged inputs with the receipt. The receipt is not proof
of a human click, not a payment/funding grant and not a durable idempotency store.
Existing owners retain RBAC, spending authority and idempotency checks. Demo
responses remain simulations with no provider, billing or campaign effects.

The native parity manifest is itself incomplete: planned/partial entries must
not be presented as completed mobile behavior. StoreKit, Play Billing, APNs and
native session mechanics are client-specific implementations; removing them from
an agent operation count does not make the underlying commerce journey complete.

## Protocol boundary

CIMD uses the `mcp-2026-07-28` metadata profile. That does not certify the server's
entire 2026-07-28 wire protocol: the existing SDK/transport still uses initialize
and the earlier request lifecycle. JSON and SSE POST negotiation, authentication
challenges and discovery must be tested against the deployed edge and origin.
Authenticated GET currently returns 405; it is not a standalone SSE subscription
channel. Do not advertise universal host compatibility without host journey tests.
