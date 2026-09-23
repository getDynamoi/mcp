# Dynamoi MCP

[![npm version](https://img.shields.io/npm/v/@dynamoi/mcp?label=npm)](https://www.npmjs.com/package/@dynamoi/mcp)
[![license](https://img.shields.io/npm/l/@dynamoi/mcp)](./LICENSE)

Connect an AI agent to [Dynamoi](https://dynamoi.com) to create free Smart
Links, check campaign and platform status, read analytics, run managed ad
campaigns and apply for music distribution. You can use the hosted MCP server,
or use this package as a library.

```txt
https://dynamoi.com/mcp
```

The hosted server needs no install. Point any MCP client that supports remote
Streamable HTTP and OAuth at that URL, and the user signs in with their
Dynamoi account.

## About Dynamoi

Dynamoi is a music marketing platform founded in 2021 by Trevor Loucks. It
runs managed Meta and YouTube ad campaigns, music distribution and royalty
analytics for independent artists, labels, managers and YouTube creators,
alongside free Smart Links and analytics.

- **Free Smart Links:** release pages and artist hubs built from Spotify
  URLs, with link analytics, themes, validated pixel IDs and team seats.
- **Managed Smart Campaigns:** Meta ads that promote Spotify tracks, albums
  and playlists.
- **YouTube campaigns:** managed Google Ads campaigns for YouTube channel
  growth.
- **Music distribution:** opt-in delivery to 100+ stores. Applications are
  scored against five requirements, and approval is not guaranteed.
- **YouTube promotion Shop:** one-off YouTube video promotion with no
  subscription.

Campaigns run on Dynamoi's own managed Meta and Google ad infrastructure. They
reach real people through official ad networks, never bots, fake streams or
paid playlist placement. Results vary and are never guaranteed.

Dynamoi is based in Sioux Falls, South Dakota, and is operated by humans,
assisted by AI. People make the decisions and are accountable for every
campaign and support reply. AI helps with ad creative, campaign monitoring,
reporting and routine tasks. Smart Links are free. Starter is $25/month with a
$50 launch campaign credit, and campaign budgets start at $10/day. See
[pricing](https://dynamoi.com/pricing).

Agents can read the same overview before sign-in through the `dynamoi_about`
tool or the `dynamoi://about` resource.

## Connect

### Claude Code

```bash
claude mcp add --transport http dynamoi https://dynamoi.com/mcp
```

Then run `/mcp` in Claude Code to sign in.

### Claude (web and desktop)

Open **Settings → Connectors**, choose **Add custom connector**, and enter
`https://dynamoi.com/mcp`. Claude opens the Dynamoi sign-in page when you
connect.

### ChatGPT

In developer mode, add a custom app with the MCP server URL
`https://dynamoi.com/mcp` and OAuth authentication. ChatGPT gets the
[directory catalog](#which-tools-a-client-sees).

### Cursor

Add Dynamoi to `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):

```json
{
  "mcpServers": {
    "dynamoi": {
      "url": "https://dynamoi.com/mcp"
    }
  }
}
```

### VS Code

Add Dynamoi to `.vscode/mcp.json`:

```json
{
  "servers": {
    "dynamoi": {
      "type": "http",
      "url": "https://dynamoi.com/mcp"
    }
  }
}
```

### Other MCP clients

Use `https://dynamoi.com/mcp` as a remote Streamable HTTP server. The client
must handle an OAuth 401 challenge (MCP authorization). Stdio-only clients
need a remote-to-stdio bridge.

## Which tools a client sees

The server has two tool catalogs. It picks one from the OAuth client that
signed in, not from anything the client claims about itself.

| Catalog | Who gets it | What it includes |
| --- | --- | --- |
| **Directory** | Every client on `https://dynamoi.com/mcp/directory` (used by agent-directory listings such as the Dynamoi Claude plugin), the published ChatGPT app on `/mcp`, and requests made before sign-in | 18 review-safe tools: reads, Smart Links, distribution and About. No billing, campaign launch or campaign changes, platform connection starters or Shop checkout. |
| **Full** | Every other signed-in client on `https://dynamoi.com/mcp`, such as Claude custom connectors, Claude Code, Cursor, VS Code and custom agents | All 28 tools, plus the Dynamoi prompts and reference resources |

Signing in does not skip permission checks. Every tool call still needs its
OAuth scopes, and the user's role must allow access to the artist, campaign
or Smart Link.

## Tools

"Reads" tools are marked read-only. "Changes data" tools write to Dynamoi or
start an action with an outside provider.

| Tool | What it does | Access | Catalog |
| --- | --- | --- | --- |
| `dynamoi_about` | What Dynamoi is and how to start. Works before sign-in. | Reads | Both |
| `dynamoi_get_account_overview` | Signed-in account, access counts and suggested next steps | Reads | Both |
| `dynamoi_list_artists` | Artist roster, or one artist's profile and readiness | Reads | Both |
| `dynamoi_search` | Find artists, campaigns and Smart Links by name | Reads | Both |
| `search` / `fetch` | ChatGPT deep research search and fetch | Reads | Both |
| `dynamoi_list_campaigns` | An artist's campaigns, with type and status filters | Reads | Both |
| `dynamoi_get_campaign` | One campaign, with optional analytics, delivery status and countries | Reads | Both |
| `dynamoi_get_artist_analytics` | Artist-level analytics across campaigns | Reads | Both |
| `dynamoi_get_platform_status` | Spotify, Meta and YouTube connection status and setup blockers | Reads | Both |
| `dynamoi_get_distribution_application` | The five distribution requirements and application status | Reads | Both |
| `dynamoi_apply_for_distribution` | Submit a distribution application for manual review | Changes data | Both |
| `dynamoi_preview_smart_link_themes` | Visual preview of the Smart Link themes | Reads | Both |
| `dynamoi_create_smart_link_from_spotify` | Create a free Smart Link from a Spotify album or track | Changes data | Both |
| `dynamoi_create_smart_links_from_spotify_artist` | Import an artist's catalog as free Smart Links and return the artist hub | Changes data | Both |
| `dynamoi_list_smart_links` | An artist's Smart Links and public URLs | Reads | Both |
| `dynamoi_get_smart_link` | One Smart Link, with optional analytics and artist settings | Reads | Both |
| `dynamoi_update_smart_link` | Update a link description or the artist's theme and pixel settings | Changes data | Both |
| `dynamoi_get_billing` | Billing status, credit balance and promo limits | Reads | Full |
| `dynamoi_list_available_countries` | Countries a Smart Campaign or YouTube campaign can target | Reads | Full |
| `dynamoi_get_campaign_readiness` | Check launch inputs before creating anything | Reads | Full |
| `dynamoi_list_media_assets` | Uploaded images and videos that a launch can reuse | Reads | Full |
| `dynamoi_launch_campaign` | Launch a Smart Campaign or YouTube campaign | Changes data | Full |
| `dynamoi_update_campaign` | Pause, resume, or change a campaign's budget or end date | Changes data | Full |
| `dynamoi_start_meta_connection` | Start the Facebook Page and Instagram connection in the browser | Changes data | Full |
| `dynamoi_start_youtube_channel_link` | Start the YouTube channel connection in the browser | Changes data | Full |
| `dynamoi_shop_get_quote` | Estimate a one-off YouTube promotion | Reads | Full |
| `dynamoi_shop_create_checkout` | Create an unpaid Stripe Checkout link for that promotion | Changes data | Full |

Full tool descriptions and input schemas come from `tools/list`, or from
`getDynamoiToolDefinitions()` in this package.

## Money and safety

- **Smart Links are free.** Creating or updating them never charges anyone.
- **Launches and budget changes are real.** `dynamoi_launch_campaign` and
  `dynamoi_update_campaign` go through the same backend checks as the Dynamoi
  web and mobile apps: permissions, promo limits and repeat-request
  protection. Whether a person approves each call is up to the MCP client's
  tool-approval settings, so keep approval on for tools that change data.
- **Daily budgets need the user's funding consent.** A `DAILY` budget is
  funded one 24-hour window at a time. Available credits and campaign funds
  are used first, then the card the user saved in Dynamoi is charged
  automatically. The agent must show the user the exact consent text, then send
  `authorizeAutomaticDailyFunding: true` with the matching
  `acceptedConsentVersion` and `acceptedConsentCopyHash`. This applies to
  launches, budget updates, and resumes that need card funding. Without
  consent the request is refused. The consent values are exported from
  `@dynamoi/mcp/consent`.
- **Total budgets use existing credit** and need no funding consent.
- **Agents never handle payment credentials.** Subscriptions, plans and
  billing setup happen only in the [Dynamoi dashboard](https://dynamoi.com/dashboard),
  where subscriptions start through hosted Stripe Checkout. No tool starts a
  subscription.
- **Shop checkout is only a link.** `dynamoi_shop_create_checkout` creates an
  unpaid Stripe Checkout Session. The user pays on Stripe, and no order exists
  until the payment is verified.
- **Distribution applications start a manual review.** Submitting one does not
  approve distribution, accept an agreement or deliver music to stores.
- **The directory catalog** exposes no tools that spend money, start a
  subscription or create a checkout.

## Authentication

Dynamoi uses OAuth 2.1 through its authorization server at
`https://dynamoi.com/api/auth`. Clients find it through the server's metadata:

- Protected resource: `https://dynamoi.com/.well-known/oauth-protected-resource/mcp`
- Authorization server: `https://dynamoi.com/.well-known/oauth-authorization-server`

| Topic | Support |
| --- | --- |
| Client registration | Client ID Metadata Documents (preferred) and dynamic client registration |
| Grants | Authorization code with PKCE (`S256`), refresh token, and the device authorization grant for CLI and headless agents (`https://dynamoi.com/api/auth/device/code`) |
| Tokens | Bearer tokens in the `Authorization` header. DPoP signing algorithms are advertised. |

Without a token, a request gets a `401` with a `WWW-Authenticate` challenge.
That challenge asks for every scope the client's catalog uses, so one consent
covers the whole catalog. A full-catalog client that signed in with fewer
scopes is asked once for the rest.

| Scope | Allows |
| --- | --- |
| `dynamoi:read` | Reading the account, artists, campaigns, analytics and Smart Links. Every signed-in tool needs it. |
| `dynamoi:platform.read` | Checking Spotify, Meta and YouTube connection status |
| `dynamoi:platform.write` | Starting Meta and YouTube connection flows |
| `dynamoi:smart_links.write` | Creating and updating free Smart Links |
| `dynamoi:distribution.read` | Checking distribution requirements and application status |
| `dynamoi:distribution.apply` | Submitting a distribution application |
| `dynamoi:billing.read` | Reading billing status, credit balance and promo limits |
| `dynamoi:campaign.launch` | Launching new campaigns |
| `dynamoi:campaign.write` | Pausing, resuming and changing campaign budgets |
| `dynamoi:mcp.full` | Using the Shop quote and checkout tools |

## Protocol support

- MCP **2026-07-28**: stateless requests with per-request `_meta`, including
  `server/discover`.
- MCP **2025-11-25** and earlier `initialize`-based revisions, for clients
  that have not moved to 2026-07-28.
- Streamable HTTP, POST only. Responses are JSON, or SSE for 2025-era
  clients that accept it. The server keeps no sessions and opens no
  standalone stream, so `GET` and `DELETE` return `405`.

## Using the package

Most people should connect to the hosted server. Install the package if you
are building against the Dynamoi MCP contract: tool definitions, Zod schemas,
result types, OAuth scope maps or the stateless HTTP handler.

```bash
npm install @dynamoi/mcp
```

The package is ESM-only and built on MCP TypeScript SDK v2
(`@modelcontextprotocol/server`).

| Entry point | Main exports |
| --- | --- |
| `@dynamoi/mcp` | `createDynamoiMcpServer`, `handleMcpHttpRequest`, `getDynamoiToolDefinitions`, `DynamoiMcpToolProfile`, `Phase3Adapter`, tool definition arrays and input schemas, Shop schemas, About exports (`getDynamoiAbout`, `DYNAMOI_ABOUT_*`), result and data types, `DYNAMOI_MCP_VERSION` |
| `@dynamoi/mcp/auth` | `DYNAMOI_BETTER_AUTH_MCP_SCOPES`, `DYNAMOI_MCP_TOOL_SCOPES`, `buildWwwAuthenticateHeader` |
| `@dynamoi/mcp/consent` | `PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION`, `PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY`, `PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH` |

A host provides a `Phase3Adapter`, which connects each tool to its own
services. It also verifies the caller before it serves a request:

```ts
import {
  createDynamoiMcpServer,
  handleMcpHttpRequest,
  type DynamoiMcpToolProfile,
  type Phase3Adapter,
} from "@dynamoi/mcp";

export async function handleMcp(
  request: Request,
  adapter: Phase3Adapter,
  toolProfile: DynamoiMcpToolProfile,
): Promise<Response> {
  // Authenticate the request and check scopes first; this package does not
  // verify tokens. The profile defaults to "directory" if you omit it.
  const parsedBody = request.method === "POST" ? await request.json() : null;
  return handleMcpHttpRequest({
    request,
    parsedBody,
    createServer: () => createDynamoiMcpServer({ adapter, toolProfile }),
  });
}
```

`createDynamoiMcpServer` also accepts `authorizeToolCall` (answer a call
before it runs, for example with a step-up challenge), `onToolCall` (a
telemetry hook) and `oauthScopes`.

Every request builds a new server. `handleMcpHttpRequest` sends 2026-07-28
requests to the SDK's stateless handler and 2025-era requests to a stateless
per-request transport.

## Links

| Resource | URL |
| --- | --- |
| MCP server docs | <https://dynamoi.com/docs/mcp-server> |
| Agent overview (`llms.txt`) | <https://dynamoi.com/llms.txt> |
| Support | <https://dynamoi.com/support> or support@dynamoi.com (replies within 24 hours) |
| Pricing | <https://dynamoi.com/pricing> |
| npm | <https://www.npmjs.com/package/@dynamoi/mcp> |
| Source and issues | <https://github.com/getDynamoi/mcp> |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) |
| Capability map | [CAPABILITY_PARITY.md](./CAPABILITY_PARITY.md) |

MIT licensed. See [LICENSE](./LICENSE).
