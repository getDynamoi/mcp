# MCP Server Publishing & Distribution Checklist

> **Status:** Ready for Phase 5
> **Last updated:** 2026-02-11
> **Package:** `@dynamoi/mcp`
> **Related:** `packages/mcp/docs/spec.md` (Section 8: Distribution & Publishing)

---

## Canonical Messaging (copy-paste everywhere)

All public-facing descriptions must use these approved blocks. Do not improvise.

### One-Liner (≤100 chars, used in server.json)

> Promote music on Spotify and grow YouTube channels through AI-powered Meta and Google ad campaigns.

### Short Description (MCP directories, app stores, package.json)

> Manage music promotion and YouTube growth campaigns through AI assistants like ChatGPT, Claude, and Gemini. Automated Meta and Google ad campaigns for artists, labels, and YouTube creators — no agency fees.

### Long Description (README intro, detailed listings)

> Dynamoi helps music artists get more Spotify streams and YouTube creators grow their channels and AdSense revenue — through automated Meta and Google ad campaigns. Your $300/month subscription converts 100% to ad credit, with a 100% match your first month ($600 to launch your first campaigns). No agency fees, no retainers, cancel anytime.

### Company Bio (directory profiles, about sections)

> Dynamoi gives AI assistants the power to run sophisticated ad campaigns for music artists, labels, and YouTube creators. Describe a release or channel to promote — Dynamoi automates deployment across Meta and Google, then optimizes daily for what actually matters: Spotify saves and YouTube AdSense revenue, not impressions and vanity metrics. Every dollar of subscription converts to ad credit.

### GitHub Awesome-List PR Description (one line)

> Promote music on Spotify and grow YouTube channels through automated Meta and Google ad campaigns.

### MCP Server Instructions (what AI agents read)

Full instructions are in `packages/mcp/src/server/instructions.ts`. Key opening:

> Dynamoi helps music artists get more Spotify streams and YouTube creators grow their channels and AdSense revenue — through automated ad campaigns on Meta (Facebook/Instagram) and Google (YouTube).

### How to Describe the Audience

> Music artists, record labels, and YouTube creators of all kinds.

### How to Describe Campaign Types (public)

In tool descriptions and user-facing copy, use descriptive names:

- "Smart Campaign" — Meta Ads driving Spotify streams
- "YouTube Campaign" — Google Ads for YouTube channel growth and AdSense revenue

In directory listings, use platform names:

- "Meta Ads campaigns" or "Facebook/Instagram ads"
- "Google Ads campaigns" or "YouTube ads"

### How to Describe the Pricing

> $300/month converts 100% to ad credit. First month: 100% match — pay $300, get $600 ad credit. No agency fees, no contracts, cancel anytime. Unlimited team seats and unlimited artists included.

### How to Describe Support

> White-glove onboarding and ongoing support — from connecting platforms to optimizing channels for campaign performance, step by step.

### How to Describe vs Competitors

> Unlike smart-link-only services like Feature.fm, Linkfire, Hypeddit, and ToneDen, Dynamoi is an end-to-end promotion system: smart links + ad campaigns + AI optimization + analytics + team management.

### One-Sentence MCP Explanation (for non-technical audiences)

> Works with ChatGPT, Claude, Gemini, and other AI assistants.

### Tags / Categories (use across all directories)

```
music-promotion, youtube-growth, spotify-marketing, record-label-tools,
artist-marketing, ad-automation, youtube-ads, music-advertising,
spotify-streams, facebook-ads, instagram-ads
```

### Canonical Listing Data

| Field | Value |
|---|---|
| Name | Dynamoi |
| npm package | `@dynamoi/mcp` |
| License | MIT |
| Auth | OAuth 2.1 (Supabase) |
| Hosted endpoint | `https://dynamoi.com/mcp` |
| Website | `https://dynamoi.com` |
| GitHub | `https://github.com/getDynamoi/mcp` |
| Supported platforms | Meta Ads (Facebook/Instagram), Google Ads (YouTube) |
| Coming soon | TikTok Ads, Snapchat Ads |
| Tools | 13 (8 read, 3 write, 2 workflow) |
| Pricing | $300/mo (100% ad credit), first month 100% match ($600 credit) |
| Smart links | Unlimited, free, included |
| Teams | Unlimited seats, no per-seat pricing |

### Keywords (for npm, GitHub topics, SEO)

```
mcp, model-context-protocol, music-promotion, youtube-growth,
spotify-marketing, meta-ads, google-ads, campaign-management,
record-label-tools, artist-marketing, ad-automation, youtube-ads,
music-advertising, spotify-streams, facebook-ads, instagram-ads
```

---

## Submission Order (do top to bottom)

### Wave 1: Foundation (do first)

Optimize the canonical sources that all directories link back to.

- [x] **npm package metadata** — homepage, repository, bugs, keywords, description, first-paragraph link to dynamoi.com
- [x] **GitHub public mirror** — topics, About section, social preview image, README with one-liner + keywords in first 10 lines
- [x] **Add `mcpName` in `package.json` + `server.json` at package root** (required for Official MCP Registry)
- [x] **`llms.txt` / `llms-full.txt`** — add MCP server details, tool list, hosted endpoint, auth method

### Wave 2: Official MCP Registry (unlocks aggregators)

- [x] **Official MCP Registry** — publish via `mcp-publisher` CLI

### Wave 3: Top MCP Directories

- [x] **Smithery** — published at https://smithery.ai/server/dynamoi/music-youtube-marketing-mcp
- [~] **Glama** — submitted 2026-02-12, pending review
- [~] **PulseMCP** — auto-ingests from Official MCP Registry weekly, published 2026-02-12
- [~] **mcp.so** — submitted 2026-02-12, unclear if submission went through — follow up
- [~] **Cursor Directory** — submitted 2026-02-12, follow up to confirm published

### Wave 4: GitHub Awesome Lists (PRs)

- [~] **punkpeye/awesome-mcp-servers** (80.6k stars) — PR #1959 submitted 2026-02-12
- [x] **modelcontextprotocol/servers** (78.3k stars) — N/A, reference repo only, we published to their registry instead
- [~] **appcypher/awesome-mcp-servers** (5.1k stars) — PR #303 submitted 2026-02-12
- [x] **wong2/awesome-mcp-servers** (3.5k stars) — N/A, redirects to Official MCP Registry
- [ ] **cline/mcp-marketplace** (754 stars) — low priority, niche
- [ ] **TensorBlock/awesome-mcp-servers** (539 stars) — low priority, unclear process

### Wave 5: Remaining MCP Directories

Skipped — low DA sites with minimal backlink value. The Official MCP Registry, npm, GitHub, and Smithery provide far more SEO value. Many submission forms were broken or sites were down (2026-02-12).

### Wave 6: ChatGPT / AI Platforms

- [ ] **ChatGPT GPT Store** — publish a Dynamoi GPT (fast, lower effort)
- [ ] **ChatGPT Apps Directory** — full Apps SDK submission (Phase 6 in spec)
- [ ] **Claude remote MCP submission** — when available
- [ ] **Gemini Extensions Marketplace** — when third-party listing opens

### Wave 7: SaaS & Marketing Directories

- [ ] **Product Hunt** — launch with screenshots + one-liner
- [ ] **G2** — claim/create free profile
- [ ] **AlternativeTo** — self-serve submission
- [ ] **SaaSHub** — self-serve listing
- [ ] **Capterra** — vendor "get listed" form
- [ ] **GetApp** — vendor "get listed" form
- [ ] **Software Advice** — vendor "get listed" form
- [ ] **TrustRadius** — vendor form
- [ ] **SourceForge** — vendor form

### Wave 8: AI Tool Aggregators

- [ ] **There's An AI For That** (theresanaiforthat.com)
- [ ] **Toolify** (toolify.ai)
- [ ] **Futurepedia** (futurepedia.io)
- [ ] **TopAI.tools** (topai.tools)
- [ ] **AI Top Tools** (aitoptools.com)
- [ ] **AIYARD**
- [ ] **BestofAI**
- [ ] **AI Superhub**
- [ ] **ToolAI.io**
- [ ] **Grovers AI**
- [ ] **Startupik**
- [ ] **SaaSPirate**

### Wave 9: Structured Data & Indexing

- [ ] **Schema.org `SoftwareApplication`** on dynamoi.com landing pages
- [ ] **Google Search Console** — submit sitemap
- [ ] **Bing Webmaster Tools** — submit sitemap
- [ ] **Yandex Webmaster** — submit sitemap
- [ ] **IndexNow** — implement for fast Bing indexing
- [ ] **`llms.txt`** — add MCP details (one-liner, keywords, tools, endpoint, auth)

### Wave 10: Startup & Entity Directories

- [ ] **Crunchbase** — claim/create profile
- [ ] **Wellfound (AngelList)** — create profile
- [ ] **LinkedIn Company Page** — ensure consistent one-liner + website
- [ ] **Meta Business Partner Directory** — apply if eligible
- [ ] **Google Partners Directory** — apply if eligible

### Wave 11: Content & Community

- [ ] **Hacker News (Show HN)** — "Show HN: Dynamoi — promote music and grow YouTube channels via AI chat"
- [ ] **Dev.to** — write "How to run music and YouTube ad campaigns from an AI assistant"
- [ ] **Hashnode** — cross-post or original
- [ ] **Medium** — cross-post or original
- [ ] **Reddit r/mcp** — post about the MCP server
- [ ] **Reddit r/musicmarketing** — post about Meta + YouTube ads through conversation
- [ ] **Reddit r/ChatGPT** — post about Dynamoi ChatGPT integration
- [ ] **Reddit r/ClaudeAI** — post about Claude integration
- [ ] **Indie Hackers** — ship log + how-we-built-it post
- [ ] **dynamoi.com/mcp landing page** — SEO-optimized for "music promotion AI", "promote music with ChatGPT"

### Wave 12: Music Industry (editorial outreach)

- [ ] **Music Tectonics ecosystem map** — apply for inclusion
- [ ] **Music Ally** — pitch as "AI marketing team for music"
- [ ] **Hypebot** — pitch coverage
- [ ] **Music Business Worldwide** — pitch as industry tool
- [ ] **AI Music Tech Conference** — speaker/sponsor inquiry

---

## Detailed Directory Reference

### 1. MCP-Specific Directories

| # | Name | Submission URL | Backlink | AI Training | Type | Effort | Status |
|---|---|---|---|---|---|---|---|
| 1 | Official MCP Registry | `modelcontextprotocol.io/registry/quickstart` | Yes | High | CLI publish (`mcp-publisher`) | Medium | |
| 2 | Smithery | `smithery.ai/new` | Conditional | High | Self-serve publish | Medium | |
| 3 | Glama | `glama.ai/mcp/servers` | Conditional | High | Self-serve "Add Server" | Low-Med | |
| 4 | PulseMCP | `pulsemcp.com/submit` | Conditional | High | Form | Low | |
| 5 | mcp.so | `mcp.so/submit` | Conditional | High | Form | Low | |
| 6 | Cursor Directory | `cursor.directory/mcp/new` | Yes | High | Self-serve (login) | Low | |
| 7 | mcpmarket.com | `mcpmarket.com/submit` | Yes | Med-High | Form | Low | |
| 8 | mcpservers.org | `mcpservers.org/submit` | Yes | Med-High | Form | Low | |
| 9 | mcpservers.com | `mcpservers.com/submit` | Yes | Medium | Form | Low | |
| 10 | mcpserverslist.com | `mcpserverslist.com/submit` | Yes | Medium | Form | Low | |
| 11 | mcpserve.com | `mcpserve.com/submit` | Yes | Medium | Form or GitHub PR | Low | |
| 12 | mcpserver.directory | `mcpserver.directory/submit` | Conditional | Medium | Login-gated submit | Low | |
| 13 | mcpindex.net | `mcpindex.net/en/contact` | Conditional | Medium | Contact form | Low | |
| 14 | MCP Server Hub (.net) | `mcpserverhub.net/submit` | Conditional | Medium | Form | Low | |
| 15 | MCP Server Hub (.com) | `mcpserverhub.com/en/submit` | Conditional | Medium | Form | Low | |
| 16 | MCP Directory (mcpserverdirectory.org) | `mcpserverdirectory.org/submit` | Conditional | Medium | Form | Low | |
| 17 | mcpserver.dev | `mcpserver.dev/submit` | Conditional | Medium | Form | Low | |
| 18 | AwesomeMCPServer.com | `awesomemcpserver.com` | Conditional | Medium | On-site submit | Low | |
| 19 | MCP Servers Hub (alt) | `mcp-servers-hub.net` | Conditional | Low-Med | Unknown | Low | |
| 20 | MCPera | `mcpera.com/submit` | Conditional | Low-Med | Form | Low | |

### 2. GitHub Awesome Lists

| # | Name | PR URL | Stars | Backlink | AI Training | Effort |
|---|---|---|---|---|---|---|
| 1 | punkpeye/awesome-mcp-servers | `github.com/punkpeye/awesome-mcp-servers/compare` | 80.6k | Yes (README) | High | Medium |
| 2 | modelcontextprotocol/servers | `github.com/modelcontextprotocol/servers/compare` | 78.3k | Conditional | High | Medium |
| 3 | appcypher/awesome-mcp-servers | `github.com/appcypher/awesome-mcp-servers/compare` | 5.1k | Yes | High | Low |
| 4 | wong2/awesome-mcp-servers | `github.com/wong2/awesome-mcp-servers/compare` | 3.5k | Yes | High | Low |
| 5 | cline/mcp-marketplace | `github.com/cline/mcp-marketplace/compare` | 754 | Conditional | Med-High | Medium |
| 6 | TensorBlock/awesome-mcp-servers | `github.com/TensorBlock/awesome-mcp-servers/compare` | 539 | Yes | Medium | Low |

**PR description to use:**

```markdown
- [Dynamoi](https://dynamoi.com) - Promote music on Spotify and grow YouTube channels through automated Meta and Google ad campaigns. ([GitHub](https://github.com/getDynamoi/mcp))
```

### 3. AI Tool Aggregators

| # | Name | Submission URL | Backlink | AI Training | Type | Effort |
|---|---|---|---|---|---|---|
| 1 | There's An AI For That | `theresanaiforthat.com` | Conditional | High | Self-serve | Medium |
| 2 | Toolify | `toolify.ai` | Conditional | High | Self-serve | Medium |
| 3 | Futurepedia | `futurepedia.io` | Conditional | High | Self-serve | Medium |
| 4 | TopAI.tools | `topai.tools` | Conditional | Medium | Self-serve | Low |
| 5 | AI Top Tools | `aitoptools.com` | Conditional | Medium | Self-serve | Low |
| 6 | AIYARD | `aiyard.net/submit-an-ai/` | Conditional | Medium | Form | Low |
| 7 | BestofAI | `bestofai.com` | Conditional | Medium | On-site submit | Low |
| 8 | AI Superhub | `aisuperhub.io/ai-tools/audio` | Conditional | Medium | On-site submit | Low |
| 9 | ToolAI.io | `toolai.io` | Conditional | Low-Med | Dashboard | Medium |
| 10 | Grovers AI | `grovers.io` | Conditional | Low-Med | Dashboard | Medium |
| 11 | Startupik | `startupik.com/add/` | Yes | Medium | Form | Low |
| 12 | SaaSPirate | `saaspirate.com/submit-saas/` | Conditional | Low-Med | Form | Low |

### 4. App Stores & Marketplaces

| # | Name | Submission URL | Backlink | AI Training | Type | Effort |
|---|---|---|---|---|---|---|
| 1 | ChatGPT GPT Store | `help.openai.com/en/articles/8798878` | Conditional | Medium | In-product publish | Medium |
| 2 | ChatGPT Apps Directory | `developers.openai.com/apps-sdk/deploy/submission` | Conditional | Medium | Platform review | High |
| 3 | Cline MCP Marketplace | `github.com/cline/mcp-marketplace/compare` | Conditional | Med-High | PR | Medium |
| 4 | Cursor Directory | `cursor.directory/mcp/new` | Yes | High | Self-serve | Low |

### 5. Package Registries & Developer Discovery

| # | Name | URL | Backlink | AI Training | Type | Effort | Notes |
|---|---|---|---|---|---|---|---|
| 1 | npm | `npmjs.com/package/@dynamoi/mcp` | Yes | High | Planned publish | Low | Optimize metadata |
| 2 | GitHub | `github.com/getDynamoi/mcp` | Yes | High | Self-serve | Low | Topics + About + preview image |
| 3 | Libraries.io | `libraries.io` | Conditional | Medium | Auto-indexed | None | Ensure npm metadata is correct |
| 4 | Socket.dev | `socket.dev` | Conditional | Medium | Auto-indexed | None | Ensure npm metadata is correct |
| 5 | Snyk Advisor | `snyk.io/advisor/` | Conditional | Medium | Auto-indexed | None | Ensure npm metadata is correct |
| 6 | Bundlephobia | `bundlephobia.com` | Low | Low-Med | Auto-indexed | None | Automatic |

### 6. SaaS & Marketing Directories

| # | Name | Submission URL | Backlink | AI Training | Type | Effort |
|---|---|---|---|---|---|---|
| 1 | Product Hunt | `producthunt.com/posts/new` | Yes | High | Self-serve launch | Medium |
| 2 | G2 | `learn.g2.com/claim-free-g2-profile` | Conditional | High | Request form | Medium |
| 3 | AlternativeTo | `alternativeto.net/software/add/` | Conditional | High | Self-serve | Low |
| 4 | SaaSHub | `saashub.com/add` | Yes | Med-High | Self-serve | Low |
| 5 | Capterra | Vendor portal (varies) | Conditional | High | Form + review | High |
| 6 | GetApp | Vendor portal (varies) | Conditional | High | Form + review | High |
| 7 | Software Advice | Vendor portal (varies) | Conditional | High | Form + review | High |
| 8 | TrustRadius | `trustradius.com/vendors` | Conditional | Medium | Form | Medium |
| 9 | SourceForge | `sourceforge.net/software/vendors/` | Conditional | Medium | Vendor form | Medium |

### 7. Music Industry (editorial outreach)

| # | Name | URL | Backlink | AI Training | Type | Effort |
|---|---|---|---|---|---|---|
| 1 | Music Tectonics | `musictectonics.com` | Conditional | Medium | Editorial / application | High |
| 2 | Music Ally | (varies) | Conditional | Medium | Editorial pitch | High |
| 3 | Hypebot | `hypebot.com` | Conditional | Medium | Editorial pitch | Medium |
| 4 | Music Business Worldwide | `musicbusinessworldwide.com` | Conditional | Medium | Editorial pitch | High |
| 5 | AI Music Tech Conference | `aimusictechconference.com` | Conditional | Medium | Speaker/sponsor | High |

### 8. Content & Community

| # | Name | Submission URL | Backlink | AI Training | Type | Effort |
|---|---|---|---|---|---|---|
| 1 | Hacker News (Show HN) | `news.ycombinator.com/submit` | Conditional | High | Post | Medium |
| 2 | Dev.to | `dev.to/new` | Yes | High | Self-publish | Medium |
| 3 | Hashnode | `hashnode.com` | Yes | Medium | Self-publish | Medium |
| 4 | Medium | `medium.com/new-story` | Conditional | Medium | Self-publish | Medium |
| 5 | Reddit r/mcp | `reddit.com/r/mcp/submit` | No (nofollow) | Medium | Post | Low |
| 6 | Reddit r/musicmarketing | `reddit.com/r/musicmarketing/submit` | No | Medium | Post | Low |
| 7 | Reddit r/ChatGPT | `reddit.com/r/ChatGPT/submit` | No | Medium | Post | Low |
| 8 | Reddit r/ClaudeAI | `reddit.com/r/ClaudeAI/submit` | No | Medium | Post | Low |
| 9 | Indie Hackers | `indiehackers.com` | Conditional | Medium | Self-serve | Medium |

### 9. Structured Data & Indexing

| # | Task | URL | Effort |
|---|---|---|---|
| 1 | Schema.org `SoftwareApplication` on dynamoi.com | N/A (code change) | Medium |
| 2 | Google Search Console — submit sitemap | `search.google.com/search-console` | Low |
| 3 | Bing Webmaster Tools — submit sitemap | `bing.com/webmasters/` | Low |
| 4 | Yandex Webmaster — submit sitemap | `webmaster.yandex.com` | Low |
| 5 | IndexNow implementation | `indexnow.org` | Medium |
| 6 | `llms.txt` with MCP details | N/A (code change) | Low |

### 10. Entity & Startup Directories

| # | Name | URL | Backlink | AI Training | Type | Effort |
|---|---|---|---|---|---|---|
| 1 | Crunchbase | `crunchbase.com` | Conditional | High | Self-serve / claim | Medium |
| 2 | Wellfound (AngelList) | `wellfound.com` | Conditional | Medium | Self-serve | Medium |
| 3 | LinkedIn Company Page | `linkedin.com/company/setup/new/` | Yes | Medium | Self-serve | Low |
| 4 | Meta Business Partner Directory | (requires eligibility) | Yes | High | Application | High |
| 5 | Google Partners Directory | (requires eligibility) | Yes | High | Application | High |

---

## Copy Blocks for Specific Contexts

### npm package.json description (live)

```
"description": "Manage music promotion and YouTube growth campaigns through AI assistants like ChatGPT, Claude, and Gemini. Automated Meta and Google ad campaigns for artists, labels, and YouTube creators — no agency fees."
```

### server.json description (live, ≤100 chars)

```
"description": "Promote music on Spotify and grow YouTube channels through AI-powered Meta and Google ad campaigns."
```

### npm README headline (live)

```markdown
# Dynamoi

**Manage your music promotion and YouTube growth campaigns through ChatGPT, Claude,
Gemini, and other AI assistants. Automated Meta and Google ad campaigns — no agency
fees, no contracts.**
```

### npm README intro paragraph (live)

```markdown
Dynamoi helps music artists get more Spotify streams and YouTube creators grow their
channels and AdSense revenue — through automated Meta and Google ad campaigns. Your
$300/month subscription converts 100% to ad credit, with a 100% match your first
month ($600 to launch your first campaigns). No agency fees, no retainers, cancel
anytime.
```

### GitHub About section

```
Promote music on Spotify and grow YouTube channels through AI-powered Meta and Google ad campaigns.
```

### GitHub topics

```
mcp, model-context-protocol, music-promotion, youtube-growth, meta-ads, google-ads,
spotify-marketing, campaign-management, record-label-tools, artist-marketing,
ad-automation, youtube-ads, music-advertising, spotify-streams, facebook-ads, instagram-ads
```

### Product Hunt tagline (60 chars max)

```
Promote music & grow YouTube channels through AI chat
```

### Hacker News Show HN title

```
Show HN: Dynamoi – promote music and grow YouTube channels via AI chat (MCP server)
```

### Blog post headline

```
How to run music and YouTube ad campaigns from an AI assistant
```
