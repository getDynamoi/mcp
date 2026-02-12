import {
	McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type {
	GetArtistData,
	GetArtistSummaryData,
	GetBillingData,
	GetBillingSummaryData,
	GetCampaignAnalyticsJsonData,
	GetCampaignAnalyticsSummaryData,
	GetCampaignData,
	GetCampaignSummaryData,
	GetCurrentUserData,
	GetCurrentUserSummaryData,
	GetPlatformStatusData,
	GetPlatformStatusSummaryData,
	LaunchCampaignData,
	ListArtistsData,
	ListArtistsSummaryData,
	ListCampaignsJsonData,
	ListCampaignsSummaryData,
	ListMediaAssetsData,
	ListMediaAssetsSummaryData,
	PauseResumeCampaignData,
	ResultEnvelope,
	SearchData,
	SearchSummaryData,
	UpdateBudgetData,
} from "../types";
import { DYNAMOI_MCP_VERSION } from "../version";
import { DYNAMOI_MCP_INSTRUCTIONS } from "./instructions";
import { registerDynamoiPrompts } from "./prompts";
import {
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_3_TOOL_DEFINITIONS,
} from "./tools";

export type Phase3Adapter = {
	getCurrentUser(
		input: unknown,
	): Promise<ResultEnvelope<GetCurrentUserData | GetCurrentUserSummaryData>>;
	listArtists(
		input: unknown,
	): Promise<ResultEnvelope<ListArtistsData | ListArtistsSummaryData>>;
	search(
		input: unknown,
	): Promise<ResultEnvelope<SearchData | SearchSummaryData>>;
	getArtist(
		input: unknown,
	): Promise<ResultEnvelope<GetArtistData | GetArtistSummaryData>>;
	listCampaigns(
		input: unknown,
	): Promise<ResultEnvelope<ListCampaignsJsonData | ListCampaignsSummaryData>>;
	getCampaign(
		input: unknown,
	): Promise<ResultEnvelope<GetCampaignData | GetCampaignSummaryData>>;
	getCampaignAnalytics(
		input: unknown,
	): Promise<
		ResultEnvelope<
			GetCampaignAnalyticsJsonData | GetCampaignAnalyticsSummaryData
		>
	>;
	getBilling(
		input: unknown,
	): Promise<ResultEnvelope<GetBillingData | GetBillingSummaryData>>;
	getPlatformStatus(
		input: unknown,
	): Promise<
		ResultEnvelope<GetPlatformStatusData | GetPlatformStatusSummaryData>
	>;

	pauseCampaign(
		input: unknown,
	): Promise<ResultEnvelope<PauseResumeCampaignData>>;
	resumeCampaign(
		input: unknown,
	): Promise<ResultEnvelope<PauseResumeCampaignData>>;
	updateBudget(input: unknown): Promise<ResultEnvelope<UpdateBudgetData>>;

	listMediaAssets(
		input: unknown,
	): Promise<ResultEnvelope<ListMediaAssetsData | ListMediaAssetsSummaryData>>;
	launchCampaign(input: unknown): Promise<ResultEnvelope<LaunchCampaignData>>;
};

function asTextResult(envelope: unknown) {
	return {
		content: [{ text: JSON.stringify(envelope), type: "text" as const }],
		structuredContent: envelope as Record<string, unknown>,
	};
}

export function createDynamoiMcpServer(options: {
	adapter: Phase3Adapter;
}): McpServer {
	const server = new McpServer(
		{
			name: "dynamoi",
			version: DYNAMOI_MCP_VERSION,
			websiteUrl: "https://dynamoi.com",
		},
		{ instructions: DYNAMOI_MCP_INSTRUCTIONS },
	);

	// Tools (Phase 1 + Phase 2)
	for (const def of [
		...PHASE_1_TOOL_DEFINITIONS,
		...PHASE_2_TOOL_DEFINITIONS,
		...PHASE_3_TOOL_DEFINITIONS,
	]) {
		server.registerTool(
			def.name,
			{
				annotations: {
					destructiveHint: def.destructiveHint,
					openWorldHint: def.openWorldHint,
					readOnlyHint: def.readOnlyHint,
				},
				description: def.description,
				inputSchema: def.schema,
				title: def.name,
			},
			async (input: unknown) => {
				switch (def.name) {
					case "dynamoi_get_current_user":
						return asTextResult(await options.adapter.getCurrentUser(input));
					case "dynamoi_list_artists":
						return asTextResult(await options.adapter.listArtists(input));
					case "dynamoi_search":
						return asTextResult(await options.adapter.search(input));
					case "dynamoi_get_artist":
						return asTextResult(await options.adapter.getArtist(input));
					case "dynamoi_list_campaigns":
						return asTextResult(await options.adapter.listCampaigns(input));
					case "dynamoi_get_campaign":
						return asTextResult(await options.adapter.getCampaign(input));
					case "dynamoi_get_campaign_analytics":
						return asTextResult(
							await options.adapter.getCampaignAnalytics(input),
						);
					case "dynamoi_get_billing":
						return asTextResult(await options.adapter.getBilling(input));
					case "dynamoi_get_platform_status":
						return asTextResult(await options.adapter.getPlatformStatus(input));
					case "dynamoi_pause_campaign":
						return asTextResult(await options.adapter.pauseCampaign(input));
					case "dynamoi_resume_campaign":
						return asTextResult(await options.adapter.resumeCampaign(input));
					case "dynamoi_update_budget":
						return asTextResult(await options.adapter.updateBudget(input));
					case "dynamoi_list_media_assets":
						return asTextResult(await options.adapter.listMediaAssets(input));
					case "dynamoi_launch_campaign":
						return asTextResult(await options.adapter.launchCampaign(input));
					default:
						return asTextResult({
							message: "Unknown tool",
							status: "error",
						} satisfies ResultEnvelope<never>);
				}
			},
		);
	}

	// Prompts: curated workflow starters for assistants.
	registerDynamoiPrompts(server);

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
							"Unlimited team seats, unlimited artists, white-glove support, free smart link landing pages",
						noContracts: true,
						tiers: [
							{
								name: "Plus",
								note: "100% Ad Credit. No agency fees.",
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
		new ResourceTemplate("artist://{artistId}", {
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
			const envelope = await options.adapter.getArtist({
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
		new ResourceTemplate("campaign://{campaignId}", {
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
			const envelope = await options.adapter.getCampaign({
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

	return server;
}
