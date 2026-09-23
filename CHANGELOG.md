# Changelog

All notable changes to `@dynamoi/mcp` will be documented in this file.

This project follows the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-23

First stable release. The hosted server at `https://dynamoi.com/mcp` moves to
the MCP TypeScript SDK v2 and serves both the 2026-07-28 protocol and
2025-era clients. Versions 0.7.2 and 0.8.0 were prepared but never published
to npm, so upgrading from 0.7.1 includes their changes too. They are listed
below for reference.

### Breaking changes

- **MCP SDK v2.** The package now depends on `@modelcontextprotocol/server`
  2.0.0 instead of `@modelcontextprotocol/sdk`.
  `createDynamoiMcpServer` returns an SDK v2 `McpServer`, and the
  `createServer` callback passed to `handleMcpHttpRequest` must return one too.
  Hosts that import SDK v1 types need to migrate.
- **Protocol support.** `handleMcpHttpRequest` serves 2026-07-28 requests
  (stateless, `server/discover`, per-request `_meta`) through the SDK v2
  handler, and 2025-era requests (`initialize`, 2025-11-25 and earlier)
  through a stateless transport. Clients that send `Accept: application/json`
  only get JSON responses instead of a 406.
- **Stateless, POST-only transport.** Each request builds its own server and
  transport. The server issues no session IDs and opens no standalone SSE
  stream. `GET` and `DELETE` return `405` with `Allow: POST`.
- **Removed exports:**
  - `verifyAccessToken` (the `auth/verify-token` module). Verify tokens in
    your authorization server integration.
  - `buildProtectedResourceMetadata`. Serve protected-resource metadata from
    your authorization server integration.
  - The deprecated `DYNAMOI_MCP_SCOPES` alias. Use
    `DYNAMOI_BETTER_AUTH_MCP_SCOPES`.
  - The `McpMutationProposal` and `McpMutationConfirmationData` types, and the
    `confirmation_required` launch and budget outputs from the unpublished
    0.8.0 candidate.
  - The `odesliStatus` field and `SmartLinkOdesliStatus` type on Smart Link
    summaries.
- **Tool profiles.** The `chatgpt-app` profile is renamed `directory`.
  `createDynamoiMcpServer` and `getDynamoiToolDefinitions` now fall back to the
  `directory` profile when none is given. Pass `toolProfile: "full"` for the
  whole catalog. The directory profile keeps the review-safe tools plus
  `dynamoi_about` (18 of 28 tools). It hides billing, readiness, launch,
  campaign changes, country and media-asset lists, connection starters and
  Shop tools. It registers no prompts and exposes only the About and theme
  preview resources.
- **`Phase3Adapter` changes.** Removed `getCampaignAnalytics`,
  `getCampaignDeploymentStatus`, `getOnboardingStatus`, `getSmartLinkAnalytics`,
  `pauseCampaign`, `resumeCampaign`, `updateBudget` and
  `updateSmartLinkArtistSettings`. These tools had already been folded into
  `dynamoi_get_campaign`, `dynamoi_update_campaign`, `dynamoi_get_smart_link`
  and `dynamoi_update_smart_link`. Added `shopGetQuote` and `shopCreateCheckout`.
- **No confirmation token.** `confirmationToken` is no longer accepted on
  `dynamoi_launch_campaign` or `dynamoi_update_campaign` inputs. Real launches
  and campaign changes run the same shared backend checks as the Dynamoi web
  and mobile apps. The MCP client's own tool-approval settings decide whether
  a person approves each call.
- **Funding consent is required for daily budgets.** `dynamoi_launch_campaign`
  with a `DAILY` budget, and `dynamoi_update_campaign` for `update_budget` or a
  `resume` that needs card funding, must pass
  `authorizeAutomaticDailyFunding: true` with the exact
  `acceptedConsentVersion` and `acceptedConsentCopyHash` (plus
  `clientRequestId` for campaign updates), after the user has seen the consent
  copy. Without them the request is refused. `TOTAL` budgets use existing
  credit and need no consent. The consent constants changed to
  `managed-ads-prospective-daily-v2` with new copy and hash, so clients pinned
  to v1 values must update.
- **YouTube launch inputs.** `YOUTUBE` launches now require `youtubeStrategy`
  (`CHEAPEST_VIEWS`, `ORGANIC_VIEWS`, `SUBSCRIBERS`,
  `ORGANIC_VIEWS_AND_SUBSCRIBERS` or `ADSENSE_ROI`). They also require
  `youtubePlaylistId` unless the strategy is `CHEAPEST_VIEWS`.
- **Smart Link input.** `dynamoi_get_smart_link` no longer accepts the legacy
  `include: ["analytics", "artist_settings"]` array. Use `includeAnalytics` and
  `includeArtistSettings`.
- **OAuth challenge.** `buildWwwAuthenticateHeader` no longer adds
  `error="invalid_token"` by default. Following RFC 6750 §3.1, an initial
  challenge carries only `resource_metadata` and `scope`. Pass `error`
  explicitly for a rejected token or an insufficient scope.
- **Dependencies.** Removed `jose`.
- **MCP Registry entry is remote-only.** `server.json` lists only the hosted
  Streamable HTTP remote (`https://dynamoi.com/mcp`) and no longer has an npm
  `packages` entry. This package is a library, not an installable server, so
  registry consumers should connect to the remote.

### Added

- `dynamoi_about`, a read-only tool that works before sign-in, and the
  `dynamoi://about` resource. Both return the canonical About Dynamoi text.
  The full profile gets the complete overview; the directory profile gets a
  variant without pricing or Shop lines. Exported as `getDynamoiAbout`,
  `DYNAMOI_ABOUT_MARKDOWN`, `DYNAMOI_ABOUT_DIRECTORY_MARKDOWN`,
  `DYNAMOI_ABOUT_RESOURCE` and `DYNAMOI_ABOUT_TOOL_DEFINITION`.
- Dynamoi's authorization server (`https://dynamoi.com/api/auth`) now
  advertises the OAuth device authorization grant for CLI and headless agents,
  alongside Client ID Metadata Documents and dynamic client registration.
- Dynamoi Shop tools for the full profile: `dynamoi_shop_get_quote` (read-only
  estimate) and `dynamoi_shop_create_checkout` (creates an unpaid Stripe
  Checkout Session that the user completes). Both require `dynamoi:mcp.full`.
  Exported with their schemas and `SHOP_TOOL_DEFINITIONS`.
- `createDynamoiMcpServer` accepts `authorizeToolCall`, which lets the host
  answer a call before dispatch (for example with an OAuth step-up challenge).
- Typed error recovery on tool results: `code`, `retryable`,
  `retryAfterSeconds`, `field`, `prerequisite` and `nextAction`, exported as
  `ResultErrorCode` and `ResultNextAction`. Tool results that do not match
  their output schema return `OUTPUT_INVALID` instead of malformed data.
- YouTube launch inputs `youtubeStrategy` and `youtubePlaylistId`, matching
  the web app's YouTube campaign setup.
- `tools/list` also advertises each tool's `securitySchemes` at the top level,
  where OpenAI reads it: `noauth` for `dynamoi_about` and OAuth scopes for
  everything else. List responses carry private 60-second cache hints.

### Changed

- Campaign launch, budget, pause and resume run through the same shared
  backend functions as the Dynamoi web and mobile apps, including promo limits
  and existing permission checks.
- `dynamoi_get_account_overview` defaults `intent` to `account_overview`.
- About copy and server instructions now use the company facts from
  dynamoi.com/about: founded in 2021 by Trevor Loucks, based in Sioux Falls,
  South Dakota, operated by humans and assisted by AI, and support at
  support@dynamoi.com with replies within 24 hours. `getDynamoiAbout` adds a
  `links.support` value. The full-profile About also includes the Starter plan
  line; the directory variant still has no pricing, plan or Shop copy.
- Tool descriptions and instructions use one standard dashboard handoff line
  (`https://dynamoi.com/dashboard`) for actions agents cannot take, such as
  billing, subscription or plan setup.
- Corrected tool annotations: `dynamoi_create_smart_links_from_spotify_artist`
  is no longer marked destructive, and `dynamoi_apply_for_distribution` is
  marked open-world.
- Advertised input and output JSON Schemas omit the `$schema` key, which some
  MCP clients reject, and declare `type: "object"` for object schemas.
- Distribution application country fields are described as ISO 3166-1
  alpha-2 codes. Country, tax, payout and delivery checks remain manual steps
  after intake.

### Fixed

- ChatGPT no longer hits a 400 on its first request. SDK 1.30 rejected
  `MCP-Protocol-Version: 2026-07-28`, and the hosted server now accepts it.
- Tool-call observers (`onToolCall`) receive isolated snapshots, so observer
  failures or mutations can no longer change a tool result.
- The MCP Registry description length check counts Unicode code points.

## [0.8.0] - 2026-09-21 [NOT PUBLISHED]

Prepared as a candidate but never published to npm. Its changes ship in 1.0.0,
except that 1.0.0 removes the confirmation-receipt step described here.

- Authorize full MCP catalogs from verified user scopes, not client UUID allowlists.
- Keep token-registry identity separate from Better Auth 1.7's provider-owned jti.
- Require expiring, actor/client/input-bound previews before real launches or budget mutations.
- Preserve per-tool scopes, RBAC, reviewer restrictions and existing funding authority.

## [0.7.2] - 2026-09-12 [NOT PUBLISHED]

Prepared but never published to npm. Its changes ship in 1.0.0.

### Changed

- Make campaign funding consent explicit about daily renewal, advance collection, and unused-fund reconciliation.

## [0.7.1] - 2026-08-27

### Fixed

- Shortened the official MCP Registry description to satisfy its 100-character
  metadata limit without changing the published capability surface.

## [0.7.0] - 2026-08-12

### Added

- Added customer-safe tools to check the five music-distribution application
  requirements and submit an eligible application for manual review.
- Added least-privilege Meta and YouTube distribution-identity connection modes
  that remain separate from advertising billing and permissions.
- Added dedicated distribution read/apply OAuth scopes and consent coverage.

### Changed

- Repositioned Dynamoi MCP around music-promotion campaigns, Smart Links,
  analytics, and distribution applications, with explicit routing instructions
  for agents.

## [0.6.5] - 2026-08-12

### Added

- Added `dynamoi_preview_smart_link_themes` with a ChatGPT Apps SDK UI resource
  so reviewers can see the four Smart Link themes without creating or updating
  a Smart Link.

### Changed

- Automated official MCP Registry publication after npm releases with GitHub
  OIDC authentication, pinned tooling, propagation retries, and exact metadata
  readback.
- Pinned public release and validation workflow actions to immutable commits.

### Fixed

- Replaced dynamic HTML construction in the Smart Link theme preview with safe
  DOM and text APIs.
- Rejected control characters in generated OAuth challenge headers and blocked
  redirects during registry metadata verification.

## [0.6.4] - 2026-05-30

### Changed

- Rewrote the public README and package description for musicians, labels, and
  MCP-capable AI agent builders, with clearer release-promotion language,
  richer Markdown structure, badges, emoji section cues, example prompts,
  package usage, and safety model.

## [0.6.3] - 2026-05-30

### Added

- Added a ChatGPT app review profile that exposes the approved 14-tool surface while keeping the broader MCP package available for other clients.
- Added regression coverage for profile-specific server behavior and ChatGPT app review schemas.

### Changed

- Tightened Smart Link detail inputs to explicit include booleans and closed schemas for app-review clients.
- Advertised concrete campaign status enum values for campaign listing instead of a free-form status string.
- Hid billing, paid launch/readiness, campaign mutation, OAuth-start, media asset, and country-catalog tools from the ChatGPT app review profile.

### Fixed

- Fixed legacy Smart Link include normalization under the repo-wide strict TypeScript settings.
- Added a package version fallback so unbundled runtime metadata reports the published package version instead of a placeholder build token.

## [0.6.2] - 2026-05-12

### Added

- Added a public package README so npm users can see the hosted MCP endpoint, assistant capabilities, safety model, and package usage examples directly on npmjs.com.

### Changed

- Included `README.md` in the published package file list so the npm package page renders the public overview with each release.

## [0.6.1] - 2026-05-07

### Added

- Added `dynamoi_create_smart_links_from_spotify_artist` so assistants can start a free Spotify artist catalog Smart Link import, return the artist hub, and keep users in the MCP flow instead of sending them to the dashboard.
- Added `dynamoi_start_youtube_channel_link` and `dynamoi_start_meta_connection` so assistants can start YouTube channel linking and Meta connection from chat.

### Changed

- Smart Link tool metadata, instructions, resources, and docs now distinguish single-release creation from full artist catalog/hub creation.
- Consolidated the public tool surface: campaign analytics/deployment now live behind `dynamoi_get_campaign` include flags, campaign mutations use `dynamoi_update_campaign`, and Smart Link analytics/settings/publish controls are folded into `dynamoi_get_smart_link` and `dynamoi_update_smart_link`.
- `dynamoi_list_artists` now accepts `artistId` for one artist's full profile/readiness details, replacing the separate one-artist read tool in the advertised connector surface.
- Billing guidance now routes managed-advertising payment setup through the Dynamoi dashboard instead of direct ChatGPT checkout.

### Removed

- Removed `dynamoi_start_subscription_checkout` from the public connector surface so the ChatGPT app does not expose direct paid checkout. Assistants should use `dynamoi_get_billing` for status and direct users to complete billing setup in Dynamoi.

## [0.6.0] - 2026-05-02

### Added

- Added read-only campaign planning tools: `dynamoi_list_available_countries`, `dynamoi_get_onboarding_status`, `dynamoi_get_campaign_readiness`, and `dynamoi_get_campaign_deployment_status`.
- Added campaign-type-aware targeting metadata so assistants distinguish Smart Campaign country availability from YouTube/Google Ads country targeting.

## [0.5.3] - 2026-05-01

### Added

- Added MCP prompts and resources that help assistants explain free Smart Links, find Smart Link URLs, and distinguish free Smart Links from paid managed advertising.

### Changed

- Smart Link create/get/list/search summaries now prioritize release title, artist name, public URL, status, and next actions for more natural assistant replies.
- `dynamoi_search` summary rows keep artist and campaign IDs for follow-up tool calls while keeping Smart Link internal IDs out of user-facing summaries.
- Smart Link tool descriptions and runtime instructions now tell assistants to lead with public URLs and avoid internal IDs unless the user asks.

## [0.5.2] - 2026-05-01

### Fixed

- Synced the MCP server card package metadata to the published package version so registry consumers see the current npm release.

## [0.5.1] - 2026-05-01

### Fixed

- Added the `@dynamoi/mcp/auth` sub-entrypoint so public/static discovery code can build OAuth protected-resource metadata without bundling Node-only MCP server transport code.

## [0.5.0] - 2026-04-30

### Added

- New free Smart Link tools: `dynamoi_create_smart_link_from_spotify`, `dynamoi_list_smart_links`, `dynamoi_get_smart_link`, `dynamoi_get_smart_link_analytics`, `dynamoi_get_smart_link_artist_settings`, `dynamoi_update_smart_link`, `dynamoi_update_smart_link_artist_settings`, `dynamoi_publish_smart_link`, and `dynamoi_unpublish_smart_link`.
- Smart Link MCP resources documenting free-plan terms, capabilities, Spotify inputs, themes, pixel policy, and status meanings.
- OAuth protected-resource metadata now advertises the `dynamoi:smart_links.write` scope.

### Changed

- `dynamoi_search` now searches PlayLink-native Smart Links instead of legacy campaign SmartLink records.
- Runtime instructions, package metadata, and public discovery copy now distinguish free Smart Links from paid managed advertising campaigns.

### Fixed

- Smart Link analytics breakdowns now aggregate across the requested date range instead of showing only the last day.
- Creating a Smart Link from Spotify no longer returns a soft-deleted link as a successful existing result.

## [0.4.1] - 2026-02-13

### Added

- New `dynamoi_get_artist_analytics` tool to get artist-level rollup analytics across all campaigns, with optional daily breakdowns by platform.
- Media asset outputs now include dimensions (width/height when available) and a computed aspect ratio to make creative selection easier.

### Changed

- `dynamoi_get_campaign` targeting is smaller by default in JSON mode: country targeting returns `countryCount` unless you pass `includeCountries=true`.
- `dynamoi_list_media_assets` summary mode no longer prints long asset URLs by default (use JSON mode when you need full URLs).

## [0.4.0] - 2026-02-12

### Added

- `dynamoi_list_artists` now includes `organizationName` when available.

### Changed

- `dynamoi_get_current_user` now returns lightweight counts (organizationCount and artistCount) instead of full roster lists.
- Summary-mode outputs are standardized under a `summary` key across tools.
- Read tools may include `warnings` and `actionRequired` for onboarding blockers (when applicable).

### Removed

- Removed wording in public docs that could be misinterpreted as describing internal spend calculations.

## [0.3.0] - 2026-02-12

### Added

- New `dynamoi_get_current_user` tool so assistants can quickly understand who is connected and which artists/organizations they can access.
- New `summary` response format across read tools for cleaner assistant-ready outputs.
- Daily analytics granularity option for campaign analytics, including daily breakdowns across Meta and Google.

### Changed

- Search now supports optional `artistId` scoping so assistants can stay focused on one artist when needed.
- Campaign listing now supports optional `campaignType` filtering (`SMART_CAMPAIGN` or `YOUTUBE`).
- Read tool responses are more consistent across assistants, with improved summary-mode output and pagination behavior.

## [0.2.1] - 2026-02-12

### Fixed

- Improved OAuth reconnect reliability for AI assistants by allowing secure localhost callback origins used during native auth handoffs.
- Cleaned up the consent screen app title so connected assistants display clearer, more user-friendly naming.

## [0.2.0] - 2026-02-11

### Changed

- Hosted endpoint is now `https://dynamoi.com/mcp` for a cleaner one-URL setup across AI assistants.
- Simplified endpoint behavior: `/api/mcp` has been removed, and `/mcp` is now the single MCP endpoint.
- More secure session handling so connected AI assistants cannot accidentally cross over between user sessions.
- Stronger authentication checks before any tool access.
- More reliable OAuth discovery during assistant connection flows.
- Campaign analytics now return consistent spend values.
- Better MCP directory compatibility for broader AI assistant discoverability.

## [0.1.0] - 2026-02-10

### Added

- Initial public release of the Dynamoi MCP server contract.
- Connect to Dynamoi from AI assistants via a hosted remote MCP endpoint (Streamable HTTP).
- Secure sign-in via OAuth 2.1 (Supabase).
- Read tools: `dynamoi_list_artists`, `dynamoi_search`, `dynamoi_get_artist`, `dynamoi_list_campaigns`, `dynamoi_get_campaign`, `dynamoi_get_campaign_analytics`, `dynamoi_get_billing`, `dynamoi_get_platform_status`.
- Write tools: `dynamoi_pause_campaign`, `dynamoi_resume_campaign`, `dynamoi_update_budget`.
- Workflow tools: `dynamoi_list_media_assets`, `dynamoi_launch_campaign`.
