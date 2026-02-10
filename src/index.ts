// biome-ignore lint/performance/noBarrelFile: Public package entrypoint for `@dynamoi/mcp`.
export {
	buildProtectedResourceMetadata,
	buildWwwAuthenticateHeader,
} from "./auth/protected-resource";
export { verifyAccessToken } from "./auth/verify-token";
export type { Phase3Adapter } from "./server/create-server";
export { createDynamoiMcpServer } from "./server/create-server";
export {
	DateRangeSchema,
	DynamoiGetArtistInputSchema,
	DynamoiGetBillingInputSchema,
	DynamoiGetCampaignAnalyticsInputSchema,
	DynamoiGetCampaignInputSchema,
	DynamoiGetPlatformStatusInputSchema,
	DynamoiLaunchCampaignInputSchema,
	DynamoiListArtistsInputSchema,
	DynamoiListCampaignsInputSchema,
	DynamoiListMediaAssetsInputSchema,
	DynamoiPauseCampaignInputSchema,
	DynamoiResumeCampaignInputSchema,
	DynamoiSearchInputSchema,
	DynamoiUpdateBudgetInputSchema,
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_3_TOOL_DEFINITIONS,
	ToolFormatSchema,
} from "./server/tools";
export { handleMcpHttpRequest } from "./transport/http";
export type {
	AccessRole,
	ArtistTier,
	BillingStatus,
	CampaignDisplayStatus,
	CampaignType,
	GetArtistData,
	GetBillingData,
	GetCampaignAnalyticsJsonData,
	GetCampaignAnalyticsSummaryData,
	GetCampaignData,
	GetPlatformStatusData,
	LaunchCampaignData,
	ListArtistsData,
	ListCampaignsJsonData,
	ListCampaignsSummaryData,
	ListMediaAssetsData,
	MediaAssetSummary,
	MoneyDisplay,
	PauseResumeCampaignData,
	PauseResumePlatformResult,
	ResultEnvelope,
	SearchData,
	SearchResultType,
	UpdateBudgetData,
} from "./types";
