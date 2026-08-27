# Dynamoi MCP Capability Parity

This map keeps the public MCP promise aligned with customer-facing Dynamoi app
behavior. Parity means an agent can complete an appropriate customer workflow
or make a truthful handoff. It does not mean exposing operator, legal, provider,
admin, or payment controls as agent tools.

## Public tool audit

| Tool | App capability | MCP behavior | ChatGPT app |
| --- | --- | --- | --- |
| `dynamoi_get_account_overview` | Account and roster orientation | Returns accessible organizations, artists, connection state, and next actions | Available |
| `dynamoi_list_artists` | Artist roster | Lists accessible artists or reads one artist's profile | Available |
| `dynamoi_search` | Product search | Searches artists, campaigns, and Smart Links | Available |
| `search` | OpenAI app search | Returns compact searchable Dynamoi records | Available |
| `fetch` | OpenAI app record fetch | Fetches one search result by stable identifier | Available |
| `dynamoi_list_campaigns` | Campaign management | Lists an artist's Smart Campaigns and YouTube campaigns | Available |
| `dynamoi_get_campaign` | Campaign detail and reporting | Reads budget, targeting, status, deployment state, and optional analytics | Available |
| `dynamoi_get_artist_analytics` | Promotion analytics | Returns artist-level campaign rollups and daily performance | Available |
| `dynamoi_get_billing` | Managed-advertising billing state | Reads subscription, credits, and launch blockers without collecting payment | Full MCP only |
| `dynamoi_get_platform_status` | Spotify, Meta, and YouTube connections | Reads platform connection and onboarding state | Available |
| `dynamoi_list_available_countries` | Campaign targeting catalogs | Lists supported targeting countries by campaign type | Full MCP only |
| `dynamoi_get_campaign_readiness` | Campaign creation validation | Checks launch inputs and blockers without creating a campaign | Full MCP only |
| `dynamoi_start_youtube_channel_link` | YouTube connection | Starts either advertising OAuth or least-privilege distribution identity OAuth | Full MCP only |
| `dynamoi_start_meta_connection` | Facebook/Instagram connection | Starts either advertising OAuth or least-privilege distribution identity OAuth | Full MCP only |
| `dynamoi_update_campaign` | Campaign management | Pauses, resumes, or updates an eligible campaign after explicit intent | Full MCP only |
| `dynamoi_list_media_assets` | Campaign creative library | Lists reusable launch media | Full MCP only |
| `dynamoi_launch_campaign` | Smart Campaign and YouTube campaign creation | Creates an eligible managed campaign after readiness and intent checks | Full MCP only |
| `dynamoi_create_smart_link_from_spotify` | Smart Link creation | Creates or returns a Smart Link for one Spotify track or album | Available |
| `dynamoi_create_smart_links_from_spotify_artist` | Artist hub and catalog import | Creates an artist hub and starts catalog Smart Link import | Available |
| `dynamoi_list_smart_links` | Smart Link library | Lists an artist's Smart Links | Available |
| `dynamoi_get_smart_link` | Smart Link detail, settings, and analytics | Reads a link with optional analytics and artist settings | Available |
| `dynamoi_update_smart_link` | Smart Link editing | Updates link content, theme, pixels, or publish state within validated fields | Available |
| `dynamoi_preview_smart_link_themes` | Smart Link theme picker | Renders the four themes without changing a Smart Link | Available |
| `dynamoi_get_distribution_application` | Distribution application page | Reads the exact five requirements, evidence, eligibility, and application status | Available |
| `dynamoi_apply_for_distribution` | Distribution application submission | Rechecks server truth and submits an idempotent application for manual review | Available |

## Customer capability boundaries

| App capability family | Parity decision | Reason |
| --- | --- | --- |
| Artist/account onboarding | Partial MCP plus handoff | Spotify-based artist and Smart Link onboarding is agent-callable; organization administration and team invites remain in the app. |
| Smart Links | MCP appropriate | Creation, discovery, editing, settings, publication, themes, and analytics have bounded customer-safe contracts. |
| Smart Campaigns and YouTube campaigns | Full MCP appropriate; ChatGPT read-only | Full MCP clients can validate, launch, and update campaigns. ChatGPT keeps paid launch and live campaign mutations in the dashboard review profile. |
| Analytics and reporting | MCP appropriate | Artist, campaign, and Smart Link analytics are customer reads scoped by artist access. |
| Billing and checkout | Read plus dashboard handoff | Agents can inspect billing state, but checkout and payment collection remain in the dashboard. |
| Platform connections | Full MCP appropriate | Advertising connections are billing-gated; distribution identity connections use separate least-privilege permissions without billing. |
| Distribution application | MCP appropriate | Eligibility and application submission now use the same server truth and access checks as the app. |
| Distribution agreement | Dashboard handoff | Agreement acceptance is a separate legal act and is not implied by application submission. |
| Distribution release intake and status | Future customer-safe MCP work | Release rights, splits, proofs, tax readiness, and delivery gates need a dedicated contract before agent mutation is safe. |
| Distribution catalog, royalties, and earnings | Future read-only MCP work | Customer-safe reads are useful, but the current public MCP does not claim them. |
| Takedowns | Dashboard and operator workflow | Takedowns carry rights and provider consequences and need a separately reviewed mutation contract. |
| Team and organization management | Dashboard handoff | Membership and role changes are security-sensitive administration, not promotion execution. |
| Shop purchases | Public shop/API handoff | The authenticated MCP does not expose direct checkout or agent payment tools. |
| Publishing administration | Out of current MCP scope | Dynamoi MCP must not imply a publishing-administration workflow that the customer app does not provide. |

The next meaningful parity expansion is distribution release intake and read-only
distribution catalog/royalty status. It should ship only after the agreement,
rights, splits, tax, payout, and provider-delivery boundaries have stable
customer-safe domain contracts.
