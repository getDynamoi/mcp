import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type {
	CreateSmartLinkFromSpotifyData,
	GetArtistAnalyticsJsonData,
	GetArtistAnalyticsSummaryData,
	GetArtistData,
	GetArtistSummaryData,
	GetBillingData,
	GetBillingSummaryData,
	GetCampaignAnalyticsJsonData,
	GetCampaignAnalyticsSummaryData,
	GetCampaignData,
	GetCampaignDeploymentStatusData,
	GetCampaignDeploymentStatusSummaryData,
	GetCampaignReadinessData,
	GetCampaignReadinessSummaryData,
	GetCampaignSummaryData,
	GetCurrentUserData,
	GetCurrentUserSummaryData,
	GetOnboardingStatusData,
	GetOnboardingStatusSummaryData,
	GetPlatformStatusData,
	GetPlatformStatusSummaryData,
	GetSmartLinkAnalyticsData,
	GetSmartLinkAnalyticsSummaryData,
	GetSmartLinkData,
	GetSmartLinkSummaryData,
	LaunchCampaignData,
	ListArtistsData,
	ListArtistsSummaryData,
	ListAvailableCountriesData,
	ListAvailableCountriesSummaryData,
	ListCampaignsJsonData,
	ListCampaignsSummaryData,
	ListMediaAssetsData,
	ListMediaAssetsSummaryData,
	ListSmartLinksData,
	ListSmartLinksSummaryData,
	PauseResumeCampaignData,
	PublishSmartLinkData,
	ResultEnvelope,
	SearchData,
	SearchSummaryData,
	SmartLinkSettingsData,
	UpdateBudgetData,
	UpdateSmartLinkArtistSettingsData,
	UpdateSmartLinkData,
} from "../types";
import { DYNAMOI_MCP_VERSION } from "../version";
import { DYNAMOI_MCP_INSTRUCTIONS } from "./instructions";
import { registerDynamoiPrompts } from "./prompts";
import { registerDynamoiResources } from "./resources";
import { PHASE_4_TOOL_DEFINITIONS } from "./smart-link-tools";
import {
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_3_TOOL_DEFINITIONS,
} from "./tools";

const SdkToolOutputEnvelopeSchema = z
	.object({
		status: z.enum(["success", "partial_success", "error"]),
	})
	.passthrough();

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
	getArtistAnalytics(
		input: unknown,
	): Promise<
		ResultEnvelope<GetArtistAnalyticsJsonData | GetArtistAnalyticsSummaryData>
	>;
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
	listAvailableCountries(
		input: unknown,
	): Promise<
		ResultEnvelope<
			ListAvailableCountriesData | ListAvailableCountriesSummaryData
		>
	>;
	getOnboardingStatus(
		input: unknown,
	): Promise<
		ResultEnvelope<GetOnboardingStatusData | GetOnboardingStatusSummaryData>
	>;
	getCampaignReadiness(
		input: unknown,
	): Promise<
		ResultEnvelope<GetCampaignReadinessData | GetCampaignReadinessSummaryData>
	>;
	getCampaignDeploymentStatus(
		input: unknown,
	): Promise<
		ResultEnvelope<
			GetCampaignDeploymentStatusData | GetCampaignDeploymentStatusSummaryData
		>
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
	createSmartLinkFromSpotify(
		input: unknown,
	): Promise<ResultEnvelope<CreateSmartLinkFromSpotifyData>>;
	listSmartLinks(
		input: unknown,
	): Promise<ResultEnvelope<ListSmartLinksData | ListSmartLinksSummaryData>>;
	getSmartLink(
		input: unknown,
	): Promise<ResultEnvelope<GetSmartLinkData | GetSmartLinkSummaryData>>;
	getSmartLinkAnalytics(
		input: unknown,
	): Promise<
		ResultEnvelope<GetSmartLinkAnalyticsData | GetSmartLinkAnalyticsSummaryData>
	>;
	getSmartLinkArtistSettings(
		input: unknown,
	): Promise<ResultEnvelope<SmartLinkSettingsData>>;
	updateSmartLink(input: unknown): Promise<ResultEnvelope<UpdateSmartLinkData>>;
	updateSmartLinkArtistSettings(
		input: unknown,
	): Promise<ResultEnvelope<UpdateSmartLinkArtistSettingsData>>;
	publishSmartLink(
		input: unknown,
	): Promise<ResultEnvelope<PublishSmartLinkData>>;
	unpublishSmartLink(
		input: unknown,
	): Promise<ResultEnvelope<PublishSmartLinkData>>;
};

export function asTextResult(envelope: unknown) {
	const isToolError =
		Boolean(envelope) &&
		typeof envelope === "object" &&
		(envelope as { status?: unknown }).status === "error";
	const plainText = (() => {
		if (!envelope || typeof envelope !== "object") {
			return JSON.stringify(envelope);
		}

		const status = (envelope as { status?: unknown }).status;
		if (status === "error") {
			const message = (envelope as { message?: unknown }).message;
			return typeof message === "string" && message.trim().length > 0
				? message
				: JSON.stringify(envelope);
		}

		const data = (envelope as { data?: unknown }).data;
		if (data && typeof data === "object") {
			const summary = (data as { summary?: unknown }).summary;
			if (typeof summary === "string" && summary.trim().length > 0) {
				return summary;
			}
		}

		return JSON.stringify(envelope);
	})();

	return {
		content: [{ text: plainText, type: "text" as const }],
		structuredContent: envelope as Record<string, unknown>,
		...(isToolError ? { isError: true } : {}),
	};
}

export function asValidatedTextResult(options: {
	envelope: unknown;
	outputSchema: z.ZodType;
	toolName: string;
}) {
	const parsed = options.outputSchema.safeParse(options.envelope);
	if (!parsed.success) {
		return asTextResult({
			kind: "validation",
			message: `Tool ${options.toolName} returned an invalid result shape.`,
			status: "error",
		} satisfies ResultEnvelope<never>);
	}
	return asTextResult(options.envelope);
}

export function createDynamoiMcpServer(options: {
	adapter: Phase3Adapter;
	websiteUrl?: string;
}): McpServer {
	const server = new McpServer(
		{
			name: "dynamoi",
			version: DYNAMOI_MCP_VERSION,
			websiteUrl: options.websiteUrl ?? "https://dynamoi.com",
		},
		{ instructions: DYNAMOI_MCP_INSTRUCTIONS },
	);

	// Tools (Phase 1 + Phase 2)
	for (const def of [
		...PHASE_1_TOOL_DEFINITIONS,
		...PHASE_2_TOOL_DEFINITIONS,
		...PHASE_3_TOOL_DEFINITIONS,
		...PHASE_4_TOOL_DEFINITIONS,
	]) {
		const title = def.title;
		const idempotentHint =
			"idempotentHint" in def && typeof def.idempotentHint === "boolean"
				? def.idempotentHint
				: undefined;
		server.registerTool(
			def.name,
			{
				annotations: {
					destructiveHint: def.destructiveHint,
					...(typeof idempotentHint === "boolean" ? { idempotentHint } : {}),
					openWorldHint: def.openWorldHint,
					readOnlyHint: def.readOnlyHint,
				},
				description: def.description,
				inputSchema: def.schema,
				// The SDK's runtime output validator currently only normalizes object
				// schemas; our canonical output schemas are unions of success/error
				// envelopes and are validated below in asValidatedTextResult().
				outputSchema: SdkToolOutputEnvelopeSchema,
				title,
			},
			async (input: unknown) => {
				switch (def.name) {
					case "dynamoi_get_account_overview":
						return asValidatedTextResult({
							envelope: await options.adapter.getCurrentUser(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_list_artists":
						return asValidatedTextResult({
							envelope: await options.adapter.listArtists(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_search":
						return asValidatedTextResult({
							envelope: await options.adapter.search(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_artist":
						return asValidatedTextResult({
							envelope: await options.adapter.getArtist(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_artist_analytics":
						return asValidatedTextResult({
							envelope: await options.adapter.getArtistAnalytics(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_list_campaigns":
						return asValidatedTextResult({
							envelope: await options.adapter.listCampaigns(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_campaign":
						return asValidatedTextResult({
							envelope: await options.adapter.getCampaign(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_campaign_analytics":
						return asValidatedTextResult({
							envelope: await options.adapter.getCampaignAnalytics(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_billing":
						return asValidatedTextResult({
							envelope: await options.adapter.getBilling(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_platform_status":
						return asValidatedTextResult({
							envelope: await options.adapter.getPlatformStatus(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_list_available_countries":
						return asValidatedTextResult({
							envelope: await options.adapter.listAvailableCountries(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_onboarding_status":
						return asValidatedTextResult({
							envelope: await options.adapter.getOnboardingStatus(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_campaign_readiness":
						return asValidatedTextResult({
							envelope: await options.adapter.getCampaignReadiness(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_campaign_deployment_status":
						return asValidatedTextResult({
							envelope:
								await options.adapter.getCampaignDeploymentStatus(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_pause_campaign":
						return asValidatedTextResult({
							envelope: await options.adapter.pauseCampaign(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_resume_campaign":
						return asValidatedTextResult({
							envelope: await options.adapter.resumeCampaign(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_update_budget":
						return asValidatedTextResult({
							envelope: await options.adapter.updateBudget(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_list_media_assets":
						return asValidatedTextResult({
							envelope: await options.adapter.listMediaAssets(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_launch_campaign":
						return asValidatedTextResult({
							envelope: await options.adapter.launchCampaign(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_create_smart_link_from_spotify":
						return asValidatedTextResult({
							envelope: await options.adapter.createSmartLinkFromSpotify(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_list_smart_links":
						return asValidatedTextResult({
							envelope: await options.adapter.listSmartLinks(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_smart_link":
						return asValidatedTextResult({
							envelope: await options.adapter.getSmartLink(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_smart_link_analytics":
						return asValidatedTextResult({
							envelope: await options.adapter.getSmartLinkAnalytics(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_get_smart_link_artist_settings":
						return asValidatedTextResult({
							envelope: await options.adapter.getSmartLinkArtistSettings(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_update_smart_link":
						return asValidatedTextResult({
							envelope: await options.adapter.updateSmartLink(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_update_smart_link_artist_settings":
						return asValidatedTextResult({
							envelope:
								await options.adapter.updateSmartLinkArtistSettings(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_publish_smart_link":
						return asValidatedTextResult({
							envelope: await options.adapter.publishSmartLink(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
					case "dynamoi_unpublish_smart_link":
						return asValidatedTextResult({
							envelope: await options.adapter.unpublishSmartLink(input),
							outputSchema: def.outputSchema,
							toolName: def.name,
						});
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
	registerDynamoiResources(server, options.adapter);

	return server;
}
