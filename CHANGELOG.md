# Changelog

All notable changes to `@dynamoi/mcp` will be documented in this file.

This project follows the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
