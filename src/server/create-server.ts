import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { DYNAMOI_MCP_SCOPES } from "../auth/protected-resource";
import type {
	CreateSmartLinkFromSpotifyData,
	CreateSmartLinksFromSpotifyArtistData,
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
	StartMetaConnectionData,
	StartYoutubeChannelLinkData,
	UpdateBudgetData,
	UpdateCampaignData,
	UpdateSmartLinkArtistSettingsData,
	UpdateSmartLinkData,
} from "../types";
import { DYNAMOI_MCP_VERSION } from "../version";
import { DYNAMOI_MCP_INSTRUCTIONS } from "./instructions";
import type { OpenAiFetchData, OpenAiSearchData } from "./openai-tools";
import { registerDynamoiPrompts } from "./prompts";
import { registerDynamoiResources } from "./resources";
import { PHASE_4_TOOL_DEFINITIONS } from "./smart-link-tools";
import {
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_ONBOARDING_TOOL_DEFINITIONS,
} from "./tools";
import { PHASE_3_TOOL_DEFINITIONS } from "./workflow-tools";

const SdkToolOutputEnvelopeSchema = z
	.object({
		status: z.enum(["success", "partial_success", "error"]),
	})
	.passthrough();

function buildDynamoiToolSecuritySchemes() {
	return [{ scopes: [...DYNAMOI_MCP_SCOPES], type: "oauth2" as const }];
}

const DYNAMOI_TOOL_DEFINITIONS = [
	...PHASE_1_TOOL_DEFINITIONS,
	...PHASE_ONBOARDING_TOOL_DEFINITIONS,
	...PHASE_2_TOOL_DEFINITIONS,
	...PHASE_3_TOOL_DEFINITIONS,
	...PHASE_4_TOOL_DEFINITIONS,
] as const;

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
	openAiSearch(input: unknown): Promise<ResultEnvelope<OpenAiSearchData>>;
	openAiFetch(input: unknown): Promise<ResultEnvelope<OpenAiFetchData>>;
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
	startMetaConnection(
		input: unknown,
	): Promise<ResultEnvelope<StartMetaConnectionData>>;
	getPlatformStatus(
		input: unknown,
	): Promise<
		ResultEnvelope<GetPlatformStatusData | GetPlatformStatusSummaryData>
	>;
	startYoutubeChannelLink(
		input: unknown,
	): Promise<ResultEnvelope<StartYoutubeChannelLinkData>>;
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
	updateCampaign(input: unknown): Promise<ResultEnvelope<UpdateCampaignData>>;

	listMediaAssets(
		input: unknown,
	): Promise<ResultEnvelope<ListMediaAssetsData | ListMediaAssetsSummaryData>>;
	launchCampaign(input: unknown): Promise<ResultEnvelope<LaunchCampaignData>>;
	createSmartLinkFromSpotify(
		input: unknown,
	): Promise<ResultEnvelope<CreateSmartLinkFromSpotifyData>>;
	createSmartLinksFromSpotifyArtist(
		input: unknown,
	): Promise<ResultEnvelope<CreateSmartLinksFromSpotifyArtistData>>;
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
	updateSmartLink(
		input: unknown,
	): Promise<
		ResultEnvelope<
			| UpdateSmartLinkData
			| UpdateSmartLinkArtistSettingsData
			| PublishSmartLinkData
		>
	>;
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

type DynamoiToolName = (typeof DYNAMOI_TOOL_DEFINITIONS)[number]["name"];
type DynamoiToolDispatcher = (
	adapter: Phase3Adapter,
	input: unknown,
) => Promise<ResultEnvelope<unknown>>;

const DYNAMOI_TOOL_DISPATCHERS = {
	dynamoi_create_smart_link_from_spotify: (adapter, input) =>
		adapter.createSmartLinkFromSpotify(input),
	dynamoi_create_smart_links_from_spotify_artist: (adapter, input) =>
		adapter.createSmartLinksFromSpotifyArtist(input),
	dynamoi_get_account_overview: (adapter, input) =>
		adapter.getCurrentUser(input),
	dynamoi_get_artist_analytics: (adapter, input) =>
		adapter.getArtistAnalytics(input),
	dynamoi_get_billing: (adapter, input) => adapter.getBilling(input),
	dynamoi_get_campaign: (adapter, input) => adapter.getCampaign(input),
	dynamoi_get_campaign_readiness: (adapter, input) =>
		adapter.getCampaignReadiness(input),
	dynamoi_get_platform_status: (adapter, input) =>
		adapter.getPlatformStatus(input),
	dynamoi_get_smart_link: (adapter, input) => adapter.getSmartLink(input),
	dynamoi_launch_campaign: (adapter, input) => adapter.launchCampaign(input),
	dynamoi_list_artists: (adapter, input) => adapter.listArtists(input),
	dynamoi_list_available_countries: (adapter, input) =>
		adapter.listAvailableCountries(input),
	dynamoi_list_campaigns: (adapter, input) => adapter.listCampaigns(input),
	dynamoi_list_media_assets: (adapter, input) => adapter.listMediaAssets(input),
	dynamoi_list_smart_links: (adapter, input) => adapter.listSmartLinks(input),
	dynamoi_search: (adapter, input) => adapter.search(input),
	dynamoi_start_meta_connection: (adapter, input) =>
		adapter.startMetaConnection(input),
	dynamoi_start_youtube_channel_link: (adapter, input) =>
		adapter.startYoutubeChannelLink(input),
	dynamoi_update_campaign: (adapter, input) => adapter.updateCampaign(input),
	dynamoi_update_smart_link: (adapter, input) => adapter.updateSmartLink(input),
	fetch: (adapter, input) => adapter.openAiFetch(input),
	search: (adapter, input) => adapter.openAiSearch(input),
} satisfies Record<DynamoiToolName, DynamoiToolDispatcher>;

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
	for (const def of DYNAMOI_TOOL_DEFINITIONS) {
		const title = def.title;
		const dispatcher = DYNAMOI_TOOL_DISPATCHERS[def.name];
		const idempotentHint =
			"idempotentHint" in def && typeof def.idempotentHint === "boolean"
				? def.idempotentHint
				: undefined;
		server.registerTool(
			def.name,
			{
				_meta: {
					securitySchemes: buildDynamoiToolSecuritySchemes(),
				},
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
			async (input: unknown) =>
				asValidatedTextResult({
					envelope: await dispatcher(options.adapter, input),
					outputSchema: def.outputSchema,
					toolName: def.name,
				}),
		);
	}

	// Prompts: curated workflow starters for assistants.
	registerDynamoiPrompts(server);
	registerDynamoiResources(server, options.adapter);

	return server;
}
