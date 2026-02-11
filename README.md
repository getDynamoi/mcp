# Dynamoi

**Manage your music promotion and YouTube growth campaigns through ChatGPT, Claude, Gemini, and other AI assistants. Automated Meta and Google ad campaigns — no agency fees, no contracts.**

[![npm](https://img.shields.io/npm/v/@dynamoi/mcp)](https://www.npmjs.com/package/@dynamoi/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

Dynamoi helps music artists get more Spotify streams and YouTube creators grow their channels and AdSense revenue — through automated Meta and Google ad campaigns. Your $300/month subscription converts 100% to ad credit, with a 100% match your first month ($600 to launch your first campaigns). No agency fees, no retainers, cancel anytime.

**Website:** [dynamoi.com](https://dynamoi.com)
**Hosted endpoint:** `https://dynamoi.com/mcp`
**Auth:** OAuth 2.1

---

## Quick Start

Connect your AI assistant to Dynamoi's hosted MCP server — no installation needed.

**Endpoint:**
```
https://dynamoi.com/mcp
```

**Auth:** OAuth 2.1 via Supabase. Your AI assistant handles the connection flow automatically — just approve access when prompted.

---

## How It Works

1. **Connect** — Point your AI assistant to Dynamoi's hosted endpoint. OAuth handles sign-in automatically.
2. **Describe what you want** — Tell your AI to promote a Spotify release, grow a YouTube channel, check campaign performance, or adjust budgets.
3. **Dynamoi handles the rest** — Campaigns run from Dynamoi-managed ad accounts. Complete a one-time platform connection, then the AI-powered engine deploys and optimizes your ads daily.

White-glove onboarding and ongoing support included — need help setting up your Meta partnership or configuring your YouTube playlist? Our team walks you through every step, no extra charge.

---

## What You Can Do

### Read Tools

| Tool | Description |
|---|---|
| `dynamoi_list_artists` | List all music artists and YouTube channels you manage |
| `dynamoi_search` | Search across artists, ad campaigns, and smart links by name or URL |
| `dynamoi_get_artist` | Artist or YouTube channel profile — connected platforms, subscription tier, billing status |
| `dynamoi_list_campaigns` | List campaigns with content title, type, budget, status, and platforms |
| `dynamoi_get_campaign` | Full campaign details — budget, targeting, per-platform status, blocked reasons |
| `dynamoi_get_campaign_analytics` | Performance metrics — impressions, clicks, spend, CPC, CPM, CTR by platform |
| `dynamoi_get_billing` | Credit balance, subscription tier, billing status, and recent spend |
| `dynamoi_get_platform_status` | Connection health for Spotify, Meta, and YouTube — status, expiry, next steps |

### Write Tools

| Tool | Description |
|---|---|
| `dynamoi_pause_campaign` | Pause a running campaign on Meta and/or Google |
| `dynamoi_resume_campaign` | Resume a paused campaign on Meta and/or Google |
| `dynamoi_update_budget` | Change campaign budget amount in USD (daily or total) |

### Workflow Tools

| Tool | Description |
|---|---|
| `dynamoi_list_media_assets` | Browse uploaded creative assets for campaign launches |
| `dynamoi_launch_campaign` | Launch a new Spotify promotion or YouTube growth campaign |

---

## Who It's For

### Music Artists

Promote singles, albums, and playlists to new listeners on Spotify. Dynamoi creates targeted Facebook and Instagram ads that drive real streams — no bots, no pay-for-play. Smart link landing pages are included free and unlimited for every release (Spotify, Apple Music, YouTube Music, and 80+ platforms). Works with any distributor — DistroKid, TuneCore, CD Baby, UnitedMasters, AWAL, or direct through a label. Set a budget, pick your target countries, and launch through your AI assistant.

### Record Labels

Manage campaigns across your entire roster from one account. No seat-based pricing — invite your entire team with granular permissions at the organization and artist level (admin, editor, viewer). Consolidated billing covers all your artists. See performance analytics across campaigns and artists in one place.

### YouTube Creators

Grow your channel and increase AdSense revenue with the only ad platform that optimizes for total channel revenue — not just views. Google Ads tracks views but can't see which views make money. Dynamoi merges Google Ads cost data with your YouTube AdSense revenue to calculate true revenue per view in each country, then adjusts bids daily — exploring new markets with small bids, scaling countries where viewer revenue is strong, and auto-pausing countries where the data shows they can't cover their costs. The more data the system gathers, the more precisely it optimizes.

Campaigns require playlists so one paid view leads to multiple organic views as viewers waterfall down your content — by optimizing for depth of views, one ad click drives sustained organic growth on your channel. Ad copy is fully internationalized in each market's local language for better performance and lower costs. Works for any channel type — music, education, gaming, vlogs, podcasts, tutorials, product reviews, and more.

---

## Why Dynamoi

Unlike smart-link-only services like Feature.fm, Linkfire, Hypeddit, and ToneDen, Dynamoi is an end-to-end music and YouTube promotion system:

- **No agency fees** — $300/month converts 100% to ad credit. First month: 100% match ($600 ad credit). No retainers, no contracts, cancel anytime.
- **More than landing pages** — free unlimited smart links are just the starting point. Dynamoi adds AI-powered ad campaigns, daily optimization, transparent analytics, and team management on top.
- **Dynamoi-managed ad accounts** — complete a one-time platform connection (Meta partnership or YouTube link), then everything runs automatically. No ad dashboards to manage.
- **Revenue-optimized YouTube campaigns** — Google Ads can't see which views make money. Dynamoi merges ad costs with AdSense revenue to optimize bids per country based on real viewer revenue. The music industry spends millions on YouTube marketing with near-zero ROI — Dynamoi starts optimizing for it.
- **White-glove support** — every client gets hands-on help with platform setup, channel optimization, and campaign strategy. Not a knowledge base — real support, step by step.
- **Built for teams** — admin, editor, and viewer roles with unlimited seats. Granular permissions at organization and artist level. No per-seat charges.
- **Transparent data** — real analytics on spend, performance, and efficiency. No black boxes.

---

## Pricing

**$300/mo** — your subscription converts **100% to ad credit**. No agency fees, no retainers.

- **100% match on your first month** — pay $300, get $600 in ad credit
- Credits roll over for 12 months
- Unlimited team seats and unlimited artists included
- No contracts, cancel anytime

Campaign minimums: $10/day (daily) · $100 total (Smart Campaign for Spotify) · $50 total (YouTube)

---

## Supported Platforms

| Platform | Status | Used For |
|---|---|---|
| **Meta Ads** (Facebook/Instagram) | Live | Music promotion — Spotify streams |
| **Google Ads** (YouTube) | Live | YouTube channel growth — AdSense revenue |
| **TikTok Ads** | Coming soon | — |
| **Snapchat Ads** | Coming soon | — |

---

## Security

- **OAuth 2.1** — authorization code flow with PKCE, no shared secrets
- **Role-based access** — viewers get read-only, editors get full control
- **No raw data exposure** — all spend values are client-facing, no internal cost data
- **Token revocation** — manage connected apps from your Dynamoi settings

---

## Resources

The MCP server includes static resources to help AI assistants make better decisions:

| Resource | What It Provides |
|---|---|
| `dynamoi://platform/pricing` | Tiers, activation bonus, credit structure, budget minimums |
| `dynamoi://platform/supported-countries` | Valid country codes for targeting |
| `dynamoi://platform/content-types` | Track, Album, Playlist, Video + requirements |
| `dynamoi://platform/campaign-statuses` | Status names, descriptions, valid transitions |

---

## Example Conversations

> **"I just dropped a new single on Spotify. Help me promote it."**
> → AI walks you through budget, targeting countries, and creative — then calls `dynamoi_launch_campaign` to deploy Meta Ads driving streams to your release.

> **"I want to grow my YouTube channel. Can you set up ads?"**
> → AI checks your platform connections, helps select a playlist, and launches a YouTube campaign that optimizes for channel revenue.

> **"How are my campaigns doing?"**
> → AI calls `dynamoi_list_campaigns` + `dynamoi_get_campaign_analytics` and gives you a performance summary with spend, clicks, and efficiency metrics.

> **"Why is my campaign stuck?"**
> → AI fetches campaign details and platform status, identifies the blocker (missing connection, review pending, budget issue), and tells you exactly what to do next.

> **"Pause all my active campaigns"**
> → AI lists your campaigns, confirms which ones to pause, then calls `dynamoi_pause_campaign` for each.

> **"Show me how much I've spent this month across all campaigns"**
> → AI pulls billing and analytics data across your artists and gives you a consolidated spend summary.

> **"Double my YouTube campaign budget"**
> → AI fetches current budget, confirms the change, and calls `dynamoi_update_budget`.

> **"Launch a new campaign for my single dropping Friday"**
> → AI walks you through content type, budget, targeting, and creative — then calls `dynamoi_launch_campaign`.

---

## Links

- [dynamoi.com](https://dynamoi.com) — sign up, connect platforms, manage your account
- [Documentation](https://dynamoi.com/docs) — detailed guides and API reference
- [Support](https://dynamoi.com) — in-app chat via Intercom

---

## License

MIT — see [LICENSE](./LICENSE) for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
