# Changelog

All notable changes to `@dynamoi/mcp` will be documented in this file.

This project follows the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
