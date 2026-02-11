# Dynamoi MCP Server Research

> **Status:** Brainstorming / Research phase
> **Branch:** `cli-research`
> **Last updated:** 2026-02-07

---

## Executive Summary

Dynamoi should build an open-source MCP server as a new package in the turborepo. The MCP server would be a thin API layer over existing backend capabilities, letting AI agents (Claude, ChatGPT, Gemini, Cursor, etc.) manage music promotion campaigns through natural language.

**Why now:**
- MCP has won the protocol war: 10K+ servers, 97M+ SDK downloads, adopted by Anthropic, OpenAI, Google, Microsoft, donated to Linux Foundation (Dec 2025)
- No music promotion platform has an MCP server -- Dynamoi would be first
- The business model is protected: the moat is managed ad accounts, optimization engine, and 2x margin -- not the interface
- ChatGPT App Directory has zero music promotion apps (only Spotify/Apple Music for consumption)

**What we're NOT building:** A CLI. Agents consume MCP directly -- a CLI is redundant.

**Target user:** Non-technical artists and labels using AI assistants (Claude, ChatGPT) for advice. When they ask "how do I promote my music?", the AI should know Dynamoi exists and offer to connect. The MCP server is not a developer tool -- it's the bridge that lets AI assistants become music marketing assistants.

**The real play: AI-mediated distribution.** Traditional SEO for music promotion is dominated by established players (DistroKid, TuneCore, CD Baby, content farms) with years of domain authority. Fighting them on Google is a long, expensive grind. But when an artist asks ChatGPT or Claude "how should I promote my new single?", the AI isn't ranking pages by domain authority -- it's recommending tools it can actually connect to and use. Right now, no music promotion platform has that capability. The leaderboard resets.

**Distribution strategy:**
1. **AI model awareness** -- Publishing across MCP directories, npm, GitHub feeds model training data. Models learn "Dynamoi = music promotion tool" and recommend it organically.
2. **ChatGPT App Store** -- Contextual discovery for 800M+ users. Artist says "promote my single" → ChatGPT suggests Dynamoi automatically.
3. **SEO side effect** -- Every directory listing, npm page, GitHub repo, and App Store entry is a high-authority backlink to dynamoi.com from AI/tech domains.
4. **Compounding network effect** -- Every artist who connects Dynamoi through an AI creates a signal. Usage data feeds back into models. More users → stronger signal → more recommendations → more users. First mover in this loop has a structural advantage that's hard to catch.

---

## Table of Contents

1. [Protocol Landscape](#1-protocol-landscape)
2. [Business Model & Moat](#2-business-model--moat)
3. [Tool Design](#3-tool-design)
4. [Authentication](#4-authentication)
5. [Killer Demo](#5-killer-demo)
6. [ChatGPT App Directory](#6-chatgpt-app-directory)
7. [Turborepo Integration](#7-turborepo-integration)
8. [Distribution & SEO](#8-distribution--seo)
9. [Security](#9-security)
10. [Open Questions](#10-open-questions)
11. [Sources](#11-sources)

---

## 1. Protocol Landscape

### MCP Won

MCP (Model Context Protocol) is the de facto standard for AI agent-to-tool connectivity:
- 10K+ servers indexed across community directories
- 97M+ SDK downloads
- Donated to Linux Foundation's AAIF (Dec 2025)
- Adopted by every major AI company: Anthropic, OpenAI, Google, Microsoft
- Companies shipping MCP servers: Stripe (25 tools), Notion (16 tools), Sentry (~16 tools), Figma, Cloudflare, Linear, Intercom

### Other Protocols (Less Relevant)

| Protocol | Status | Relevance |
|---|---|---|
| A2A (Agent-to-Agent) | Google-led, slowed | Not relevant yet |
| ACP (IBM) | Local environments | Not relevant |
| ANP | Decentralized, experimental | Not relevant |

### MCP Client Ecosystem

| Client | MCP Support | Notes |
|---|---|---|
| Claude Desktop | Full (Integrations, MCP Apps) | Best demo surface. MCP Apps = inline UI components |
| ChatGPT | Full (Apps Directory) | 800M+ weekly users. App Store with contextual discovery |
| Gemini | Extensions Marketplace | 70+ extensions. Enterprise-oriented |
| Claude Code | Full | Terminal-based, good for technical demos |
| Cursor | Full | 40-tool hard limit across all servers |
| Windsurf | Full | IDE-based |
| OpenAI Frontier | Enterprise agents | Launched Feb 5, 2026. Agent identities + permissions |

---

## 2. Business Model & Moat

### Why MCP Doesn't Threaten the Business

The value isn't the UI -- it's what sits behind it:
- **Managed ad accounts** -- clients never touch Meta Business Manager or Google Ads
- **2x margin on ad spend** -- invisible to clients and agents. `formatForDisplay()` enforces this at the serialization boundary. Agents see "your $500 budget," never the $250 going to ad networks
- **Cross-platform optimization** -- Meta + Google + YouTube intelligence that no single-platform tool provides
- **SmartLink infrastructure** -- `stream.dynamoi.com` tracking
- **AI ad copy generation** -- pulls Instagram captions, Facebook posts, YouTube descriptions, Spotify genres to match artist voice

### MCP Makes the Product MORE Accessible

- Lowers adoption barrier: users don't need to learn a new dashboard
- Meets users where they already are (Claude, ChatGPT)
- Expands addressable market to anyone with an AI assistant
- Marketing narrative: "You already have an AI assistant. Now it can run your marketing."

### What Stays Closed Source

Everything in `apps/main` and `apps/play`. The MCP server is a thin API layer -- it calls into domain logic but doesn't expose it.

### What Goes Open Source

The MCP server package only. Tools, auth middleware, transport layer. No business logic, no domain internals, no margin calculations.

---

## 3. Tool Design

### Lessons from Major MCP Servers

**Notion (most instructive):**
- 1:1 API mapping failed. Agents hit context limits with nested JSON
- Rewrote tools to be task-oriented, switched to Markdown I/O (massive token savings)
- Hosted server with OAuth > downloadable package

**Stripe:**
- 25 tools across 11 categories
- `search_stripe_resources` cross-cutting search is powerful pattern
- `search_stripe_documentation` searches their own docs

**Sentry:**
- "Intentionally consolidated rather than bloated with single-purpose functions"
- Search-oriented tools that return rich context

**Community Meta Ads MCP (29 tools):**
- 1:1 API mapping. What NOT to do -- Dynamoi already handles Meta complexity internally

**Anthropic's official guidance:**
- 10-15 tools max
- Task-oriented over API-wrapping
- Markdown responses over JSON (token-efficient)
- Avoid list-all tools (use search instead)
- Namespace tool names

**The "Too Many Tools" problem:**
- Tool metadata alone can consume 30K-60K tokens (25-30% of 200K context)
- Tool selection accuracy degrades past 30-50 tools
- Cursor hard limit: 40 MCP tools total across all servers

### Phased Tool Rollout

#### Phase 1: READ Tools (7 tools, ship first)

Zero risk of side effects. All money amounts through `formatForDisplay()`.

| # | Tool | Description | Key Parameters |
|---|---|---|---|
| 1 | `dynamoi_search` | Search across artists, campaigns, content | `query`, `type?`, `limit?` |
| 2 | `dynamoi_get_artist` | Artist profile, billing, connections, tier | `artist_id` or `artist_slug` |
| 3 | `dynamoi_get_campaign` | Full campaign details: status, budget, platform, content | `campaign_id` |
| 4 | `dynamoi_get_campaign_analytics` | Performance metrics: impressions, clicks, spend (2x margin applied) | `campaign_id`, `date_range?`, `granularity?` |
| 5 | `dynamoi_list_campaigns` | List campaigns with filtering (summary, not full detail) | `artist_id`, `status?`, `platform?`, `limit?` |
| 6 | `dynamoi_get_billing_summary` | Credit balance, tier, recent invoices (client-facing amounts) | `artist_id` |
| 7 | `dynamoi_get_platform_status` | Connection status for Meta, Spotify, YouTube | `artist_id` |

#### Phase 2: WRITE Tools (3 tools, ship second)

Require `editor` or `admin` role. Viewers rejected.

| # | Tool | Description | Key Parameters |
|---|---|---|---|
| 8 | `dynamoi_pause_campaign` | Pause active campaign (Meta + YouTube) | `campaign_id` |
| 9 | `dynamoi_resume_campaign` | Resume paused campaign (validates billing first) | `campaign_id` |
| 10 | `dynamoi_update_budget` | Adjust budget. Enforces min $10/day, $100 total client-facing | `campaign_id`, `budget_type`, `amount_cents` |

Campaign creation deliberately excluded -- too complex (multi-step pipeline) and too risky for early release.

#### Phase 3: WORKFLOW Tools (2 tools, ship third)

Task-oriented tools wrapping multi-step workflows (Notion-style "agent-first").

| # | Tool | Description | Key Parameters |
|---|---|---|---|
| 11 | `dynamoi_launch_campaign` | Full pipeline: SmartLink, validation, creative, deployment | `artist_id`, `content_type`, `content_title`, `spotify_url?`, `youtube_url?`, `budget_type`, `budget_amount_cents`, `location_targets?` |
| 12 | `dynamoi_get_campaign_recommendations` | AI analysis with actionable suggestions | `artist_id` or `campaign_id` |

#### Never via MCP

| Category | Why |
|---|---|
| Platform connections (Spotify/YouTube/Meta OAuth) | Interactive OAuth flows MCP can't handle |
| Billing changes (plan, payment method) | Financial liability; Stripe requires browser redirect |
| Team management (invite, roles, remove) | Access control escalation risk |
| Account deletion | Irreversible |
| Raw ad spend / internal margin data | Exposes 2x business model |

### MCP Resources (Static Data)

Cheaper than tools for reference data agents repeatedly need.

| Resource URI | Description |
|---|---|
| `dynamoi://platform/pricing` | Pricing tiers, credit structures, budget minimums |
| `dynamoi://platform/supported-countries` | Supported target countries |
| `dynamoi://platform/content-types` | Track, Album, Playlist, Video + requirements |
| `dynamoi://platform/campaign-statuses` | Status descriptions and valid transitions |
| `dynamoi://artist/{artist_id}/overview` | Dynamic: name, tier, active campaigns, credit balance |

### MCP Prompts (Guided Workflows)

| Prompt | What It Does |
|---|---|
| `campaign-report` | Calls `get_campaign_analytics` with right date range, formats readable report |
| `onboarding-check` | Sequences `get_artist` + `get_platform_status` + `get_billing_summary` for readiness checklist |
| `budget-advisor` | Analyzes performance + billing to suggest optimal budget allocation |

### Response Format

Following Notion's lesson:
- **Markdown** for analytics/reports (token-efficient)
- **Structured JSON** only for data agents need programmatically (IDs, status enums, amounts)
- Consider `format` parameter: `"summary"` (~100 tokens) vs `"detailed"` (~300 tokens) vs `"json"`

---

## 4. Authentication

### Supabase OAuth 2.1 -- First-Class MCP Support

Supabase launched OAuth 2.1 Server as public beta (Nov 26, 2025) with a dedicated MCP Authentication guide.

**Endpoints Supabase provides:**

| Endpoint | URL |
|---|---|
| Authorization | `https://<ref>.supabase.co/auth/v1/oauth/authorize` |
| Token | `https://<ref>.supabase.co/auth/v1/oauth/token` |
| JWKS | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| Discovery (RFC 8414) | `https://<ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1` |
| OIDC Discovery | `https://<ref>.supabase.co/auth/v1/.well-known/openid-configuration` |

**MCP spec compliance:**
- Authorization Code with PKCE (S256) -- supported natively
- Authorization Server Metadata (RFC 8414) -- supported
- Dynamic Client Registration (RFC 7591) -- supported (enable in settings)
- Protected Resource Metadata (RFC 9728) -- NOT provided by Supabase (MCP server must implement this endpoint itself)

**Custom scopes limitation:** Supabase only supports standard OIDC scopes (`openid`, `email`, `profile`, `phone`). Custom scopes like `campaigns:read` / `campaigns:write` must be enforced in the MCP server code, not in Supabase. This is workable -- the token proves identity, the server enforces permissions.

### Auth Architecture

```
MCP Client (Claude, Cursor, ChatGPT, etc.)
    |
    | Bearer token (Supabase-issued JWT)
    v
MCP Server (mcp.dynamoi.com)
    |
    | 1. Validate JWT via Supabase JWKS endpoint (no shared secrets)
    | 2. Extract user ID from `sub` claim
    | 3. Query Prisma/Postgres for user roles, artist access
    | 4. Enforce permissions using same logic as Next.js app
    v
Supabase Postgres (shared database)
```

The same role resolution functions from `apps/main/app/lib/domains/artist/access.ts` (`requireArtistMutationAccess`, `requireAuthenticatedUserWithArtistAccess`) would be shared via `packages/db` or a new shared package.

### API Keys vs OAuth

Industry pattern (Stripe, Notion, Sentry): **support both**.

| Transport | Auth Method |
|---|---|
| Remote HTTP (mcp.dynamoi.com) | OAuth 2.1 (spec-mandated) |
| Local stdio (self-hosted) | API key via environment variable |

### Progressive Scopes

MCP spec supports step-up authorization natively (403 + `WWW-Authenticate` header triggers re-auth).

| MCP Scope | Dynamoi Role | Operations |
|---|---|---|
| `analytics:read` | viewer+ | Campaign status, metrics, spend summaries |
| `campaigns:read` | viewer+ | Campaign details, creative, targeting |
| `campaigns:write` | editor+ | Create/pause/modify campaigns, budget changes |
| `artist:manage` | admin | Team management, role changes |
| Never exposed | -- | Connections, billing portal, ad account credentials |

Two-layer enforcement:
1. **Supabase level:** Token proves "this is user X" (no custom scopes in JWT)
2. **MCP server level:** Checks user's Dynamoi role from DB + MCP client's consented scopes

### Notion's Evolution (Blueprint for Dynamoi)

1. **Phase 1:** Local stdio server + API token in env var (easy, works today)
2. **Phase 2:** Hosted server at `mcp.notion.com` with OAuth (polished, rapid iteration)
3. **Phase 3:** AI-first tools optimized for LLM consumption (Markdown I/O, task-oriented)

### User Onboarding Flow (What Happens Where)

The OAuth popup that MCP triggers is a page we control. It can be a signup form -- not just login. So account creation happens right there in the popup without the user meaningfully "leaving" the chat.

**What can happen inside the AI chat:**

| Step | How |
|---|---|
| Account creation (signup) | OAuth popup → dynamoi.com signup form → popup closes → back in chat |
| Spotify connection | Just a URL. Agent asks "what's your Spotify artist link?" -- no OAuth needed |
| Check readiness | Agent calls `dynamoi_get_platform_status` to see what's connected |
| Everything post-onboarding | Campaigns, analytics, budgets, reports -- all via MCP tools |

**What still requires dynamoi.com (browser-only, one-time setup):**

| Step | Why |
|---|---|
| Meta Business Manager connection | Facebook OAuth + business account selection |
| YouTube connection | Google OAuth + channel selection |
| Stripe payment setup | Card entry in Stripe Checkout (until Shared Payment Tokens support SaaS) |

These are third-party OAuth/payment flows that require browser redirects. Can't be done in a chat window. But they're one-time -- once connected, the user lives in the chat.

### Stripe Agentic Commerce (Future: Eliminates Payment Friction)

Stripe is building infrastructure that could eliminate the "go to dynamoi.com for payment" step:

**What's live today (Feb 2026):**
- **Agentic Commerce Protocol (ACP)** -- open standard co-developed with OpenAI
- **Shared Payment Tokens (SPTs)** -- scoped, time-limited, amount-capped token tied to a buyer's saved payment method. Agent initiates payment without seeing card numbers
- **Instant Checkout in ChatGPT** -- working for physical goods (Etsy, Shopify merchants like Glossier, Spanx, SKIMS)

**What's NOT available yet for Dynamoi:**
- Currently limited to **physical goods** checkout
- **Digital goods, subscriptions, SaaS** not explicitly supported yet
- **Waitlist** -- not general availability
- Expected to expand to digital/SaaS **mid-2026**

**When it arrives, the flow becomes:**
1. Artist signs up via OAuth popup (already possible)
2. Artist provides Spotify URL in chat (already possible)
3. Artist adds payment via Stripe Shared Payment Token -- **inside the chat**
4. Only Meta + YouTube connections still require dynamoi.com

This would reduce the "must visit dynamoi.com" list to just Meta and YouTube OAuth -- both one-time setup.

Sources: [Stripe ACP Docs](https://docs.stripe.com/agentic-commerce), [Stripe Agentic Commerce Blog](https://stripe.com/blog/agentic-commerce-suite), [Shared Payment Tokens](https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens)

### Auth Prerequisites

- **Asymmetric signing:** Check if Supabase project uses HS256 (default) or RS256/ES256. If HS256, must switch to asymmetric signing so MCP server can validate tokens via public JWKS without knowing JWT secret.
- **Consent page:** Supabase OAuth requires hosting an authorization/consent page. Likely a new route in Next.js app (`/oauth/consent`). This page doubles as the signup form for new users.

---

## 5. Killer Demo

### The "Friday Drop" -- 60 Seconds to Launch a Campaign

**[0-5s] Hook**
Text: "What if promoting a single took 60 seconds instead of 6 hours?"

**[5-15s] The Prompt**
User types in Claude Desktop:
> "My artist Luna Vega has a new single 'Midnight Drive' dropping Friday. Set up promotion targeting US, Mexico, and Brazil at $50/day. Pull her latest Instagram posts for creative."

**[15-35s] The Magic**
Claude calls Dynamoi tools in sequence:
1. Artist lookup -- "Found Luna Vega. 45K Spotify monthly listeners, active YouTube channel."
2. SmartLink creation -- pointing to Spotify, Apple Music, YouTube Music, Amazon Music
3. Ad copy generation -- "5 headline + 5 primary text variants using Luna Vega's Instagram voice"
4. Meta campaign deployment -- "Deploying targeting US, MX, BR at $50/day... ACTIVE."
5. YouTube Demand Gen deployment -- "Created for the music video. Budget: $50/day."

Each step: conversational cards with campaign name, status badge, budget, creative thumbnail.

**[35-50s] Proof Shot**
Split screen: Claude chat (left 60%) + Dynamoi dashboard (right 40%) updating in real-time. Two new campaigns in Active status. SmartLink page live. Spend accumulating.

Text overlay: "2 platforms. 3 countries. 10 ad variations. 47 seconds."

**[50-60s] Close**
User: "How are Luna Vega's campaigns doing?"
Claude: inline performance summary chart (impressions, clicks, spend, CPM).
Logo: "Dynamoi. Your AI marketing team."

### Why This Works (All Existing Code)

Every step maps to existing Dynamoi capabilities:
- Artist lookup: Artist domain with Spotify/YouTube/Meta connections
- SmartLink: `SmartLinkId` branded type, creation flow exists
- Ad copy: Gemini-powered, pulls Instagram/Facebook/YouTube/Spotify data (`ad-copy-generation.ts`)
- Meta deployment: Full 4-stage pipeline (`deploy-meta-campaign.ts`)
- YouTube Demand Gen: Full Google Ads deployment (`google-ads/actions/`)
- Analytics: Both Meta and Google fetching exists
- Location targeting: `LocationTargets` discriminated union
- Budgets: `DailyBudget` / `TotalBudget` types defined

**This is not vaporware.** The MCP server is a thin layer.

### Killer Follow-Up Scenarios

- "Pause all campaigns for artists under $10 remaining" -- portfolio management in one sentence
- "My artist just got playlisted. Double the budget." -- reactive marketing at conversation speed
- "Generate a weekly report for all my artists and email it" -- recurring intelligence
- "Set up campaigns for all 12 album tracks, higher budgets for lead singles" -- batch ops

### Demo Production Notes

- **Primary surface:** Claude Desktop (richest MCP, MCP Apps for inline UI)
- **Flash of ChatGPT** at end ("works everywhere")
- **Split screen live update** is the single most impactful visual technique
- **Dark mode** Claude Desktop for conferences
- **Real artist data** -- not "Test Artist 123"
- **Sound design** -- subtle pings when steps complete
- **No narration over the magic** -- let audience watch AI work
- **60s for X/Twitter** (subtitled, hook in first 3s), **3min for YouTube/LinkedIn**
- **Target conferences:** Music Tectonics (LA, Oct 2026), AI Music Tech Conference

### The Narrative

For music industry audiences:

> "You already have an AI assistant. Now it can run your marketing."

Not "we built an MCP server." Position Dynamoi as a capability their existing tools gain, not a new platform to learn.

---

## 6. ChatGPT App Directory

### The Opportunity

- **Zero music promotion apps** in the directory. Only Spotify and Apple Music (consumption-focused)
- 800M+ weekly ChatGPT users
- **Contextual discovery:** user says "help me promote my music" → ChatGPT suggests Dynamoi automatically
- B2B represented: Salesforce, Airtable, Clay, Figma, Adobe all in directory
- Enterprise admin controls: labels on ChatGPT Enterprise can enable Dynamoi for their team
- Directory still small (low hundreds of apps) -- early entrant advantage

### Strategic Gap

A ChatGPT user creates a playlist with Spotify, then asks "how do I promote my own music?" Today there's nowhere for them to go. Dynamoi fills that gap.

### Technical Architecture

ChatGPT Apps = MCP server + UI widgets + OAuth 2.1 Provider. Three components:
1. **MCP Server** -- same server that works with Claude/Cursor
2. **UI Widget Layer** -- sandboxed iframes rendering static HTML inside ChatGPT conversations
3. **OAuth 2.1** -- **you are the provider** (reversed from typical OAuth). ChatGPT is the client.

Display modes: Inline (default), Picture-in-Picture (side panel), Fullscreen (dashboards).

### Submission Requirements

- Verified developer account on OpenAI Platform
- App name, description, 512x512 icon, 3-5 screenshots
- Privacy policy URL (mandatory)
- MCP server HTTPS endpoint (not localhost)
- OAuth metadata
- Test credentials with demo account + sample data
- Tool annotations (`readOnlyHint`, `destructiveHint`, `openWorldHint`) -- mandatory, common rejection cause
- Must pass testing on both ChatGPT web and mobile
- Content Security Policy configuration

### Review Process

- 5-10 business days officially, but beta = unpredictable (some waited weeks)
- Common rejections: unclear privacy policies, missing test credentials, API timeouts, incorrect tool annotations, incomplete implementations
- After publication, tool names/descriptions are locked. Backend changes deploy automatically.

### Monetization Constraint

**Digital goods/subscriptions not yet allowed in-chat.** Expected mid-2026.

Current workaround: **external checkout** -- users discover Dynamoi through ChatGPT, sign up/pay on dynamoi.com. This actually fits the model (lead-gen funnel → platform conversion).

### Risks

1. **Monetization gap** -- lead-gen only until mid-2026 digital goods support
2. **Platform dependency** -- mitigated by standalone MCP server
3. **Data sharing** -- OpenAI Terms grant license to "use, store, copy, translate, display, modify, distribute App Responses." Worth considering for client confidentiality
4. **Auth complexity** -- full OAuth 2.1 Provider with DCR, PKCE, well-known endpoints
5. **Review uncertainty** -- beta process, unpredictable timelines
6. **"Not an ad vehicle" rule** -- must deliver genuine utility, not just funnel signups

### Recommendation

Build standalone MCP server first (works with Claude, Cursor, etc.). Wrap for ChatGPT directory second. Incremental effort is mostly OAuth Provider + widgets. Distribution upside is massive.

---

## 7. Turborepo Integration

### Package Structure

Turborepo supports mixed-visibility monorepos with Publishable Packages pattern:

```
packages/
  mcp/                    ← NEW open-source package
    src/
      server.ts           ← MCP server entry point
      tools/              ← Tool definitions
      auth/               ← Auth middleware
      transport/          ← HTTP/stdio transport
    package.json          ← publishable to npm
    tsconfig.json
    tsup.config.ts        ← bundler for npm publishing
    CHANGELOG.md
    LICENSE               ← MIT or Apache 2.0
```

### Key Design Decisions

- MCP package imports from `packages/db` (shared Prisma client) for database access
- MCP package imports domain types but NOT domain logic -- it calls into `apps/main` domain functions via an internal API or shared service layer
- The package is compiled with `tsup` for npm publishing (not JIT like internal packages)
- Uses Changesets for versioning and automated npm publishing

### Open Source Boundary

| Open Source (`packages/mcp`) | Closed Source (`apps/main`) |
|---|---|
| Tool definitions (schemas, descriptions) | Domain logic (campaign pipeline, optimization) |
| Auth middleware (JWT validation, role checking) | Money calculations (2x margin, `formatForDisplay`) |
| Transport layer (HTTP, stdio) | Ad account credentials and management |
| Response formatting (Markdown templates) | AI ad copy generation prompts |
| MCP resources/prompts | SmartLink infrastructure |

### Automated Publishing Pipeline

Code lives in the private monorepo. Publishing to npm + public GitHub is fully automated:

```
Private monorepo (this repo)
  └── packages/mcp/        ← agents edit code here

    ↓ merge to main triggers GitHub Action

Public GitHub repo (github.com/dynamoi/mcp)
  ← source synced automatically (one-way mirror)

    ↓ same GitHub Action

npm registry (@dynamoi/mcp)
  ← built package published automatically
```

**Tooling:**
- **Changesets** -- version bumps + changelogs. Agent adds a changeset file describing the change and bump level (patch/minor/major)
- **tsup** -- bundles TypeScript for npm. One config file
- **GitHub Action** -- on merge: syncs to public repo, publishes to npm (~30 lines YAML)

**Agent workflow (instructions for CLAUDE.md / skill file):**
1. Edit code in `packages/mcp/`
2. Run `bunx changeset` -- describe what changed, pick patch/minor/major
3. Commit the changeset file with the PR
4. On merge, Changesets bot opens a "Version Packages" PR bumping the version
5. When that PR merges → GitHub Action publishes to npm + syncs public repo
6. Never manually run `npm publish`

The public GitHub repo is a one-way mirror. Issues and stars accumulate there for discoverability. All actual work stays in the private monorepo.

### Future: Autonomous Agent Distribution

The MCP server is the foundation for a trajectory:

**Today (2026):**
Human asks AI for advice → AI recommends Dynamoi → human connects via OAuth popup → campaigns managed through conversation

**Mid-2026 (Stripe SPT for SaaS):**
Human says "set me up" → agent handles signup + payment + Spotify URL → only Meta/YouTube still need a browser → near-zero-friction onboarding

**Later (autonomous agents):**
Labels deploy agents that manage promotion for entire rosters. "Monitor all my artists' releases and auto-promote new singles at $50/day" → agent watches release calendars, launches campaigns, adjusts budgets, reports results. The MCP server is the API that makes this possible.

The traditional SaaS funnel: human searches Google → finds landing page → maybe signs up.

The AI-mediated funnel: human asks AI → AI already knows Dynamoi → connects and does the work.

No one in music promotion is building for the second funnel. That's the opening.

---

## 8. Distribution & SEO

### The Real Audience: AI Models, Not Developers

The MCP server isn't a developer tool. It's infrastructure that makes Dynamoi visible to AI assistants. The target user is a non-technical artist or label manager asking ChatGPT or Claude "how do I promote my music?" The goal is that the AI knows Dynamoi exists and offers to connect.

Publishing the MCP server across directories feeds model training data. Models learn "Dynamoi = music promotion" and recommend it organically in conversations. This is a new distribution channel -- AI-mediated discovery.

### Backlink Surface Area

Every listing is a high-relevance backlink from an authoritative AI/tech domain to dynamoi.com:

**MCP directories (free listings):**
- PulseMCP (pulsemcp.com) -- de facto community directory, thousands of servers
- mcp.so -- 17,500+ servers collected
- Official MCP Registry -- Linux Foundation, live in preview
- Cursor Directory
- mcpservers.org
- mcpmarket.com
- glama.ai
- Multiple "awesome-mcp-servers" GitHub repos (thousands of stars each)

**Package registries:**
- npm package page → links to GitHub + dynamoi.com
- GitHub repo → links to dynamoi.com

**App stores:**
- ChatGPT App Directory (chatgpt.com/apps)
- Gemini Extensions Marketplace (later)

**Content that writes itself:**
- "Best MCP servers for marketing" listicles -- only music one
- "MCP servers for ad management" roundups -- Outbrain, Criteo already covered
- "Music industry AI tools" articles -- first-mover = default mention
- Blog post: "How we built an MCP server for music promotion"

### Zero Competition in Music Promotion

No music promotion platform has an MCP server or ChatGPT App. The music category in every directory is empty or consumption-only (Spotify, Apple Music). Dynamoi owns this niche by default.

### AI-Mediated Discovery (The Big Bet)

As Claude Cowork, ChatGPT, and Gemini become mainstream for non-technical users:
1. Artist asks AI: "I just released a single, how do I promote it?"
2. AI gives generic advice today. With Dynamoi's MCP server registered, it can say: "I can actually do that for you through Dynamoi. Want me to connect?"
3. OAuth flow → artist is onboarded → campaigns running via conversation

This flips the funnel. Instead of SEO → landing page → signup → learn dashboard → create campaign, it's: ask AI → connect Dynamoi → campaign running. The AI IS the interface.

---

## 9. Security

### Core Principles

- **Brokered credentials:** MCP server holds API keys, agents never see them
- **2x margin enforcement:** `formatForDisplay()` at serialization boundary. `RawAdSpend` never in MCP responses
- **Role-based tool access:** READ tools = any authenticated role. WRITE tools = editor/admin only
- **Same permission checks:** `requireArtistMutationAccess`, `requireAuthenticatedUserWithArtistAccess`

### Known MCP Security Risks

- **Tool poisoning / rug pull attacks:** Malicious instructions hidden in tool descriptions. Mitigated by Dynamoi controlling its own server
- **OAuth 2.1 mandatory for remote servers:** PKCE required, short-lived tokens, auto-refresh
- **IETF On-Behalf-Of draft:** OAuth extension for AI agent delegation with dual identity tokens (human + agent)

### What Never Goes Through MCP

- Ad account credentials (Meta System Token, Google Ads tokens)
- Raw ad spend data / internal margin calculations
- Billing portal access / payment method changes
- Platform OAuth flows (Spotify, YouTube, Meta connections)
- Team/org admin operations

---

## 10. Open Questions

### Auth
1. Is Supabase currently using HS256 or RS256/ES256? If HS256, switching to asymmetric signing is a prerequisite.
2. Where does the OAuth consent page live? New route in Next.js app (`/oauth/consent`)?
3. Where does the MCP server run? Cloudflare Workers, Vercel Edge, standalone Node on Fly/Railway?

### Architecture
4. How does the MCP package access domain logic? Direct import from `packages/db` + new shared service layer? Or internal API calls to the Next.js app?
5. Does the MCP server need its own Prisma client, or import from `packages/db`?
6. How to handle the open-source boundary -- what's the interface between the public MCP package and the private domain logic?

### Business
7. Should we launch with read-only tools first (zero risk) and add writes later?
8. ChatGPT App Directory: worth the effort now, or wait until MCP server is stable?
9. Pricing implications: does MCP access count as a feature tier, or is it available to all plans?

### Technical
10. Tool response format: Markdown vs JSON vs hybrid with `format` parameter?
11. MCP Apps (inline UI components): worth building for the demo, or overkill for MVP?
12. Rate limiting strategy for MCP API calls?

---

## 11. Sources

### Protocol & Landscape
- [MCP Specification (Nov 2025)](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Authorization Spec (Draft)](https://modelcontextprotocol.io/specification/draft/basic/authorization)
- [Anthropic: Writing Tools for Agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Cloudflare MCP Demo Day](https://blog.cloudflare.com/mcp-demo-day/)
- [A Year of MCP Review](https://www.pento.ai/blog/a-year-of-mcp-2025-review)

### MCP Server Examples
- [Stripe MCP Docs](https://docs.stripe.com/mcp)
- [Notion MCP Tools](https://developers.notion.com/docs/mcp-supported-tools)
- [Notion Hosted MCP: Inside Look](https://www.notion.com/blog/notions-hosted-mcp-server-an-inside-look)
- [Sentry MCP Server](https://docs.sentry.io/product/sentry-mcp/)
- [Sentry MCP GitHub](https://github.com/getsentry/sentry-mcp)
- [Meta Ads MCP (Pipeboard)](https://github.com/pipeboard-co/meta-ads-mcp)
- [Google Ads MCP](https://github.com/cohnen/mcp-google-ads)
- [MCP "Too Many Tools" Problem](https://demiliani.com/2025/09/04/model-context-protocol-and-the-too-many-tools-problem/)
- [Speakeasy: 100x Token Reduction](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2)
- [Shopify MCP UI](https://shopify.engineering/mcp-ui-breaking-the-text-wall)
- [Criteo MCP Lessons](https://medium.com/criteo-engineering/agents-apis-and-advertising-lessons-from-engineering-our-mcp-server-2d160a743acd)

### Auth & Security
- [Supabase OAuth 2.1 Server](https://supabase.com/docs/guides/auth/oauth-server)
- [Supabase MCP Auth Guide](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)
- [Supabase OAuth Flows](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows)
- [Supabase OAuth Discussion #38022](https://github.com/orgs/supabase/discussions/38022)
- [Scalekit: API Keys to OAuth for MCP](https://www.scalekit.com/blog/migrating-from-api-keys-to-oauth-mcp-servers)
- [Auth0: MCP and Authorization](https://auth0.com/blog/an-introduction-to-mcp-and-authorization/)
- [Stytch: MCP Auth Guide](https://stytch.com/blog/MCP-authentication-and-authorization-guide/)
- [Cerbos: MCP Fine-Grained Access](https://www.cerbos.dev/blog/mcp-authorization)
- [Descope: Progressive Scoping](https://www.descope.com/blog/post/progressive-scoping)

### ChatGPT App Directory
- [OpenAI: Submit Apps to ChatGPT](https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/)
- [App Submission Guidelines](https://developers.openai.com/apps-sdk/app-submission-guidelines/)
- [Apps SDK: Build MCP Server](https://developers.openai.com/apps-sdk/build/mcp-server/)
- [Apps SDK: Auth](https://developers.openai.com/apps-sdk/build/auth/)
- [Apps SDK: Monetization](https://developers.openai.com/apps-sdk/build/monetization/)
- [Apps SDK: ChatGPT UI](https://developers.openai.com/apps-sdk/build/chatgpt-ui/)
- [App Developer Terms](https://openai.com/policies/developer-apps-terms/)
- [ChatGPT Admin Controls](https://help.openai.com/en/articles/11509118-admin-controls-security-and-compliance-in-apps-enterprise-edu-and-business)
- [Gadget: Building ChatGPT Apps](https://gadget.dev/blog/everything-you-need-to-know-about-building-chatgpt-apps)
- [Stytch: OpenAI Apps SDK Auth](https://stytch.com/blog/guide-to-authentication-for-the-openai-apps-sdk/)

### Claude & Gemini
- [Claude Integrations](https://claude.com/blog/integrations)
- [MCP Apps Announcement](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [Custom Remote MCP Setup](https://support.claude.com/en/articles/11175166-getting-started-with-custom-integrations-using-remote-mcp)
- [PulseMCP Directory](https://www.pulsemcp.com/)
- [Gemini Extensions Marketplace](https://www.linkedin.com/posts/jack-wotherspoon_gemini-cli-extensions-marketplace-is-now-activity-7381743766644195329-No8-)
- [Google UCP](https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/)

### Demo & Marketing
- [Alex Albert MCP Demo](https://x.com/alexalbert__/status/1861079874385203522)
- [OpenAI Frontier](https://openai.com/business/frontier/)
- [Music Tectonics Conference](https://www.musictectonics.com/conference)
- [AI Music Tech Conference](https://www.aimusictechconference.com/)
- [Superside SaaS Video Examples](https://www.superside.com/blog/saas-video-examples)
