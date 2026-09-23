# Dynamoi MCP capability parity

## Release truth

The 1.0.0 source (September 23, 2026) does **not** implement 100% dashboard,
iOS, Android and MCP workflow parity. Universal client registration and full
catalog access are authorization capabilities, not evidence of workflow parity.
The canonical catalog owner is `getDynamoiToolDefinitions` in
`src/server/create-server.ts`; do not maintain a second availability registry here.

The package registers 28 tools. The directory profile serves 18 of them: the
review-safe catalog for recognized agent-directory clients. On `/mcp`, the host
picks the profile from the verified OAuth client ID; `/mcp/directory` always
serves the directory profile. Every other authenticated client on `/mcp`
gets the full profile, whatever its vendor or client-ID format. Each call still
requires its own scopes and resource RBAC; the Shop tools also require
`dynamoi:mcp.full`. Unauthenticated requests get the directory profile, where
only discovery methods, the public `dynamoi_about` tool and the
`dynamoi://about` resource work. Everything else is refused.

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

A real campaign launch, budget edit or pause/resume runs the same shared
backend functions as web and mobile. Operations that need automatic daily card
funding — daily-budget launches and budget updates, and resumes of campaigns
that require card funding — must carry the funding-consent fields
(`authorizeAutomaticDailyFunding` with the exact `acceptedConsentVersion` and
`acceptedConsentCopyHash`, plus `clientRequestId`) after the user is shown the
consent copy; without them the shared path refuses before any provider call.
Existing owners retain RBAC, spending authority and idempotency checks. Demo
responses remain simulations with no provider, billing or campaign effects.

The native parity manifest is itself incomplete: planned/partial entries must
not be presented as completed mobile behavior. StoreKit, Play Billing, APNs and
native session mechanics are client-specific implementations; removing them from
an agent operation count does not make the underlying commerce journey complete.

## Protocol boundary

`handleMcpHttpRequest` uses MCP TypeScript SDK v2. It serves 2026-07-28
requests (`server/discover`, per-request `_meta`) statelessly, and 2025-era
`initialize`-based requests (2025-11-25 and earlier) through a stateless
per-request transport. That transport answers in JSON when the client does not
accept SSE. Only POST is served: GET and DELETE return 405. There is no
standalone SSE subscription channel and no session resumption. CIMD uses the
`mcp-2026-07-28` metadata profile. Authentication challenges, discovery and
both protocol eras must still be tested against the deployed edge and origin.
Do not advertise universal host compatibility without host journey tests.
