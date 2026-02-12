# Changelog

All notable changes to `@dynamoi/mcp` will be documented in this file.

This project follows the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
