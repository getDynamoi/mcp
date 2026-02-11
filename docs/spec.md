# Dynamoi MCP Server — Product & Engineering Spec

> **Status:** Draft v2
> **Author:** Trevor + Claude
> **Date:** 2026-02-09
> **Package:** `@dynamoi/mcp`
> **Related:** `packages/mcp/docs/research.md`

---

## 1. Overview

### What We're Building

An MCP (Model Context Protocol) server that lets AI assistants (ChatGPT, Claude, Gemini, etc.) manage music promotion and YouTube channel growth on behalf of Dynamoi users. When a creator asks their AI assistant "how do I promote my music?" or "how do I grow my YouTube channel?", the assistant should know Dynamoi exists and be able to connect to it.

**Maintainers:** Start with `packages/mcp/docs/engineers.md` (short onboarding + debugging notes), then use this spec as the full reference.

### Positioning

**One-liner:** "Promote music and grow YouTube channels with AI. Run Meta and Google ad campaigns through any AI assistant."

**Short description:** "Dynamoi helps music artists get more Spotify streams and YouTube creators grow their channels and AdSense revenue — through automated Meta and Google ad campaigns. No agency fees — your subscription converts 100% to ad credit. Works with ChatGPT, Claude, Gemini, and other AI assistants."

**Keywords for AI discoverability:** music-promotion, youtube-growth, spotify-marketing, record-label-tools, artist-marketing, ad-automation, meta-ads, google-ads, campaign-management, youtube-ads

**Canonical messaging:** See `packages/mcp/docs/publishing-checklist.md` for all approved copy blocks, directory-specific descriptions, and submission checklist.

### Why MCP

MCP is the de facto standard for AI agent-to-tool connectivity (10K+ servers, 97M+ SDK downloads, Linux Foundation backed). By publishing an MCP server, Dynamoi becomes discoverable by every major AI platform. This is AI-mediated distribution — bypassing traditional SEO where established players dominate.

### Business Model Protection

The 2x margin is Dynamoi's core revenue mechanism. The MCP server must NEVER expose raw ad spend. All money values returned through MCP tools use `formatForDisplay()` / `toUSDDisplayNumber()` from `apps/main/app/lib/domains/money/helpers.ts`. This is enforced at the type level and with runtime assertions.

### Supported Platforms

Dynamoi currently supports two ad platforms:

- **Meta Ads** (Facebook/Instagram) — used by Smart Campaigns
- **Google Ads** (YouTube Demand Gen) — used by YouTube Campaigns

Additional platforms (TikTok Ads, Snapchat Ads) are planned but not yet supported. The MCP server should only reference Meta and Google as active platforms. Future platform references should be labeled "coming soon" in documentation and landing pages.

---

## 2. Architecture

### Decision: Option A — Next.js API Route

The MCP endpoint lives inside `apps/main` as a Next.js route handler. This reuses existing Vercel deployment, existing domain logic, and existing auth infrastructure. No new services to deploy or maintain.

**Runtime:** Node.js (not Edge). Required by Prisma and `jose` JWKS fetching.

**Transport:** Streamable HTTP — the modern MCP remote transport. Test with MCP Inspector during development.

### Repo Layout

```
packages/mcp/                              # PUBLIC npm package (@dynamoi/mcp)
  src/
    index.ts                               # Public API exports
    server/
      create-server.ts                     # MCP server factory
      tools.ts                             # Tool definitions (names, descriptions, Zod input schemas)
      tool-annotations.ts                  # OpenAI/ChatGPT tool annotation metadata
      prompts.ts                           # Curated prompt templates
      resources.ts                         # Resource URI templates
      instructions.ts                      # Server instruction text
    auth/
      verify-token.ts                      # JWT verification via JWKS (jose)
      protected-resource.ts                # RFC 9728 metadata + WWW-Authenticate helpers
    transport/
      http.ts                              # Framework-agnostic streamable HTTP handler
    types.ts                               # Public output types (no RawAdSpend)
  package.json
  tsconfig.json
  tsup.config.ts
  README.md
  LICENSE                                  # MIT

apps/main/
  app/
    oauth/
      consent/
        page.tsx                           # Supabase OAuth consent UI
    .well-known/
      oauth-protected-resource/
        route.ts                           # RFC 9728 Protected Resource Metadata (root)
    api/
      mcp/
        route.ts                           # MCP HTTP endpoint (wraps packages/mcp)
    lib/
      domains/
        mcp/                               # PRIVATE adapter layer
          adapter.ts                       # Implements tool handlers using domain logic
          serializers.ts                   # Converts domain types to MCP output types
          guards.ts                        # Auth + margin protection assertions
    settings/
      connected-apps/
        route.ts                           # Redirects → /en/settings/connected-apps (no root layout)
    [locale]/
      settings/
        connected-apps/
          layout.tsx                       # Auth gate for Connected Apps page
          page.tsx                         # Connected Apps revocation UI (Phase 4, inline English)
```

### Boundary: Public vs Private

**Public (`packages/mcp`)** contains:
- Tool definitions (names, descriptions, Zod input schemas, annotations)
- Output type contracts (the "public API" shape for AI consumers)
- Auth plumbing: JWT verification via JWKS (`jose`), RFC 9728 metadata
- Streamable HTTP transport handler
- Server instructions, prompts, resource templates

**Public package must NOT depend on any `@repo/*` workspace packages.** Dependencies limited to: `@modelcontextprotocol/sdk`, `zod`, `jose`.

### Open Source Mirrors + Publishing (Reality)

We keep the main monorepo private (`trevorloucks/dynamoi`). For marketing/SEO and AI crawler discoverability, we publish *mirrors* under the public GitHub org:

- `getDynamoi/mcp` mirrors `packages/mcp/`
- `getDynamoi/browser-extension` mirrors `apps/chrome-extension/`

Mirroring is automated on merges to `main` via GitHub Actions in the private repo:

- Secret: `GETDYNAMOI_PUSH_TOKEN` (GitHub fine-grained PAT)
  - Repository access: select the public repos above
  - Minimum permission: `Contents: Read and write`
  - Stored as a secret in the private repo (not in the public repos)

**Publishing to npm** happens from the public repo (`getDynamoi/mcp`) once local testing is complete and the publishing checklist is satisfied. Use an `NPM_TOKEN` secret in the public repo.

**Versioning + changelog:** We follow SemVer and [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The consumer-facing changelog lives at:

- `packages/mcp/CHANGELOG.md`
- `apps/chrome-extension/CHANGELOG.md`

**Private (`apps/main`)** contains:
- Tool handler implementations (the adapter calling existing domain actions/readers)
- All Prisma/DB access, Stripe, Meta API, Google Ads API calls
- `formatForDisplay()` and all margin-protecting serialization
- `requireAuthenticatedUserWithArtistAccess()` and all access control
- The OAuth consent UI page

### Auth Context in MCP Handlers

The existing auth system uses Next.js cookies (`createClient()` → Supabase). MCP requests authenticate via OAuth Bearer tokens instead. The MCP adapter must:

1. Extract the Bearer token from the request
2. Verify it via JWKS (Supabase's public keys)
3. Resolve the Supabase user ID from the token claims
4. Create a Supabase client scoped to that user (service role + user context)
5. Call existing domain functions with the resolved user

This replaces `getCurrentUser()` for MCP context. The adapter should expose a `resolveUserFromToken(token: string)` function that returns `Exclude<User, { status: "ANONYMOUS" }>` or throws.

---

## 3. Authentication — Supabase OAuth 2.1

### Overview

Dynamoi acts as both:
- **Authorization Server**: Supabase OAuth 2.1 server (issues tokens)
- **Protected Resource Server**: MCP endpoint (accepts tokens, implements RFC 9728)

Users authenticate via their existing Dynamoi account (Google/Meta social login) inside the OAuth consent popup. No new auth method is introduced.

### Setup Steps

1. **Enable OAuth 2.1 Server** in Supabase Dashboard
2. **Switch to asymmetric JWT signing (ES256 or RS256)** — Supabase defaults to HS256 which requires sharing a secret. Asymmetric signing allows public key verification via JWKS (no shared secret)
3. **Enable Dynamic Client Registration** in Supabase OAuth settings (see DCR section below)
4. **Configure Custom Access Token Hook** to set `aud` claim for RFC 8707 resource binding (see Audience Validation section)
5. **Confirm endpoints are live:**
   - OIDC Discovery: `https://<project-ref>.supabase.co/auth/v1/.well-known/openid-configuration`
   - OAuth Discovery: `https://<project-ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1`
   - JWKS: `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`
   - Authorization: `https://<project-ref>.supabase.co/auth/v1/oauth/authorize`
   - Token: `https://<project-ref>.supabase.co/auth/v1/oauth/token`

### OAuth Flow

```
AI Client (ChatGPT/Claude)
  ↓ Authorization Code + PKCE request (scopes: email profile)
Supabase OAuth Server
  ↓ Redirects to Dynamoi consent UI
apps/main/app/oauth/consent/page.tsx
  ↓ User logs in (Google/Meta) if not already
  ↓ Shows consent screen: client name, requested permissions, redirect URI
  ↓ User approves → supabase.auth.oauth.approveAuthorization(id)
Supabase OAuth Server
  ↓ Issues authorization code
AI Client
  ↓ Exchanges code for access token + refresh token
Supabase OAuth Server
  ↓ Returns JWT access token (with custom aud claim)
AI Client
  ↓ Calls MCP endpoint with Bearer token
apps/main/app/api/mcp/route.ts
  ↓ Verifies JWT via JWKS, validates audience, resolves user, handles tool call
```

### Consent UI (`/oauth/consent`)

- Read `authorization_id` from query params
- Canonical entrypoint: `/oauth/consent` (stable URL for Supabase config)
- Keep consent UI **inline English** for Phase 1 (no dependency on Dynamoi i18n system yet)
- If user not logged in: show sign-in options (Google/Meta) inside the consent popup and return to the consent route after OAuth login
- Fetch client details: `supabase.auth.oauth.getAuthorizationDetails(authorization_id)`
- Render consent screen showing: client name, requested permissions, redirect URI
- Approve → `supabase.auth.oauth.approveAuthorization(authorization_id)` → redirect to `redirect_to`
- Deny → `supabase.auth.oauth.denyAuthorization(authorization_id)` → redirect to `redirect_to`
- Design: Match Dynamoi's existing dark-mode OKLCH design system (Radix UI, Tailwind 4)

### OAuth Scopes

Request OAuth scopes: `email profile`.

Note: Supabase OAuth Server (beta) may error during token exchange when `openid` is requested (it tries to mint an ID token). Our MCP only needs an access token, so we avoid `openid` for now.

**Permission enforcement is not done via scopes.** The token proves user identity; permissions are enforced entirely by the existing RBAC system in the MCP server:

- **Viewers**: read-only tools only
- **Editors/Admins**: read + write tools
- **Super Admins**: same as admin (no special MCP behavior)

The consent screen should present permissions in user-friendly terms (e.g., "View your campaigns and analytics", "Manage campaign status and budgets") rather than showing raw scope names.

### Audience Validation (RFC 8707)

MCP's authorization spec requires tokens to be bound to the resource they were issued for. Supabase defaults `aud` to `"authenticated"`, which doesn't satisfy this requirement.

**Fix:** Implement a Supabase Custom Access Token Hook that sets `aud` to the canonical MCP resource identifier:

```
aud: "https://dynamoi.com/api/mcp"
```

The MCP server then validates:
1. `aud` matches `"https://dynamoi.com/api/mcp"`
2. This confirms the token was issued specifically for the MCP resource

This aligns with MCP's "token must be issued for this specific resource" requirement and prevents token misuse across services.

**Local development note:** For localhost testing, we allow `aud: "authenticated"` (Supabase default) so we can test end-to-end without relying on the access token hook. Production MUST require the canonical resource-bound audience.

### Token Validation

Per Supabase's documented checklist + MCP requirements, verify:
1. Signature via JWKS (asymmetric JWTs: ES256 or RS256)
2. `iss` matches Supabase project URL
3. `aud` matches `"https://dynamoi.com/api/mcp"` (via custom access token hook)
4. `exp` is not past
5. `client_id` is an allowed, registered client

Use `jose` library for JWKS fetching + JWT verification. Cache JWKS with a reasonable TTL.

### Protected Resource Metadata (RFC 9728)

MCP spec requires this. Serve at the standard well-known location:

**`GET /.well-known/oauth-protected-resource`**

```json
{
  "resource": "https://dynamoi.com/api/mcp",
  "authorization_servers": [
    "https://<project-ref>.supabase.co/auth/v1"
  ],
  "scopes_supported": ["email", "profile"]
}
```

In Next.js App Router: `apps/main/app/.well-known/oauth-protected-resource/route.ts`

**Important:** This endpoint must exist anywhere we advertise it. MCP/OAuth clients will follow the URL in `WWW-Authenticate` for discovery.

**Also include in 401 responses:**

```
WWW-Authenticate: Bearer resource_metadata="https://dynamoi.com/.well-known/oauth-protected-resource", scope="email profile"
```

#### Canonical URL Rules

- In production, always advertise `https://dynamoi.com/.well-known/oauth-protected-resource` (do not derive from request host headers behind proxies).
- In localhost/dev, it is fine to advertise the request-derived origin.

### Dynamic Client Registration

**Enabled with restrictions.** Supabase's MCP guidance positions DCR as a key compatibility path for MCP clients. Many long-tail MCP clients expect DCR to work.

**Safeguards:**
- Always require user consent for newly registered clients
- Strict redirect URI validation (exact match, HTTPS only, no wildcards)
- Rate limit registration endpoint (10 registrations/hour per IP)
- Monitor registrations via audit logging
- Pre-register known major clients (Claude, ChatGPT, Gemini, Cursor) for reliability

### Connected Apps Revocation (Phase 4)

Add a "Connected Apps" page in Dynamoi user settings (`/settings/connected-apps`) that:
- Lists all authorized MCP clients with name, last used date, and granted permissions
- Provides a "Revoke" button per client that calls Supabase's grant revocation API
- Required for ChatGPT App Directory submission (trust signal)
- Implementation deferred to Phase 4 (hardening)

---

## 4. Tool Definitions (13 Tools)

### Tool Naming Convention

All tools use the `dynamoi_` prefix (e.g., `dynamoi_search`) for clear ownership and collision avoidance when multiple MCP servers are connected to the same AI client.

### Standardized Result Envelope

All tool outputs use a consistent envelope matching the existing domain `Result<T>` pattern:

```typescript
// Success
{ status: "success"; data: T }

// Error
{ status: "error"; message: string; kind?: "validation" | "business" | "platform" | "unknown" }
```

This gives AI agents a predictable structure to parse across all tools.

### Margin Protection — Output Types

**CRITICAL:** No tool output may contain `RawAdSpend`. All money values in tool responses use these output fields only:

```typescript
// In packages/mcp/src/types.ts (PUBLIC)
type MoneyDisplay = {
  formatted: string;      // e.g., "$150.00"
  amountUsd: number;      // e.g., 150.00 (dollars, NOT cents)
};
```

The private adapter converts domain types to these output types using `formatForDisplay()` and `toUSDDisplayNumber()`.

**Runtime backstop:** Before returning any tool output, the adapter performs a deep object walk asserting no value matches the shape `{ type: "RawAdSpend", amount: number }`. This is more precise than key-name regex matching (which false-positives on words like "draw" or "crawl") and catches actual domain type leaks.

**Ratio leakage prevention:** No tool may return both "Dynamoi tracked spend" and any platform-reported spend value. If both appear, users can infer the 2x margin. Analytics tools return only Dynamoi-tracked spend.

### Phase 1 — Read Tools (8 tools)

#### `dynamoi_list_artists`

**Purpose:** List all artists the authenticated user has access to. Primary entrypoint for agents to discover what the user can work with.

```
Input:
  limit?: number — max results (default 20, max 50)
  cursor?: string — opaque pagination cursor

Output (success):
  data: {
    artists: Array<{
      id: string
      name: string
      tier: "none" | "starter" | "plus"
      billingStatus: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "NEVER_SUBSCRIBED"
      activeCampaignCount: number
      role: "admin" | "editor" | "viewer"
    }>
    nextCursor?: string
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** Lists only artists the user has access to (via direct membership, org membership, or super admin).

#### `dynamoi_search`

**Purpose:** Search across artists, campaigns, and smart links by name or URL.

```
Input:
  query?: string — search term (artist name, campaign title, Spotify URL). Omit or empty to list all accessible entities.
  type?: "artist" | "campaign" | "smartlink" — optional filter
  limit?: number — max results (default 10, max 50)
  cursor?: string — opaque pagination cursor

Output (success):
  data: {
    results: Array<{
      type: "artist" | "campaign" | "smartlink"
      id: string
      name: string
      status?: string
      artistName?: string       // for campaigns/smartlinks
    }>
    nextCursor?: string
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** `requireAuthenticatedUserWithArtistAccess` — only returns entities the user has access to.

#### `dynamoi_get_artist`

**Purpose:** Get artist details including connections, onboarding status, and billing.

```
Input:
  artistId: string (required) — UUID

Output (success):
  data: {
    id: string
    name: string
    slug: string
    tier: "none" | "starter" | "plus"
    billingStatus: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "NEVER_SUBSCRIBED"
    connections: {
      spotify: { connected: boolean, artistName?: string }
      meta: { connected: boolean, status?: string }
      youtube: { connected: boolean, channelName?: string }
    }
    onboarding: {
      smartCampaign: {
        isReady: boolean
        missingRequirements: string[]   // e.g., ["spotify", "meta_partnership", "billing"]
        nextAction?: string             // e.g., "connect_spotify"
      }
      youtube: {
        isReady: boolean
        missingRequirements: string[]
        nextAction?: string
      }
    }
    organization?: {
      id: string
      name: string
    }
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** `requireAuthenticatedUserWithArtistAccess(artistId, { minimumRole: "viewer" })`

#### `dynamoi_list_campaigns`

**Purpose:** List campaigns for an artist with summary info.

```
Input:
  artistId: string (required)
  status?: string — filter by status (e.g., "ACTIVE", "PAUSED")
  limit?: number — max results (default 20, max 50)
  cursor?: string — opaque pagination cursor
  format?: "json" | "summary" — default "json". "summary" returns Markdown for token efficiency.

Output (success, format=json):
  data: {
    campaigns: Array<{
      id: string
      contentTitle: string
      campaignType: "SMART_CAMPAIGN" | "YOUTUBE"
      status: CampaignDisplayStatus
      budget: MoneyDisplay
      budgetType: "DAILY" | "TOTAL"
      platforms: string[]              // e.g., ["META", "GOOGLE"]
      createdAt: string                // ISO 8601
      endDate?: string                 // ISO 8601, null for daily campaigns
    }>
    nextCursor?: string
  }

Output (success, format=summary):
  data: {
    summary: string                    // Markdown table of campaigns (~100 tokens vs ~300+ for JSON)
    totalCount: number
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** `requireAuthenticatedUserWithArtistAccess(artistId, { minimumRole: "viewer" })`

#### `dynamoi_get_campaign`

**Purpose:** Get full campaign details including platform-specific status.

```
Input:
  campaignId: string (required) — UUID

Output (success):
  data: {
    id: string
    contentTitle: string
    contentType: "TRACK" | "ALBUM" | "PLAYLIST" | "VIDEO"
    campaignType: "SMART_CAMPAIGN" | "YOUTUBE"
    status: CampaignDisplayStatus
    budget: MoneyDisplay
    budgetType: "DAILY" | "TOTAL"
    locationTargets: { mode: "GLOBAL" } | { mode: "COUNTRIES", countries: Array<{ code: string, name: string }> }
    platforms: Array<{
      name: "META" | "GOOGLE"
      status: string                   // platform-specific effective status
      budgetAllocation: MoneyDisplay   // platform's share of total budget
    }>
    createdAt: string
    updatedAt: string
    endDate?: string
    artistId: string
    artistName: string
    smartLinkUrl?: string              // FeatureFM URL for smart campaigns

    // If status is blocked/failed, explain why
    blockedReason?: string
    nextAction?: string                // e.g., "Complete SmartLink setup"
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** Resolve artist from campaign, then `requireAuthenticatedUserWithArtistAccess`.

#### `dynamoi_get_campaign_analytics`

**Purpose:** Get performance metrics for a campaign. All spend values are display-only (margin applied).

```
Input:
  campaignId: string (required)
  dateRange?: {
    start: string    // ISO 8601 date
    end: string      // ISO 8601 date
  }
  format?: "json" | "summary" — default "json". "summary" returns Markdown report for token efficiency.

Output (success, format=json):
  data: {
    campaignId: string
    contentTitle: string
    status: CampaignDisplayStatus
    dateRange: { start: string, end: string }
    totals: {
      impressions: number
      clicks: number
      spend: MoneyDisplay              // ALWAYS display spend (margin applied)
      cpc: MoneyDisplay | null         // cost per click
      cpm: MoneyDisplay | null         // cost per 1000 impressions
      ctr: number | null               // click-through rate as percentage
    }
    byPlatform?: Array<{
      platform: "META" | "GOOGLE"
      impressions: number
      clicks: number
      spend: MoneyDisplay
    }>
    warnings?: string[]                // e.g., "Meta connection expired — data may be stale"
  }

Output (success, format=summary):
  data: {
    report: string                     // Markdown performance report (~100-150 tokens)
    warnings?: string[]
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** Resolve artist from campaign, then `requireAuthenticatedUserWithArtistAccess`.

**Margin rule:** Analytics spend is always `DisplayAdSpend`. The adapter must:
1. Fetch raw analytics from domain readers
2. Convert all `RawAdSpend` to `DisplayAdSpend` via `toBillableAmount()`
3. Format via `toUSDDisplayNumber()` and `formatForDisplay()`

#### `dynamoi_get_billing`

**Purpose:** Get billing summary — credit balance, tier, recent usage.

```
Input:
  artistId: string (required)

Output (success):
  data: {
    tier: "none" | "starter" | "plus"
    billingStatus: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "NEVER_SUBSCRIBED"
    creditBalance: MoneyDisplay | null   // current active credits
    recentUsage?: {
      period: string                     // e.g., "2026-01"
      totalSpend: MoneyDisplay
      campaignCount: number
    }
    isPromoArtist: boolean
    promoLimits?: {
      campaignsUsed: number
      campaignsAllowed: number
      remainingBudget: MoneyDisplay
    }
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** `requireAuthenticatedUserWithArtistAccess(artistId, { minimumRole: "viewer" })`

**Note:** No payment method details, no Stripe customer IDs, no invoice URLs. Keep billing read minimal and safe.

#### `dynamoi_get_platform_status`

**Purpose:** Check health of Meta, Spotify, and YouTube connections for an artist.

```
Input:
  artistId: string (required)

Output (success):
  data: {
    platforms: {
      spotify: {
        connected: boolean
        artistName?: string
        artistUrl?: string
      }
      meta: {
        connected: boolean
        status: "not_connected" | "oauth_complete" | "selection_pending" | "partnership_pending" | "partnership_active"
        pageName?: string
        tokenExpiresAt?: string        // ISO 8601
        isTokenExpired?: boolean
      }
      youtube: {
        connected: boolean
        channelName?: string
        channelUrl?: string
      }
    }
    onboardingComplete: boolean
    missingForSmartCampaign: string[]    // e.g., ["meta_partnership"]
    missingForYouTube: string[]          // e.g., ["youtube"]
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** `requireAuthenticatedUserWithArtistAccess(artistId, { minimumRole: "viewer" })`

### Phase 2 — Write Tools (3 tools)

All write tools require editor+ role via `requireArtistMutationAccess(artistId)`.

#### `dynamoi_pause_campaign`

**Purpose:** Pause an active campaign across all deployed platforms.

```
Input:
  campaignId: string (required)

Output (success):
  data: {
    id: string
    contentTitle: string
    newStatus: "PAUSED"
    platformResults: Array<{
      platform: "META" | "GOOGLE"
      success: boolean
      message?: string
    }>
  }

Output (partial failure):
  { status: "partial_success"; data: { ... same as success ... }; message: string }
  // e.g., "Meta paused successfully but Google failed: ..."

Annotations:
  readOnlyHint: false
  destructiveHint: false
  openWorldHint: true            # affects real ad delivery
```

**Implementation:** The adapter determines which platforms exist for the campaign (Meta, Google, or both), calls `mutateCampaignStatus()` for each, and aggregates results. If one platform succeeds and another fails, return `partial_success` with per-platform details. Only update the campaign-level status if all platform operations succeed.

**Partial success handling (TODO — post-MVP):** Currently, `partial_success` skips all DB writes (no status update, no audit log, no notification). This leaves the campaign in an inconsistent state where one platform is paused/resumed but the DB doesn't reflect it. Future work should:
1. Update the successful platform's sub-campaign status (e.g., `SmartCampaignMeta.status`) without changing the campaign-level status
2. Record an audit event noting the partial failure with per-platform details
3. Send a notification to the user/admin about the inconsistency
4. Consider a retry mechanism or "resolve inconsistency" tool

**Error classification:**
- `ValidationError` → return Result error with user message, kind: "validation"
- `BusinessRuleError` → return Result error with user message, kind: "business"
- `PlatformFailureError` → return Result error with actionable message, kind: "platform", log to Sentry

#### `dynamoi_resume_campaign`

**Purpose:** Resume a paused campaign across all deployed platforms.

```
Input:
  campaignId: string (required)

Output (success):
  data: {
    id: string
    contentTitle: string
    newStatus: "ACTIVE"
    platformResults: Array<{
      platform: "META" | "GOOGLE"
      success: boolean
      message?: string
    }>
  }

Output (partial failure):
  { status: "partial_success"; data: { ... same as success ... }; message: string }

Annotations:
  readOnlyHint: false
  destructiveHint: false
  openWorldHint: true
```

**Implementation:** Same orchestration pattern as pause. Calls `mutateCampaignStatus()` per platform.

**Business rules enforced:**
- Cannot resume `SUBSCRIPTION_PAUSED` campaigns (requires resubscription)
- Cannot resume `ARCHIVED` or `FAILED` campaigns

#### `dynamoi_update_budget`

**Purpose:** Change the budget amount of a campaign. Cannot change budget type (DAILY↔TOTAL).

```
Input:
  campaignId: string (required)
  budgetAmount: number (required)     — new budget in USD dollars (e.g., 25.00)
  endDate?: string                    — ISO 8601 date. Required when budgetType is TOTAL. Ignored for DAILY.

Output (success):
  data: {
    id: string
    contentTitle: string
    previousBudget: MoneyDisplay
    newBudget: MoneyDisplay
    budgetType: "DAILY" | "TOTAL"
    endDate?: string
  }

Annotations:
  readOnlyHint: false
  destructiveHint: false
  openWorldHint: true
```

**Implementation:** Calls existing `updateCampaignBudget()` from `campaign/actions/budget-update/update-budget.ts`.

**Input conversion:** The MCP tool accepts client-facing dollars from the AI client. The adapter converts to cents before calling the domain action: `Math.round(budgetAmount * 100)`.

**Budget minimums (client-facing):**
- Daily: $10/day minimum, $500/day maximum
- Total:
  - Smart Campaign (Meta): $100 minimum
  - YouTube (Google): $50 minimum

The adapter validates these minimums before calling the domain action. The domain logic enforces the post-margin equivalents internally.

### Phase 3 — Workflow Tools (2 tools)

#### `dynamoi_list_media_assets`

**Purpose:** List reusable (already-uploaded) media assets for an artist. This is the discovery step before launching a Smart Campaign via MCP (Phase 3 does **not** support uploading assets through MCP yet).

```
Input:
  artistId: string (required) — UUID
  limit?: number — max results (default 20, max 50)
  cursor?: string — opaque pagination cursor

Output (success):
  data: {
    assets: Array<{
      id: string
      url: string
      fileType: string
      fileName?: string
      width?: number
      height?: number
      createdAt: string         // ISO 8601
    }>
    nextCursor?: string
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  openWorldHint: false
```

**Auth:** `requireAuthenticatedUserWithArtistAccess(artistId, { minimumRole: "viewer" })`

#### `dynamoi_launch_campaign`

**Purpose:** Create a new campaign record (workflow). The AI client gathers all inputs conversationally, then calls this tool once with everything.

```
Input:
  clientRequestId: string (required)   — UUID generated by the AI client for idempotency.
                                         If a campaign was already created with this ID,
                                         returns the existing campaign instead of creating a duplicate.
  artistId: string (required)
  campaignType: "SMART_CAMPAIGN" | "YOUTUBE" (required)

  # Content
  contentTitle: string (required)         — title of the release
  contentType: "TRACK" | "ALBUM" | "PLAYLIST" | "VIDEO" (required)
  spotifyUrl?: string                     — required for SMART_CAMPAIGN
  youtubeVideoId?: string                 — required for YOUTUBE
  appleMusicUrl?: string                  — optional

  # Budget
  budgetAmount: number (required)         — in USD dollars (e.g., 50.00)
  budgetType: "DAILY" | "TOTAL" (required)
  budgetSplits: Record<"META" | "GOOGLE", number>
                                          — platform allocation as percentages (must sum to 100)
                                            e.g., { "META": 60, "GOOGLE": 40 }
                                            or { "META": 100, "GOOGLE": 0 } for Meta-only
  endDate?: string                        — ISO 8601, required for TOTAL budgets

  # Targeting
  locationTargets?: Array<{ code: string, name: string }>
                                          — empty or omitted = GLOBAL targeting

  # Creative
  adCopy?: string                         — custom ad copy (optional)
  useAiGeneratedCopy?: boolean            — default true if adCopy omitted

  # Smart Campaign assets (Phase 3 uses existing reusable assets only)
  mediaAssetIds?: string[]                — required for SMART_CAMPAIGN (UUIDs returned by dynamoi_list_media_assets)

Output (success):
  data: {
    id: string
    contentTitle: string
    campaignType: "SMART_CAMPAIGN" | "YOUTUBE"
    status: CampaignDisplayStatus         — returns the campaign's current DB status (not a placeholder)
    budget: MoneyDisplay
    budgetType: "DAILY" | "TOTAL"
    platforms: string[]
    nextSteps: string[]                   — e.g., ["Campaign is deploying", "Use dynamoi_get_campaign to check status", "Ads typically go live within 24 hours"]
  }

Annotations:
  readOnlyHint: false
  destructiveHint: false
  openWorldHint: true
```

**Idempotency (current implementation):** To avoid Prisma migrations during early rollout, idempotency is stored as a synthetic row in `stripe_events` keyed by:

`mcp.launch_campaign:{artistId}:{clientRequestId}`

If the same `clientRequestId` is seen again, the tool returns the existing campaign instead of creating a duplicate. This prevents retry-induced duplication — a real risk in MCP where clients retry on timeout.

**Deployment (current implementation):** Phase 3 creates the campaign record in the DB and performs input/prereq validation. It does **not** trigger the platform deployment pipelines yet. The returned `status` is whatever the DB status is at creation time:

- Smart Campaign:
  - `CONTENT_VALIDATION` if a SmartLink already exists for the Spotify URL
  - `AWAITING_SMART_LINK` if SmartLink is missing
- YouTube Campaign: `CONTENT_VALIDATION`

The agent can poll via `dynamoi_get_campaign` and guide the user through any required next steps (e.g., SmartLink setup and asset approval) before ads can run.

**Implementation flow:**

1. Check `clientRequestId` for existing campaign — return it if found
2. Validate all inputs against Smart Campaign draft validation / YouTube validation
3. Check onboarding status (Spotify + Meta + billing for Smart; YouTube + billing for YouTube)
4. Check promo account limits (if applicable)
5. Validate daily spending limits
6. Resolve SmartLink (for Smart Campaigns) to determine initial status
7. Create campaign record + any related rows:
   - Smart Campaign: link `mediaAssetIds` to the campaign with PENDING approval rows
   - YouTube: create the `YouTubeCampaign` record
8. Write idempotency record in `stripe_events`
9. Return campaign ID + current DB status

**Input conversion:**
- `budgetAmount` dollars → cents: `Math.round(budgetAmount * 100)`
- `budgetSplits` percentages → cents: calculate each platform's share from total budget
- `locationTargets` → `normalizeLocationTargetsInput()`

**Creative assets (current implementation):**
- Smart Campaigns require `mediaAssetIds` referencing existing reusable assets for the artist (use `dynamoi_list_media_assets`).
- No media upload support via MCP yet (planned future work).

**Budget minimums (client-facing):**
- Daily: $10/day minimum, $500/day maximum
- Total:
  - Smart Campaign (Meta): $100 minimum
  - YouTube (Google): $50 minimum

**Business rules (enforced by existing domain logic):**
- Smart Campaign requires: Spotify connected + Meta partnership active + billing active
- YouTube requires: YouTube connected + billing active
- Promo artists: max 2 campaigns, $10/day cap, $100 total cap

---

## 5. Server Instructions, Resources & Prompts

### Server Instructions

Sent to every connected AI client. This guides agent behavior:

```
You are connected to Dynamoi — a platform that helps music artists get more Spotify streams
and YouTube creators grow their channels and AdSense revenue, through automated ad campaigns
on Meta (Facebook/Instagram) and Google (YouTube).

Dynamoi serves music artists, record labels, and YouTube creators of all kinds. No agency
fees — subscriptions convert 100% to ad credit. $600 activation bonus for new users.

Supported platforms: Meta Ads (Facebook/Instagram) and Google Ads (YouTube). TikTok Ads and
Snapchat Ads coming soon.

Principles:
- Be accurate and conservative. If you are unsure, ask a clarifying question before taking action.
- Never claim you changed something unless the tool returned status: "success" or "partial_success".
- Prefer read tools first (list/get/analytics) before write tools (pause/resume/update budget/launch).
- For write actions, confirm intent and restate what will change (campaign name, new status/budget).
- Do not attempt to infer or compute "real" platform spend. All money values returned are display values.
- Budget amounts are in USD. Daily minimum is $10/day. Total minimum is $100 for Meta Ads campaigns and $50 for YouTube Ads campaigns.
```

### MCP Resources

URI-based resources that reduce repeated tool calls. AI clients can subscribe to these for stable, cached data.

**Dynamic resources (per-entity):**

```
artist://{artistId}
  → Returns artist info + connections + onboarding state
  → Same data as dynamoi_get_artist but as a subscribable resource

campaign://{campaignId}
  → Returns campaign card + status
  → Same data as dynamoi_get_campaign
```

**Static resources (platform reference data):**

```
dynamoi://platform/pricing
  → Tier descriptions, credit structures, budget minimums
  → Reduces agents asking "what's the minimum budget?"

dynamoi://platform/supported-countries
  → List of valid country codes and names for location targeting
  → Prevents agents guessing country codes in dynamoi_launch_campaign

dynamoi://platform/content-types
  → TRACK, ALBUM, PLAYLIST, VIDEO + which campaign types support them
  → Helps agents construct valid dynamoi_launch_campaign inputs

dynamoi://platform/campaign-statuses
  → Status names, descriptions, and valid transitions
  → Helps agents interpret campaign state and explain it to users
```

### MCP Prompts

Curated prompt templates that steer agent behavior for common workflows:

1. **"Audit my campaigns"** — Lists all active campaigns with performance summaries and flags any issues
2. **"Prepare a release launch plan"** — Walks through content type, targeting, budget planning for a new release
3. **"Why is my campaign blocked?"** — Diagnoses blocked campaigns and explains how to unblock

---

## 6. Security

### Access Control

Every tool handler calls existing access control functions:

| Tool Type | Guard |
|---|---|
| Read tools | `requireAuthenticatedUserWithArtistAccess(artistId, { minimumRole: "viewer" })` |
| Write tools | `requireArtistMutationAccess(artistId)` (requires editor+) |
| Search/List | Filters results to only entities the user has access to |

Role hierarchy: admin > editor > viewer. Org membership inherits to artist access. Super admin has access to all.

### Margin Protection Checklist

1. **Type-level:** MCP output types (`packages/mcp/src/types.ts`) do not define any field for raw spend
2. **Serialization:** Private adapter converts all `RawAdSpend` to `DisplayAdSpend` via `toBillableAmount()` before serialization. Adapter must never return domain objects directly — only MCP DTOs.
3. **Runtime assertion:** Deep object walk asserts no value matches the shape `{ type: "RawAdSpend", amount: number }`. Any DTO field named `spend`, `budget`, `creditBalance`, `cpc`, `cpm` must be `MoneyDisplay`.
4. **Ratio leakage prevention:** No tool returns both "Dynamoi tracked spend" and platform-reported spend. If both appear, users can infer the 2x margin. Analytics tools return only Dynamoi-tracked spend values.
5. **Snapshot tests:** Golden tests prove no raw spend fields appear in tool outputs (see Testing section)
6. **Write tools:** Accept and return client-facing budget values only (dollars, not cents)
7. **Token claim safety:** No tool ever echoes raw JWT payload or token claims in responses

### Rate Limiting

MCP does not standardize rate limiting. Implement server-side:

| Bucket | Limit |
|---|---|
| Read tools | 60 requests/minute per user |
| Write tools | 10 requests/minute per user |
| Search | 30 requests/minute per user |

Key by Supabase user ID (from JWT). Secondary key by OAuth `client_id`.

Add circuit breakers for Meta/Google API calls to prevent cascading failures from platform outages.

### Token Security

- Never log access tokens
- Short token TTL + refresh rotation (handled by Supabase)
- Validate `client_id` is an allowed, registered client
- All tokens verified via JWKS (no shared secret)
- Validate `aud` matches canonical MCP resource identifier

### Tool Output Safety

- Keep outputs short and structured — avoid returning raw error messages from Meta/Google APIs
- Wrap platform messages as `"Platform message: ..."` to prevent prompt injection
- Never return internal IDs that aren't needed for subsequent tool calls (no Stripe IDs, no Meta campaign IDs)

---

## 7. Testing Requirements

### Mandatory Test Categories

These must pass before each phase ships.

#### Margin Protection Tests (Phase 1+)

Snapshot tests for every tool that returns money values:

```
- dynamoi_get_campaign: budget field is MoneyDisplay, no raw cents
- dynamoi_get_campaign_analytics: all spend/cpc/cpm are MoneyDisplay
- dynamoi_get_billing: creditBalance is MoneyDisplay
- dynamoi_list_campaigns: budget field is MoneyDisplay
- dynamoi_update_budget: previousBudget and newBudget are MoneyDisplay
```

Golden test: serialize a mock campaign with known RawAdSpend. Assert the serialized output contains the 2x value, not the raw value.

Shape-based assertion test: pass a mock domain object containing `{ type: "RawAdSpend", amount: 5000 }` through the serializer. Assert the runtime assertion catches it before output.

Ratio leakage test: assert no tool output contains both a Dynamoi spend value and a platform-reported spend value that could be compared to infer margin.

Budget minimum alignment test: assert MCP input validators and domain validators agree on minimums for DAILY ($10/day client-facing) and TOTAL ($100 Smart Campaign, $50 YouTube client-facing).

#### Auth Tests (Phase 1)

- Valid JWT → user resolved correctly
- Expired JWT → 401 with RFC 9728 `WWW-Authenticate` header
- Invalid signature → 401
- Missing Bearer token → 401 with `resource_metadata` link
- Wrong `aud` claim → 401
- Valid token but user lacks artist access → 403
- Viewer role calling write tool → 403

#### Tool I/O Tests (each phase)

For each tool:
- Valid input → correct output shape (matches `{ status: "success", data: T }` envelope)
- Missing required fields → validation error with kind: "validation"
- Unauthorized access → appropriate error
- Platform failure → error with actionable message, kind: "platform"

#### Idempotency Tests (Phase 3)

- `dynamoi_launch_campaign` with same `clientRequestId` twice → returns same campaign ID both times
- `dynamoi_launch_campaign` with different `clientRequestId` → creates distinct campaigns
- `stripe_events.stripeEventId` uniqueness prevents duplicate idempotency rows (and therefore duplicate campaign creation)

#### Integration Tests (Phase 2+)

- Pause/resume round-trip: pause active campaign → verify status → resume → verify status
- Partial failure: mock one platform failing → verify `partial_success` response with per-platform details
- Budget update: change budget → verify new value in get_campaign response
- Budget update with endDate for TOTAL: change amount + end date → verify both updated
- Launch campaign: full creation flow → verify returns a real DB status (`AWAITING_SMART_LINK` or `CONTENT_VALIDATION`)

---

## 8. Distribution & Publishing

### npm Package

The npm package exists primarily for AI discoverability — it feeds model training data, directory listings, and provides high-authority backlinks to dynamoi.com. The target audience for the npm/GitHub presence is AI crawlers and directory indexers, not developers who would self-host.

```json
{
  "name": "@dynamoi/mcp",
  "version": "0.1.0",
  "mcpName": "io.github.getdynamoi/dynamoi",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist", "server.json", "README.md", "CHANGELOG.md", "LICENSE"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^x.y.z",
    "jose": "^x.y.z",
    "zod": "^4.3.6"
  },
  "keywords": [
    "mcp", "model-context-protocol", "music", "promotion",
    "meta-ads", "youtube-ads", "campaign-management",
    "artist-marketing", "record-label", "advertising"
  ]
}
```

For MCP directory compatibility, publish `packages/mcp/server.json` using the official registry schema and include both:

- `packages[0]` pointing to npm package `@dynamoi/mcp` with Streamable HTTP transport
- `remotes[0]` pointing to hosted endpoint `https://dynamoi.com/api/mcp`

**Build:** `tsup` — emits ESM + `.d.ts`, bundles internal files.

**Versioning:** Semantic Versioning + Keep a Changelog.
- We keep `packages/mcp/CHANGELOG.md` in Keep a Changelog format.
- We use Changesets for version bumps (changelog generation disabled so the changelog stays human-curated).

**Publishing:** GitHub Actions workflow (manual until we flip it on): build `packages/mcp` with `tsup` then publish via `changeset publish`.
  - Requires repo secret `NPM_TOKEN` (npm automation token) for CI.

**License:** MIT

### README Content

The README should lead with how to connect to the hosted service, not installation instructions:

- What Dynamoi is (one paragraph, non-developer language, focused on music promotion)
- **How to connect** (hosted endpoint URL `https://dynamoi.com/api/mcp`, OAuth setup)
- Tool index with plain-English descriptions (what each tool does, not schema details)
- Supported platforms: Meta Ads + Google/YouTube Ads (TikTok, Snapchat coming soon)
- Link to dynamoi.com for business info, pricing, getting started
- Link to docs for detailed API reference
- Security model summary (OAuth 2.1, RBAC, no raw data exposure)

### Directory Listings

Full submission checklist with 70+ targets, canonical copy blocks, and submission order: **[publishing-checklist.md](publishing-checklist.md)**

**Canonical listing data:**
- Name: "Dynamoi"
- Description: "Dynamoi helps music artists get more Spotify streams and YouTube creators grow their channels and AdSense revenue — through automated Meta and Google ad campaigns. No agency fees — your subscription converts 100% to ad credit. Works with ChatGPT, Claude, Gemini, and other AI assistants."
- Tags: music-promotion, youtube-growth, spotify-marketing, record-label-tools, artist-marketing, ad-automation
- Auth: OAuth 2.1 (Supabase)
- Remote URL: `https://dynamoi.com/api/mcp`
- License: MIT
- Repo: `getDynamoi/mcp` (public)

### Marketing Landing Page (`/mcp`)

A dedicated, indexable page on dynamoi.com:
- Headline: "Connect Dynamoi to ChatGPT, Claude, and Gemini"
- Tool list with plain-English descriptions
- Security model explanation (OAuth, no raw data, RBAC)
- FAQ in artist language ("promote my single", "release on Friday", "how much does it cost")
- Connect button that links to setup instructions
- SEO-optimized for "music promotion AI", "promote music with ChatGPT", etc.

---

## 9. ChatGPT App Directory

### Why

Even though current OpenAI policy blocks subscription sales in-directory, being listed means:
- OpenAI models learn Dynamoi exists (compounding effect)
- Brand presence when users ask about music promotion
- Existing customers can manage campaigns through ChatGPT

### Requirements Beyond Standalone MCP

1. **ChatGPT App UI** built with OpenAI's Apps SDK
2. **OAuth flow** compatible with ChatGPT (OAuth 2.1 + PKCE + discovery)
3. **Tool annotations** set correctly (review-sensitive)
4. **Privacy policy** matching exactly what tools return
5. **Test credentials** — a fully-functional demo Dynamoi account with sample campaigns and real data. OpenAI rejects apps that require inaccessible signup steps.

### Positioning in Directory

"Campaign management for existing Dynamoi accounts" — not a subscription pitch. The app provides standalone utility (view campaigns, check analytics, pause/resume) without requiring in-chat purchase.

### Policy Constraints

- **No subscription sales:** Cannot sell Dynamoi subscriptions through ChatGPT
- **No digital service upsells:** Avoid "primarily advertising" framing
- **Standalone utility required:** App must be useful without requiring purchase

### App UI (if required)

Minimal UI components:
- Campaign list table
- Analytics summary card
- Platform connection status indicators

---

## 10. Implementation Phases

### Phase 0: Contracts & Safety Rails

**Scope:** Define all tool schemas, output types, and margin protection infrastructure.

- Define tool input schemas in `packages/mcp/src/server/tools.ts` (all tools)
- Define public output types in `packages/mcp/src/types.ts` (no `RawAdSpend`)
- Define standardized result envelope type
- Implement margin protection runtime assertion (shape-based deep walk) in adapter
- Write snapshot tests for margin protection + ratio leakage
- Set up `packages/mcp` package structure with `tsup` build

### Phase 1: Auth + Read Tools

**Scope:** Supabase OAuth 2.1 + RFC 9728 + DCR + all 8 read tools.

- Enable Supabase OAuth 2.1 Server, switch to asymmetric JWT signing (ES256 or RS256)
- Enable Dynamic Client Registration with restrictions (strict redirect URI, rate limit, consent required)
- Configure Custom Access Token Hook to set `aud` claim for RFC 8707 resource binding
- Build `/oauth/consent` page (dark-mode design system)
- Implement RFC 9728 endpoint at `/.well-known/oauth-protected-resource`
- Implement JWT verification via JWKS in `packages/mcp/src/auth/verify-token.ts` (including `aud` validation)
- Build MCP HTTP endpoint at `/api/mcp/route.ts` (streamable HTTP transport, Node.js runtime)
- Implement private adapter (`apps/main/app/lib/domains/mcp/adapter.ts`)
- Implement all 8 read tool handlers (including `dynamoi_list_artists`)
- Implement static MCP resources (pricing, countries, content types, statuses)
- Auth tests + tool I/O tests + margin protection tests
- Test with MCP Inspector
- `bun validate` passes

### Phase 2: Write Tools

**Scope:** 3 write tools (pause, resume, budget update).

- Implement `dynamoi_pause_campaign` handler with multi-platform orchestration
- Implement `dynamoi_resume_campaign` handler with multi-platform orchestration
- Implement `dynamoi_update_budget` handler (with `endDate` for TOTAL budgets)
- Implement `partial_success` result handling for partial platform failures
- Error classification tests (validation vs business vs platform)
- Integration tests (pause/resume round-trip, partial failure, budget update)
- Rate limiting implementation
- `bun validate` passes

### Phase 3: Launch Campaign

**Scope:** The campaign creation workflow tool(s).

- Add `dynamoi_list_media_assets` to support Smart Campaign launch using existing reusable assets
- Implement `dynamoi_launch_campaign` handler to create campaign records with correct initial DB statuses
- Idempotency via `stripe_events` (no Prisma migrations required)
- Input conversion (dollars → cents, percentages → splits, location normalization)
- Idempotency tests (same ID → same campaign, different ID → different campaign)
- Integration tests (launch returns real DB status; Smart Campaign requires `mediaAssetIds`)
- End-to-end test: list artists → list media assets → launch campaign → poll + guide next steps
- `bun validate` passes

### Phase 4: Hardening

**Scope:** Production readiness.

- Rate limiting (best-effort in-memory at `/api/mcp`)
- Circuit breaker/backoff for Meta/Google mutations (MCP-only)
- Audit logging (integrate with `domains/audit`) including campaign creation
- Sentry logging for `PlatformFailureError` + unknown only (validation/business warn-only)
- **Connected Apps revocation page** (`/settings/connected-apps` redirects to `/<locale>/settings/connected-apps`) — list authorized clients, revoke grants
- Server instructions + prompts (dynamic resources already implemented)
- Load testing
- MCP conformance testing

### Local Testing & QA (Publish Gate)

Before publishing `@dynamoi/mcp`, we must verify the MCP server works end-to-end **as an external client** (no repo access) and that it behaves safely under failure.

For a short, agent-friendly checklist, see `packages/mcp/docs/publish-gate-agent.md`.

#### Goals

- Prove the **protocol** works (Streamable HTTP GET/POST/DELETE sessions).
- Prove **OAuth** works end-to-end (consent, token issuance, token verification).
- Prove **RBAC** is enforced (viewer vs editor).
- Prove **no margin leakage** (no raw ad spend outputs).
- Prove **write tools are safe** in sandbox mode (no production-side effects).
- Prove **failure modes** (platform rejects mutation, partial success, rate limits) are correctly classified.

#### Test Setup (Local Sandbox)

- Start local main app:
  - `SANDBOX_MODE=true`
  - `bun dev --filter dynamoi-main` (default port 3000; if 3000 is taken it will pick another free port, e.g. 3001)
- Use a dedicated sandbox user account (not Trevor’s primary account).
- Ensure Supabase OAuth 2.1 server is enabled and issuing asymmetric JWTs (ES256 or RS256) for the dev project.

#### Streamable HTTP Protocol Notes (Important)

The MCP server uses **Streamable HTTP**. A few protocol details matter in practice:

- **Session binding (P0 security requirement):** The server may reuse in-memory sessions keyed by `mcp-session-id`, but sessions are bound to the authenticated principal (`sub + clientId`). If a client reuses a session ID under a different user/client, the server rejects the request with `404 Session not found` and forces re-initialization.
- **Clients MUST send an `Accept` header** that includes both `application/json` and `text/event-stream` (some transports reject requests otherwise).
- **POST responses may be returned as SSE** (`text/event-stream`) rather than JSON. Clients must parse SSE frames and read the first `data:` JSON-RPC message as the response.
- **GET SSE streams may start “quiet”** (no messages for a while). Some HTTP clients treat a totally-empty SSE stream as not connected; our implementation writes an initial SSE comment frame (`:\n\n`) to flush the connection during local testing.

#### Clean Room Rule (External Client)

When testing with an AI client (Gemini/ChatGPT/Codex config), the model must NOT have access to this repo or local files.

Acceptable options:
- Create a separate macOS user account (recommended) that has no access to the repo directory.
- Run the client from an empty working directory (minimum bar, still not a hard guarantee).
- If using containers/VMs: run the AI client in an environment with no mounted repo volumes.

#### Deterministic Smoke Test (Recommended)

Use the repo’s deterministic script first to validate protocol + auth without any LLM behavior:

- Script: `bun scripts/mcp/smoke.ts --url http://localhost:3000/api/mcp --token <OAUTH_ACCESS_TOKEN>`
- Optional:
  - `--artist-id <uuid>` to also call `dynamoi_get_platform_status`
  - `--sse` to also sanity-check Streamable HTTP GET (SSE)
  - `--debug` for verbose protocol diagnostics

The script prints `OK` on success and a single error message on failure.

To obtain `<OAUTH_ACCESS_TOKEN>` locally:
- Preferred: enable **Dynamic Client Registration** (DCR) for the Supabase OAuth server so test clients can self-register.
- If DCR is not enabled (Supabase returns `registration_endpoint: null`), create a Supabase OAuth client manually and run:
  - `bun scripts/mcp/oauth-token.ts --mcp-url http://localhost:3000/api/mcp --client-id <SUPABASE_OAUTH_CLIENT_ID>`

To avoid repeated manual approval clicks during local testing:
- Use `--refresh-cache <path>` when running `oauth-token.ts`. The first run will still require one approval click, then the refresh token is cached and subsequent runs are fully automated.
- Recommended cache location: `~/mcp-cleanroom/.dynamoi_mcp_refresh.json` (local-only, `chmod 600` best-effort).

One-command local flow (recommended):
- `bun scripts/mcp/e2e.ts --no-open --refresh-cache ~/mcp-cleanroom/.dynamoi_mcp_refresh.json`
  - This obtains an access token (refreshing if possible) and then runs the deterministic smoke tests.

#### Gemini CLI “Clean Room” Testing (MCP-Only Session)

Goal: run Gemini CLI so it can only use the Dynamoi MCP server and cannot read any local files outside an empty working directory.

Setup:
1. Create an empty folder (example: `~/mcp-cleanroom`) and run Gemini CLI from inside it.
2. Create `.gemini/settings.json` with:
   - only a single MCP server entry for Dynamoi (Streamable HTTP via `httpUrl`)
   - `mcp.allowed` set to just that server name (so no other MCP servers can be used)
   - optional: `includeTools` to only allow Dynamoi tool names from that server
   - if Supabase DCR is not enabled, also provide an OAuth `clientId` for the server (see notes)
3. Use Gemini CLI sandboxing (recommended) so any tool execution is constrained to the clean room directory.

Notes:
- Gemini CLI file system tools operate within a configured `rootDirectory`. If you run Gemini from an empty clean room directory, it cannot “discover” Dynamoi repos in other directories.
- For Docker-based sandboxing, use `http://host.docker.internal:<dev-port>/api/mcp` (example: `http://host.docker.internal:3000/api/mcp`) when the client is sandboxed in a container.
- If Supabase DCR is not enabled, Gemini CLI may require an explicit OAuth client ID. In that case, add an `oauth` block to the server config:
  - `"oauth": { "clientId": "<SUPABASE_OAUTH_CLIENT_ID>", "scopes": ["email","profile"] }`
- **Gemini schema compatibility:** Gemini CLI (via `parametersJsonSchema`) is sensitive to schema size and certain JSON Schema keywords. In practice:
  - Keep `includeTools` small (start with 1 tool, then expand gradually).
  - The server strips `$schema` from tool schemas and (when `x-dynamoi-client: gemini-cli` is present) sanitizes schemas down to a minimal subset of keywords to avoid `INVALID_ARGUMENT` errors.

Recommended (fully automated) clean-room smoke:
- `bun scripts/mcp/gemini-cleanroom-smoke.ts`
  - Runs Gemini from inside `~/mcp-cleanroom`
  - Disables core tools (no file/shell/web tools)
  - Injects a short-lived access token into MCP server headers for the session
  - Restores `.gemini/settings.json` after the run so the access token is not left on disk
  - Uses a small tool allowlist by default to keep Gemini requests reliably under limits

Example `.gemini/settings.json` (clean room, MCP-only):

```json
{
  "mcp": {
    "allowed": ["dynamoi-local"]
  },
  "mcpServers": {
    "dynamoi-local": {
      "httpUrl": "http://localhost:3000/api/mcp",
      "timeout": 30000,
      "trust": false,
      "includeTools": [
        "dynamoi_list_artists"
      ]
    }
  },
  "tools": {
    "sandbox": "sandbox-exec",
    "exclude": [
      "ReadFileTool",
      "ReadManyFilesTool",
      "WriteFileTool",
      "EditTool",
      "GlobTool",
      "GrepTool",
      "LSTool",
      "ShellTool",
      "WebFetchTool",
      "WebSearchTool"
    ]
  }
}
```

If you need Docker sandboxing instead:
- Replace the MCP URL with `http://host.docker.internal:3000/api/mcp` (or your chosen dev port)
- Set `"tools": { "sandbox": "docker", ... }`

#### Protocol + Auth Conformance Checklist

1. Unauthed request to `/api/mcp`:
   - Expect `401` with `WWW-Authenticate` including `resource_metadata=".../.well-known/oauth-protected-resource"`.
2. Fetch `/.well-known/oauth-protected-resource`:
   - Confirm it exists and returns RFC 9728 protected resource metadata pointing at the Supabase auth server.
3. OAuth consent:
   - Open `/oauth/consent?authorization_id=...` from an OAuth flow.
   - Approve and confirm redirect to client callback.
4. Token validation:
   - Call `/api/mcp` with Bearer token.
   - In production, verify canonical `aud` is required.

#### MCP “Happy Path” Flow (Read + Write)

As an external client (Gemini CLI or MCP Inspector):
- `initialize`
- `tools/list` (confirm the expected tool set)
- `resources/list` + `resources/read` for:
  - `dynamoi://platform/pricing`
  - `artist://{artistId}`
- `prompts/list` + `prompts/get` (confirm prompt messages render)

Then a realistic workflow:
1. `dynamoi_list_artists` → choose one artist
2. `dynamoi_list_campaigns` (summary + json modes)
3. `dynamoi_get_campaign`
4. `dynamoi_get_campaign_analytics` (json + summary)
5. `dynamoi_list_media_assets`
6. `dynamoi_launch_campaign` (Smart Campaign and YouTube, separate runs)
7. `dynamoi_update_budget` (DAILY + TOTAL)
8. `dynamoi_pause_campaign` then `dynamoi_resume_campaign`

#### Negative / Safety Tests

- RBAC:
  - Viewer token can call read tools, but write tools must error (kind: `business`).
- Rate limit:
  - Rapid tool calls should trigger `429` with `Retry-After`.
- Platform failure classification:
  - When Meta/Google rejects a mutation, tool should return error kind: `platform` (and log to Sentry).
- Circuit breaker:
  - Repeated platform failures should temporarily block and return a retry-after style message.
- Margin leakage:
  - Spot-check all money outputs remain display-only (no raw platform spend).

#### Connected Apps Tests

- Visit `/<locale>/settings/connected-apps` while signed in:
  - Verify grants list loads.
  - Revoke a grant and verify it disappears.

### Phase 5: Publish & Distribute

**Scope:** npm publish + directory listings.

- Changesets setup for `packages/mcp`
- GitHub Actions: build → test → publish on merge
- npm publish `@dynamoi/mcp` v0.1.0
- Submit to all 8 directories
- Create `/mcp` landing page on dynamoi.com
- Update dynamoi.com SEO (keywords, meta tags)
- `bun validate` passes

### Phase 6: ChatGPT App Directory

**Scope:** ChatGPT App submission.

- Build minimal App UI (Apps SDK)
- Create demo organization + demo artist with sample campaigns
- Set up test credentials for OpenAI review
- Write privacy policy matching tool outputs
- Submit to ChatGPT App Directory
- Iterate on review feedback

---

## 11. Future Considerations

### Stripe ACP (Agentic Commerce Protocol)

Stripe ACP supports digital subscriptions via Shared Payment Tokens. However, OpenAI's ChatGPT directory policy currently blocks subscription sales. When this policy changes, Dynamoi can:

1. Implement ACP endpoints for subscription purchase
2. Enable in-chat signup flow: plan selection → agent-initiated checkout → subscription provisioned
3. Leverage existing Stripe subscription infrastructure (already fully API-driven)

This is a **parallel track** — do not block any current work on ACP readiness.

### Additional Tools (Post-MVP)

- `dynamoi_get_recommendations` — AI-powered campaign optimization suggestions
- `dynamoi_archive_campaign` — Archive completed campaigns
- `dynamoi_get_smart_link` — Detailed SmartLink analytics
- Media upload support for `dynamoi_launch_campaign`

### Additional Platforms (Coming Soon)

- TikTok Ads integration (when campaign type is added)
- Snapchat Ads integration
- Direct Spotify API (when available, replaces FeatureFM)

---

## Appendix A: Domain Type Reference

These are the existing domain types that the MCP adapter consumes. Included here for implementer reference.

### Campaign Status Machine

```
AWAITING_SMART_LINK → CONTENT_VALIDATION → DEPLOYING → READY_FOR_REVIEW → ACTIVE
                                                                            ↕
                                                                          PAUSED
                                                                            ↓
                                                                    SUBSCRIPTION_PAUSED
Campaign can also → ARCHIVED or FAILED from most states
Display-only: ENDED (derived when total budget is exhausted)
```

### Money Type System

```typescript
// Domain types (PRIVATE — never exposed via MCP)
type RawAdSpend = { type: "RawAdSpend"; amount: MoneyInUSDCents }
type DisplayAdSpend = { type: "DisplayAdSpend"; amount: MoneyInUSDCents }

// Conversion: RawAdSpend × 2 = DisplayAdSpend (PLATFORM_MARGIN = 2)
// formatForDisplay(rawAdSpend) → automatically applies 2x → "$XX.XX"
// toUSDDisplayNumber(rawAdSpend) → automatically applies 2x → number

// MCP output type (PUBLIC — always display values)
type MoneyDisplay = { formatted: string; amountUsd: number }
```

### Access Control Chain

```
Token → resolveUserFromToken() → User (AUTHENTICATED | SUPER_ADMIN)
  → resolveArtistAccessRole(userId, artistId)
    → checks: super admin, creator, direct membership, org membership
    → returns: AccessRole (admin | editor | viewer) or null (no access)
  → requireAuthenticatedUserWithArtistAccess() for reads
  → requireArtistMutationAccess() for writes (editor+)
```

### Error Classification

```
ValidationError      → user input error, return message, kind: "validation", no Sentry
BusinessRuleError    → business logic violation, return message, kind: "business", no Sentry
PlatformFailureError → Meta/Google API rejection, return actionable message, kind: "platform", log to Sentry
```

### Onboarding Requirements

```
Smart Campaign requires:
  1. Spotify URL connected
  2. Meta OAuth + Meta Partnership active
  3. Billing subscription active

YouTube Campaign requires:
  1. YouTube channel connected
  2. Billing subscription active

23-state onboarding machine: Spotify(2) × Billing(2) × Meta(5) + special states
Each incomplete state has: missingRequirements[] + nextAction
```

---

## Appendix B: Changelog

### v2 (2026-02-09)

Changes from external review + internal feedback:

**Auth:**
- Fixed Supabase OAuth endpoint URLs (added `/oauth/` path segment, corrected OIDC discovery path)
- Replaced custom `campaigns` scope with standard `email profile` (Supabase doesn't support custom scopes)
- Added RFC 8707 audience binding via Supabase Custom Access Token Hook (`aud: "https://dynamoi.com/api/mcp"`)
- Moved Protected Resource Metadata to standard `/.well-known/oauth-protected-resource` (was incorrectly under `/api/`)
- Enabled Dynamic Client Registration with restrictions (was deferred)

**Tools:**
- Added `dynamoi_list_artists` tool (toolset now includes Phase 3 workflow tooling)
- Standardized all tool outputs to `{ status: "success", data: T } | { status: "error", message, kind }` envelope
- Added pagination (`limit`, `cursor`) to `dynamoi_search` and `dynamoi_list_campaigns`
- Added `format?: "json" | "summary"` parameter to analytics and list tools for Markdown token efficiency
- Fixed `dynamoi_update_budget`: added `endDate` parameter for TOTAL budgets, fixed budget minimum documentation ($10/day daily, $100 total client-facing)
- Added `partial_success` status for `dynamoi_pause_campaign` and `dynamoi_resume_campaign` when one platform fails
- Added `clientRequestId` to `dynamoi_launch_campaign` for idempotency (prevents retry-induced duplicate campaigns)
- Added `dynamoi_list_media_assets` (Phase 3) so Smart Campaign launches can reference existing reusable creative
- `dynamoi_launch_campaign` currently creates DB records and returns the real DB status (deployment is deferred to a future phase)

**Security:**
- Replaced regex JSON key scan (`/raw/i`) with shape-based deep walk assertion (checks for `{ type: "RawAdSpend", amount: number }`)
- Added ratio leakage prevention rule (never return both Dynamoi spend and platform-reported spend)
- Added token claim safety rule (never echo raw JWT payload)

**Architecture:**
- Specified Node.js runtime (not Edge) — required by Prisma + JWKS
- Specified streamable HTTP transport
- Added static MCP resources (pricing, countries, content types, statuses)
- Added 3 more directory listings (Cursor Directory, mcpservers.org, mcpmarket.com)
- Clarified npm package audience: AI crawlers and directory indexers, not self-hosting developers

**Testing:**
- Added shape-based assertion tests, ratio leakage tests, budget minimum alignment tests
- Added idempotency tests for `dynamoi_launch_campaign`
- Added partial failure integration tests for pause/resume
- Added `aud` claim validation to auth tests
