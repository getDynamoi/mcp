# 🎵 Dynamoi

**Promote music and grow YouTube channels with AI. Run Meta and Google ad campaigns through any AI assistant.**

[![npm](https://img.shields.io/npm/v/@dynamoi/mcp)](https://www.npmjs.com/package/@dynamoi/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

Dynamoi helps music artists get more Spotify streams and YouTube creators grow their channels and AdSense revenue — through automated Meta and Google ad campaigns. No agency fees — your subscription converts 100% to ad credit.

Works with ChatGPT, Claude, Gemini, Cursor, and other AI assistants. **$600 activation bonus** for new users.

🔗 **Website:** [dynamoi.com](https://dynamoi.com)
📡 **Hosted endpoint:** `https://dynamoi.com/api/mcp`
🔐 **Auth:** OAuth 2.1

---

## 🚀 Quick Start

Connect your AI assistant to Dynamoi's hosted MCP server — no installation needed.

**Endpoint:**
```
https://dynamoi.com/api/mcp
```

**Auth:** OAuth 2.1 via Supabase. Your AI assistant handles the connection flow automatically — just approve access when prompted.

## For Developers

This npm package primarily exists for AI discoverability and directory listings. It contains the public tool contract (schemas/types) and transport helpers. Most developers should use the hosted endpoint rather than self-host.

---

## 🎯 What You Can Do

### 📊 Read Tools

| Tool | Description |
|---|---|
| `dynamoi_list_artists` | See all artists and YouTube channels you manage |
| `dynamoi_search` | Search across artists, campaigns, and smart links |
| `dynamoi_get_artist` | Artist profile, connections, onboarding status |
| `dynamoi_list_campaigns` | List campaigns with budget, status, and platform info |
| `dynamoi_get_campaign` | Full campaign details including platform-specific status |
| `dynamoi_get_campaign_analytics` | Performance metrics — impressions, clicks, spend, CPC, CPM |
| `dynamoi_get_billing` | Credit balance, tier, and recent usage |
| `dynamoi_get_platform_status` | Connection health for Spotify, Meta, and YouTube |

### ✏️ Write Tools

| Tool | Description |
|---|---|
| `dynamoi_pause_campaign` | Pause an active campaign across all platforms |
| `dynamoi_resume_campaign` | Resume a paused campaign |
| `dynamoi_update_budget` | Change campaign budget (daily or total) |

### 🚀 Workflow Tools

| Tool | Description |
|---|---|
| `dynamoi_list_media_assets` | Browse existing creative assets for campaign launches |
| `dynamoi_launch_campaign` | Create a new campaign — the AI gathers all inputs conversationally |

---

## 🎶 Who It's For

- **Music artists** — promote singles, albums, and playlists on Spotify through Meta Ads (Facebook/Instagram)
- **Record labels** — manage campaigns across entire rosters with team roles and consolidated billing
- **YouTube creators of all kinds** — grow channels and AdSense revenue through YouTube Ads (Google Demand Gen)

---

## 💰 Pricing

**$300/mo** — your subscription converts **100% to ad credit**. No agency fees, no retainers.

- **$600 activation bonus** on your first month (total $900 ad credit month one)
- Credits roll over for 12 months
- Unlimited team seats included

Campaign minimums: $10/day (daily) · $100 total (Meta) · $50 total (YouTube)

---

## 🌍 Supported Platforms

| Platform | Status | Used For |
|---|---|---|
| **Meta Ads** (Facebook/Instagram) | ✅ Live | Music promotion → Spotify streams |
| **Google Ads** (YouTube Demand Gen) | ✅ Live | YouTube channel growth → AdSense revenue |
| **TikTok Ads** | 🔜 Coming soon | — |
| **Snapchat Ads** | 🔜 Coming soon | — |

---

## 🔒 Security

- **OAuth 2.1** — authorization code flow with PKCE, no shared secrets
- **Role-based access** — viewers get read-only, editors get full control
- **No raw data exposure** — all spend values are client-facing, no internal cost data
- **Token revocation** — manage connected apps from your Dynamoi settings

---

## 📚 Resources

The MCP server includes static resources to help AI assistants make better decisions:

| Resource | What It Provides |
|---|---|
| `dynamoi://platform/pricing` | Tiers, credit structures, budget minimums |
| `dynamoi://platform/supported-countries` | Valid country codes for targeting |
| `dynamoi://platform/content-types` | Track, Album, Playlist, Video + requirements |
| `dynamoi://platform/campaign-statuses` | Status names, descriptions, valid transitions |

---

## 💬 Example Conversations

> **"How are my campaigns doing?"**
> → AI calls `dynamoi_list_campaigns` + `dynamoi_get_campaign_analytics` and gives you a performance summary.

> **"Pause all my active campaigns"**
> → AI lists your campaigns, confirms which ones to pause, then calls `dynamoi_pause_campaign` for each.

> **"Launch a new campaign for my single dropping Friday"**
> → AI walks you through content type, budget, targeting, and creative — then calls `dynamoi_launch_campaign`.

> **"Double my YouTube campaign budget"**
> → AI fetches current budget, confirms the change, and calls `dynamoi_update_budget`.

---

## 🔗 Links

- 🌐 [dynamoi.com](https://dynamoi.com) — sign up, connect platforms, manage your account
- 📖 [Documentation](https://dynamoi.com/docs) — detailed guides and API reference
- 💬 [Support](https://dynamoi.com) — in-app chat via Intercom

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md).
