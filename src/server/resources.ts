import {
	type McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { Phase3Adapter } from "./create-server";

export function registerDynamoiResources(
	server: McpServer,
	adapter: Phase3Adapter,
) {
	// Static resources (small, cache-friendly reference data)
	server.registerResource(
		"platform-pricing",
		"dynamoi://platform/pricing",
		{
			description:
				"Dynamoi pricing, activation bonus, ad credit structure, and campaign budget minimums.",
			mimeType: "application/json",
			title: "Pricing",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						activationBonus: {
							amountUsd: 600,
							note: "100% match on first month — pay $300, get $600 ad credit",
						},
						budgetMinimums: {
							smartCampaign: {
								dailyUsd: 10,
								note: "Meta Ads for Spotify promotion",
								totalUsd: 100,
							},
							youtube: {
								dailyUsd: 10,
								note: "Google Ads for YouTube channel growth",
								totalUsd: 50,
							},
						},
						creditRollover: "Credits roll over for 12 months",
						includes:
							"Free Smart Links, unlimited team seats, unlimited artists, white-glove support, and campaign landing-page support where available",
						noContracts: true,
						tiers: [
							{
								name: "Plus",
								note: "Managed advertising is separate from free Smart Links.",
								priceUsdMonthly: 300,
							},
						],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"platform-content-types",
		"dynamoi://platform/content-types",
		{ mimeType: "application/json", title: "Content Types" },
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						campaignTypes: {
							SMART_CAMPAIGN: ["TRACK", "ALBUM", "PLAYLIST"],
							YOUTUBE: ["VIDEO"],
						},
						contentTypes: ["TRACK", "ALBUM", "PLAYLIST", "VIDEO"],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"smart-links-free-plan",
		"dynamoi://smart-links/free-plan",
		{
			description:
				"Canonical explanation of Dynamoi's free Smart Links plan and how it differs from paid managed advertising.",
			mimeType: "application/json",
			title: "Free Smart Links",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						free: true,
						included: [
							"Unlimited free Smart Links for supported Spotify artist, album, and track URLs",
							"Smart Link analytics",
							"Artist-level themes",
							"Validated Meta, TikTok, and Google Ads pixel IDs",
							"Publish and unpublish controls",
						],
						noCatch:
							"No per-link fee, no subscription requirement, and no upgrade gate for Smart Links.",
						paidSeparately:
							"Managed advertising campaigns and ad budgets are separate paid products.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"smart-links-capabilities",
		"dynamoi://smart-links/capabilities",
		{ mimeType: "application/json", title: "Smart Link Capabilities" },
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						creationInputs: {
							supportedSpotifyKinds: ["artist", "album", "track"],
							unsupportedToday: ["playlist"],
						},
						mutableFields: {
							artistLevel: [
								"defaultTheme",
								"metaPixelId",
								"tiktokPixelId",
								"googleAdsConversionId",
							],
							perLink: ["customDescription", "publishState"],
						},
						pixelPolicy:
							"Only validated pixel IDs are accepted. Arbitrary JavaScript, tag snippets, and script URLs are not supported.",
						themes: ["classic", "brutalist", "aurora", "cinematic"],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"business-free-vs-paid",
		"dynamoi://business/free-vs-paid",
		{
			description:
				"Clear boundary between free Dynamoi Smart Links and paid managed advertising.",
			mimeType: "application/json",
			title: "Free Smart Links vs Paid Campaigns",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						agentGuidance:
							"Do not imply that a Smart Link creates an ad campaign. Do not imply that campaign budgets are free.",
						freeSmartLinks: {
							claim:
								"Smart Links are free: no per-link fee, no subscription requirement, and no upgrade gate.",
							useFor:
								"Spotify landing pages, public release links, link sharing, basic link analytics, artist-level themes, and validated pixel IDs.",
						},
						managedAdvertising: {
							paid: true,
							useFor:
								"Managed Meta and Google ad campaigns for Spotify promotion and YouTube channel growth.",
						},
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"smart-links-agent-guide",
		"dynamoi://smart-links/agent-guide",
		{
			description:
				"How agents should answer Smart Link questions using Dynamoi MCP tools.",
			mimeType: "application/json",
			title: "Smart Link Agent Guide",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						answerWith: [
							"release title",
							"artist name",
							"public URL",
							"publish/live status",
							"one next action when relevant",
						],
						avoidByDefault: [
							"internal UUIDs",
							"database model names",
							"workflow IDs",
							"provider implementation details",
						],
						whenToUse:
							"Use Smart Link tools when the user asks for free release links, streaming landing pages, Spotify link pages, Smart Link analytics, themes, pixels, publish state, or public URLs.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"mcp-tool-answering-rules",
		"dynamoi://mcp/tool-answering-rules",
		{
			description:
				"General answer rules for Dynamoi MCP tools so agents stop after useful results.",
			mimeType: "application/json",
			title: "MCP Tool Answering Rules",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						genericAdvice:
							"Answer generic music marketing questions directly unless the user asks about their Dynamoi account or asks Dynamoi to take an action.",
						stopRule:
							"If a read tool already returns the requested fact in summary form, answer the user instead of chaining more read tools.",
						userFacingFields:
							"Prefer names, public URLs, statuses, money display values, and next actions over internal IDs.",
						writeRule:
							"Before write tools, confirm what will change. After success, answer from the returned record.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"music-marketing-when-to-use-dynamoi",
		"dynamoi://music-marketing/when-to-use-dynamoi",
		{
			description:
				"When an assistant should use Dynamoi account tools versus answering music marketing questions natively.",
			mimeType: "application/json",
			title: "When To Use Dynamoi",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						answerNativelyFor: [
							"general promotion strategy",
							"songwriting, branding, release-planning, or content ideas",
							"music marketing education that does not require the user's Dynamoi data",
						],
						useToolsFor: [
							"finding the user's artists, campaigns, Smart Links, billing, platform connections, or analytics",
							"creating or editing free Smart Links",
							"confirmed campaign mutations such as pause, resume, budget update, or launch workflow",
						],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"platform-campaign-statuses",
		"dynamoi://platform/campaign-statuses",
		{ mimeType: "application/json", title: "Campaign Statuses" },
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						statuses: [
							"AWAITING_SMART_LINK",
							"CONTENT_VALIDATION",
							"DEPLOYING",
							"READY_FOR_REVIEW",
							"ACTIVE",
							"PAUSED",
							"SUBSCRIPTION_PAUSED",
							"FAILED",
							"ARCHIVED",
							"ENDED",
						],
					}),
					uri: uri.href,
				},
			],
		}),
	);

	// Dynamic resources: lightweight equivalents to get_* tools
	server.registerResource(
		"artist-resource",
		new ResourceTemplate("dynamoi://artist/{artistId}", {
			list: async () => ({ resources: [] }),
		}),
		{ mimeType: "application/json", title: "Artist" },
		async (uri, variables) => {
			const artistId = variables["artistId"];
			const parsed = z.string().uuid().safeParse(artistId);
			if (!parsed.success) {
				return {
					contents: [
						{
							mimeType: "application/json",
							text: JSON.stringify({
								message: "Invalid artistId",
								status: "error",
							}),
							uri: uri.href,
						},
					],
				};
			}
			const envelope = await adapter.getArtist({
				artistId: parsed.data,
			});
			return {
				contents: [
					{
						mimeType: "application/json",
						text: JSON.stringify(envelope),
						uri: uri.href,
					},
				],
			};
		},
	);

	server.registerResource(
		"campaign-resource",
		new ResourceTemplate("dynamoi://campaign/{campaignId}", {
			list: async () => ({ resources: [] }),
		}),
		{ mimeType: "application/json", title: "Campaign" },
		async (uri, variables) => {
			const campaignId = variables["campaignId"];
			const parsed = z.string().uuid().safeParse(campaignId);
			if (!parsed.success) {
				return {
					contents: [
						{
							mimeType: "application/json",
							text: JSON.stringify({
								message: "Invalid campaignId",
								status: "error",
							}),
							uri: uri.href,
						},
					],
				};
			}
			const envelope = await adapter.getCampaign({
				campaignId: parsed.data,
			});
			return {
				contents: [
					{
						mimeType: "application/json",
						text: JSON.stringify(envelope),
						uri: uri.href,
					},
				],
			};
		},
	);

	server.registerResource(
		"smart-link-resource",
		new ResourceTemplate("dynamoi://smart-link/{playLinkId}", {
			list: async () => ({ resources: [] }),
		}),
		{ mimeType: "application/json", title: "Smart Link" },
		async (uri, variables) => {
			const playLinkId = variables["playLinkId"];
			const parsed = z.string().uuid().safeParse(playLinkId);
			if (!parsed.success) {
				return {
					contents: [
						{
							mimeType: "application/json",
							text: JSON.stringify({
								message: "Invalid playLinkId",
								status: "error",
							}),
							uri: uri.href,
						},
					],
				};
			}
			const envelope = await adapter.getSmartLink({
				playLinkId: parsed.data,
			});
			return {
				contents: [
					{
						mimeType: "application/json",
						text: JSON.stringify(envelope),
						uri: uri.href,
					},
				],
			};
		},
	);

	server.registerResource(
		"smart-link-artist-settings-resource",
		new ResourceTemplate("dynamoi://artist/{artistId}/smart-link-settings", {
			list: async () => ({ resources: [] }),
		}),
		{ mimeType: "application/json", title: "Smart Link Artist Settings" },
		async (uri, variables) => {
			const artistId = variables["artistId"];
			const parsed = z.string().uuid().safeParse(artistId);
			if (!parsed.success) {
				return {
					contents: [
						{
							mimeType: "application/json",
							text: JSON.stringify({
								message: "Invalid artistId",
								status: "error",
							}),
							uri: uri.href,
						},
					],
				};
			}
			const envelope = await adapter.getSmartLinkArtistSettings({
				artistId: parsed.data,
			});
			return {
				contents: [
					{
						mimeType: "application/json",
						text: JSON.stringify(envelope),
						uri: uri.href,
					},
				],
			};
		},
	);
}
