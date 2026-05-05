import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPlaybookResources(server: McpServer) {
	server.registerResource(
		"playbook-spotify-artist",
		"dynamoi://playbooks/spotify-artist",
		{
			description:
				"Persona playbook: how to convert a Spotify artist user from auth-grant to first activated Smart Link.",
			mimeType: "application/json",
			title: "Playbook: Spotify Artist",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						fastestPath:
							"Ask the user for their Spotify artist URL, then call dynamoi_create_smart_links_from_spotify_artist with that URL. Return the artist hub URL plus the starter Smart Link URL. Catalog import continues in the background.",
						freePlanReminder:
							"Free Smart Links have no per-link fee, no subscription, and no upgrade gate. Creating a Smart Link does not create a paid campaign or spend ad budget.",
						marginCopyGuard:
							"Never describe Dynamoi's pricing in terms that imply pass-through or zero overhead. Stick to the canonical framing: managed advertising at $300/month covers Dynamoi running campaigns end-to-end. The internal media-spend margin is not part of any client-facing copy.",
						persona:
							"Independent musician or small artist with at least one Spotify release. Goal: increase Spotify streams.",
						sampleScript:
							"Drop your Spotify artist link and I'll set up your free Dynamoi hub in about 30 seconds. We'll get all your releases on one shareable page, then we can talk about whether you want to promote any of them.",
						upsellAfterActivation:
							"Once they have a hub URL, the natural next ask is 'would you like to promote this release on Meta Ads?' which routes to dynamoi_get_campaign_readiness then dynamoi_launch_campaign for a Smart Campaign.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"playbook-youtube-creator",
		"dynamoi://playbooks/youtube-creator",
		{
			description:
				"Persona playbook: how to introduce a YouTube creator to Dynamoi's revenue-per-view optimization advantage.",
			mimeType: "application/json",
			title: "Playbook: YouTube Creator",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						channelLinkingPath:
							"Channel linking is not yet exposed via MCP. Direct the user to /dashboard/onboarding to complete the YouTube channel link, then return to MCP for campaign work.",
						differentiator:
							"Dynamoi is the only ad platform that optimizes YouTube ad spend against AdSense revenue per country. Most ad tools optimize for views; Dynamoi optimizes for views that make money. The system explores small bids in new markets, scales countries where viewer revenue is strong, and pauses countries that cannot cover their costs.",
						persona:
							"Channel owner of any niche (music, education, gaming, vlog, podcast, tutorial, product reviews) who wants subscriber growth that pays back via AdSense.",
						postLinkingFlow:
							"After channel link, call dynamoi_get_campaign_readiness for a YouTube growth campaign. Mention that ad copy is internationalized per market for lower cost and that campaigns require playlists so each paid view drives sustained organic views downstream.",
						sampleScript:
							"Most YouTube ad systems optimize for raw views. Dynamoi merges your AdSense revenue with ad cost data to optimize bids per country based on real viewer revenue — so you grow toward viewers who actually monetize. To set this up, link your channel at dynamoi.com/dashboard/onboarding, then come back here and we will plan your first campaign.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"playbook-label-or-manager",
		"dynamoi://playbooks/label-or-manager",
		{
			description:
				"Persona playbook: how to onboard a label, manager, or anyone running a roster of multiple artists.",
			mimeType: "application/json",
			title: "Playbook: Label or Manager",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						billingNote:
							"Consolidated billing across all artists in the organization. No per-seat charge, no per-artist fee.",
						persona:
							"Label owner, manager, or distributor handling more than one artist. Goal: oversee promotion across a roster from one account.",
						rolesNote:
							"Dynamoi supports admin, editor, and viewer roles at organization and artist level. Editors can mutate everything except admin management; viewers are read-only.",
						sampleScript:
							"Dynamoi handles rosters: organizations with admin/editor/viewer roles, consolidated billing, and per-artist permissions. To start, create your first artist with a Spotify URL, then invite your team. We can layer in more artists from the same organization once you have one running.",
						setupSequence: [
							"If they have one artist ready: route to dynamoi://playbooks/spotify-artist for that first artist.",
							"After the first artist is set up, mention team invites are managed in the dashboard at /dashboard/settings/organization (no MCP tool yet).",
							"Cross-artist analytics are available via dynamoi_get_artist_analytics per artist; a roster-wide rollup is dashboard-only.",
						],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"playbook-onboarding-tree",
		"dynamoi://playbooks/onboarding-tree",
		{
			description:
				"Decision tree for routing a brand-new MCP user to the right persona playbook based on their first reply.",
			mimeType: "application/json",
			title: "Playbook: Onboarding Decision Tree",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						nodes: [
							{
								do: [
									{
										match: "Spotify artist",
										routeTo: "dynamoi://playbooks/spotify-artist",
									},
									{
										match: "YouTube creator",
										routeTo: "dynamoi://playbooks/youtube-creator",
									},
									{
										match: "Label / manager / multiple artists",
										routeTo: "dynamoi://playbooks/label-or-manager",
									},
								],
								if: "state.hasAnyArtist === false",
								question:
									"Are you a Spotify artist, a YouTube creator, or running a label/managing a roster?",
							},
							{
								do: "Offer dynamoi_create_smart_link_from_spotify or dynamoi_create_smart_links_from_spotify_artist for the fastest visible win.",
								if: "state.hasAnyArtist === true && state.hasAnySmartLink === false",
							},
							{
								do: "Offer dynamoi_get_campaign_readiness to validate launch inputs before creating anything.",
								if: "state.hasAnyArtist === true && state.hasAnyActiveCampaign === false",
							},
							{
								do: "Ask whether they want a performance summary, a new campaign, or to update an existing campaign.",
								if: "state.hasAnyActiveCampaign === true",
							},
						],
						source:
							"This tree mirrors dynamoi_get_account_overview.recommendedNextActions. Use either; the tree is for explaining the plan to the user, the array is for deciding the next tool call.",
					}),
					uri: uri.href,
				},
			],
		}),
	);
}
