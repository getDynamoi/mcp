import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import {
	DYNAMOI_BETTER_AUTH_MCP_SCOPES,
	DYNAMOI_MCP_TOOL_SCOPES,
} from "../auth/protected-resource";
import type {
	CreateSmartLinkFromSpotifyData,
	CreateSmartLinksFromSpotifyArtistData,
	ApplyForDistributionData,
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
	GetDistributionApplicationData,
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
import {
	DYNAMOI_CHATGPT_APP_INSTRUCTIONS,
	DYNAMOI_MCP_INSTRUCTIONS,
} from "./instructions";
import { DISTRIBUTION_TOOL_DEFINITIONS } from "./distribution-tools";
import type { OpenAiFetchData, OpenAiSearchData } from "./openai-tools";
import { registerDynamoiPrompts } from "./prompts";
import { registerDynamoiResources } from "./resources";
import {
	previewSmartLinkThemes,
	registerSmartLinkThemePreviewResource,
	SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
	SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION,
} from "./smart-link-theme-preview";
import { PHASE_4_TOOL_DEFINITIONS } from "./smart-link-tools";
import {
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_ONBOARDING_TOOL_DEFINITIONS,
} from "./tools";
import { PHASE_3_TOOL_DEFINITIONS } from "./workflow-tools";

function buildDynamoiToolSecuritySchemes(scopes: readonly string[]) {
	return [{ scopes: [...scopes], type: "oauth2" as const }];
}

const DescriptiveEntitySchema = z
	.object({
		id: z.string().optional(),
		name: z.string().optional(),
		publicUrl: z.string().optional(),
		summary: z.string().optional(),
	})
	.passthrough();

const CHATGPT_DESCRIPTIVE_DATA_SCHEMAS = {
	dynamoi_get_account_overview: z
		.object({
			artistCount: z.number().optional(),
			artists: z
				.object({
					count: z.number(),
					summaries: z.array(DescriptiveEntitySchema),
				})
				.optional(),
			organizationCount: z.number().optional(),
			recommendedNextActions: z.array(z.string()).optional(),
			state: z.object({}).passthrough().optional(),
			summary: z.string().optional(),
			user: z.object({ name: z.string().optional() }).optional(),
		})
		.passthrough(),
	dynamoi_get_artist_analytics: z
		.object({
			artistId: z.string().optional(),
			artistName: z.string().optional(),
			dateRange: z.object({ end: z.string(), start: z.string() }).optional(),
			summary: z.string().optional(),
		})
		.passthrough(),
	dynamoi_get_campaign: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		contentTitle: z.string().optional(),
		nextActions: z.array(z.string()).optional(),
		status: z.string().optional(),
	}).passthrough(),
	dynamoi_get_platform_status: z
		.object({
			artistId: z.string().optional(),
			artistName: z.string().optional(),
			platforms: z.object({}).passthrough().optional(),
			summary: z.string().optional(),
		})
		.passthrough(),
	dynamoi_get_smart_link: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		artistName: z.string().optional(),
		nextActions: z.array(z.string()).optional(),
		publishState: z.string().optional(),
		releaseTitle: z.string().optional(),
		theme: z.string().optional(),
	}).passthrough(),
	dynamoi_list_artists: z
		.object({
			artists: z.array(DescriptiveEntitySchema).optional(),
			nextCursor: z.string().optional(),
			summary: z.string().optional(),
			totalCount: z.number().optional(),
		})
		.passthrough(),
	dynamoi_list_campaigns: z
		.object({
			campaigns: z.array(DescriptiveEntitySchema).optional(),
			nextCursor: z.string().optional(),
			summary: z.string().optional(),
			totalCount: z.number().optional(),
		})
		.passthrough(),
	dynamoi_preview_smart_link_themes: z
		.object({
			artistName: z.string(),
			releaseTitle: z.string(),
			themes: z.array(DescriptiveEntitySchema),
		})
		.passthrough(),
	dynamoi_search: z
		.object({
			nextCursor: z.string().optional(),
			results: z.array(DescriptiveEntitySchema).optional(),
			summary: z.string().optional(),
			totalCount: z.number().optional(),
		})
		.passthrough(),
	dynamoi_update_smart_link: DescriptiveEntitySchema.extend({
		artistId: z.string().optional(),
		artistName: z.string().optional(),
		defaultTheme: z.string().optional(),
		renderQueuedCount: z.number().optional(),
		renderWarning: z.string().nullable().optional(),
	}).passthrough(),
	fetch: DescriptiveEntitySchema,
	search: z
		.object({ results: z.array(DescriptiveEntitySchema).optional() })
		.passthrough(),
} as const;

function getAdvertisedToolOutputSchema(options: {
	canonical: z.ZodType;
	toolName: string;
	toolProfile: DynamoiMcpToolProfile;
}) {
	if (options.toolProfile !== "chatgpt-app") {
		return options.canonical;
	}
	const dataSchema =
		CHATGPT_DESCRIPTIVE_DATA_SCHEMAS[
			options.toolName as keyof typeof CHATGPT_DESCRIPTIVE_DATA_SCHEMAS
		];
	if (!dataSchema) {
		return options.canonical;
	}
	return z
		.object({
			data: dataSchema.optional(),
			kind: z.string().optional(),
			message: z.string().optional(),
			status: z.enum(["success", "partial_success", "error"]),
		})
		.passthrough();
}

function getDynamoiToolOAuthScopes(
	toolName: keyof typeof DYNAMOI_MCP_TOOL_SCOPES,
	providerScopes: readonly string[],
): readonly string[] {
	const requiredScopes = DYNAMOI_MCP_TOOL_SCOPES[toolName];
	if (!providerScopes.some((scope) => scope.startsWith("dynamoi:"))) {
		return providerScopes;
	}
	const missingScopes = requiredScopes.filter(
		(scope) => !providerScopes.includes(scope),
	);
	if (missingScopes.length > 0) {
		throw new Error(
			`MCP provider does not support ${toolName} scopes: ${missingScopes.join(", ")}`,
		);
	}
	return requiredScopes;
}

export type DynamoiMcpToolProfile = "full" | "chatgpt-app";

type DynamoiToolDefinition =
	| (typeof PHASE_1_TOOL_DEFINITIONS)[number]
	| (typeof PHASE_ONBOARDING_TOOL_DEFINITIONS)[number]
	| (typeof PHASE_2_TOOL_DEFINITIONS)[number]
	| (typeof PHASE_3_TOOL_DEFINITIONS)[number]
	| (typeof PHASE_4_TOOL_DEFINITIONS)[number]
	| (typeof DISTRIBUTION_TOOL_DEFINITIONS)[number]
	| typeof SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION;

const DYNAMOI_TOOL_DEFINITIONS = [
	...PHASE_1_TOOL_DEFINITIONS,
	...PHASE_ONBOARDING_TOOL_DEFINITIONS,
	...PHASE_2_TOOL_DEFINITIONS,
	...PHASE_3_TOOL_DEFINITIONS,
	...DISTRIBUTION_TOOL_DEFINITIONS,
	SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION,
	...PHASE_4_TOOL_DEFINITIONS,
] as const satisfies readonly DynamoiToolDefinition[];

const CHATGPT_APP_EXCLUDED_TOOL_NAMES = new Set<string>([
	"dynamoi_get_billing",
	"dynamoi_get_campaign_readiness",
	"dynamoi_launch_campaign",
	"dynamoi_list_available_countries",
	"dynamoi_list_media_assets",
	"dynamoi_start_meta_connection",
	"dynamoi_start_youtube_channel_link",
	"dynamoi_update_campaign",
]);

export function getDynamoiToolDefinitions(options?: {
	toolProfile?: DynamoiMcpToolProfile;
}): DynamoiToolDefinition[] {
	const definitions = [...DYNAMOI_TOOL_DEFINITIONS];
	if ((options?.toolProfile ?? "full") !== "chatgpt-app") {
		return definitions;
	}
	return definitions.filter(
		(definition) => !CHATGPT_APP_EXCLUDED_TOOL_NAMES.has(definition.name),
	);
}

export type Phase3Adapter = {
	applyForDistribution(
		input: unknown,
	): Promise<ResultEnvelope<ApplyForDistributionData>>;
	getCurrentUser(
		input: unknown,
	): Promise<ResultEnvelope<GetCurrentUserData | GetCurrentUserSummaryData>>;
	getDistributionApplication(
		input: unknown,
	): Promise<ResultEnvelope<GetDistributionApplicationData>>;
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
		ResultEnvelope<UpdateSmartLinkData | UpdateSmartLinkArtistSettingsData>
	>;
	updateSmartLinkArtistSettings(
		input: unknown,
	): Promise<ResultEnvelope<UpdateSmartLinkArtistSettingsData>>;
};

type DynamoiToolName = (typeof DYNAMOI_TOOL_DEFINITIONS)[number]["name"];
type DynamoiToolDispatcher = (
	adapter: Phase3Adapter,
	input: unknown,
) => Promise<ResultEnvelope<unknown>>;

const DYNAMOI_TOOL_DISPATCHERS = {
	dynamoi_apply_for_distribution: (adapter, input) =>
		adapter.applyForDistribution(input),
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
	dynamoi_get_distribution_application: (adapter, input) =>
		adapter.getDistributionApplication(input),
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
	dynamoi_preview_smart_link_themes: (_adapter, input) =>
		Promise.resolve(previewSmartLinkThemes(input)),
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

	const result: {
		content: Array<{ text: string; type: "text" }>;
		structuredContent: Record<string, unknown>;
		isError?: boolean;
	} = {
		content: [{ text: plainText, type: "text" as const }],
		structuredContent: envelope as Record<string, unknown>,
	};
	if (isToolError) {
		result.isError = true;
	}

	return result;
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
	onToolCall?: (input: {
		durationMs: number;
		error?: unknown;
		result?: unknown;
		toolName: string;
	}) => Promise<void> | void;
	oauthScopes?: readonly string[];
	toolProfile?: DynamoiMcpToolProfile;
	websiteUrl?: string;
}): McpServer {
	const toolProfile = options.toolProfile ?? "full";
	const server = new McpServer(
		{
			name: "dynamoi",
			version: DYNAMOI_MCP_VERSION,
			websiteUrl: options.websiteUrl ?? "https://dynamoi.com",
		},
		{
			instructions:
				toolProfile === "chatgpt-app"
					? DYNAMOI_CHATGPT_APP_INSTRUCTIONS
					: DYNAMOI_MCP_INSTRUCTIONS,
		},
	);

	for (const def of getDynamoiToolDefinitions({ toolProfile })) {
		const title = def.title;
		const dispatcher = DYNAMOI_TOOL_DISPATCHERS[def.name];
		const idempotentHint =
			"idempotentHint" in def && typeof def.idempotentHint === "boolean"
				? def.idempotentHint
				: undefined;
		const meta: Record<string, unknown> = {
			securitySchemes: buildDynamoiToolSecuritySchemes(
				getDynamoiToolOAuthScopes(
					def.name,
					options.oauthScopes ?? DYNAMOI_BETTER_AUTH_MCP_SCOPES,
				),
			),
		};
		if (def.name === "dynamoi_preview_smart_link_themes") {
			meta["openai/outputTemplate"] = SMART_LINK_THEME_PREVIEW_RESOURCE_URI;
			meta["ui"] = { resourceUri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI };
		}
		const annotations: Record<string, unknown> = {
			destructiveHint: def.destructiveHint,
			openWorldHint: def.openWorldHint,
			readOnlyHint: def.readOnlyHint,
		};
		if (typeof idempotentHint === "boolean") {
			annotations["idempotentHint"] = idempotentHint;
		}
		server.registerTool(
			def.name,
			{
				_meta: meta,
				annotations,
				description: def.description,
				inputSchema: def.schema,
				outputSchema: getAdvertisedToolOutputSchema({
					canonical: def.outputSchema,
					toolName: def.name,
					toolProfile,
				}),
				title,
			},
			async (input: unknown) => {
				const startedAt = Date.now();
				try {
					const envelope = await dispatcher(options.adapter, input);
					try {
						await options.onToolCall?.({
							durationMs: Date.now() - startedAt,
							result: envelope,
							toolName: def.name,
						});
					} catch {
						// Observability must never change a tool result.
					}
					return asValidatedTextResult({
						envelope,
						outputSchema: def.outputSchema,
						toolName: def.name,
					});
				} catch (error) {
					try {
						await options.onToolCall?.({
							durationMs: Date.now() - startedAt,
							error,
							toolName: def.name,
						});
					} catch {
						// Preserve the dispatcher failure when observability also fails.
					}
					throw error;
				}
			},
		);
	}

	registerSmartLinkThemePreviewResource(server);

	if (toolProfile === "full") {
		registerDynamoiPrompts(server);
		registerDynamoiResources(server, options.adapter);
	}

	return server;
}
