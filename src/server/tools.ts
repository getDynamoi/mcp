import * as z from "zod/v4";

export const ToolFormatSchema = z.enum(["json", "summary"]);

export const DynamoiListArtistsInputSchema = z.object({
	cursor: z.string().optional(),
	format: ToolFormatSchema.optional(),
	limit: z.number().int().min(1).max(50).optional(),
});

export const DynamoiSearchInputSchema = z.object({
	artistId: z.string().uuid().optional(),
	cursor: z.string().optional(),
	format: ToolFormatSchema.optional(),
	limit: z.number().int().min(1).max(50).optional(),
	query: z.string().trim().optional(),
	type: z.enum(["artist", "campaign", "smartlink"]).optional(),
});

export const DynamoiGetCurrentUserInputSchema = z.object({
	format: ToolFormatSchema.optional(),
});

export const DynamoiGetArtistInputSchema = z.object({
	artistId: z.string().uuid(),
	format: ToolFormatSchema.optional(),
});

export const DynamoiListCampaignsInputSchema = z.object({
	artistId: z.string().uuid(),
	campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]).optional(),
	cursor: z.string().optional(),
	format: ToolFormatSchema.optional(),
	limit: z.number().int().min(1).max(50).optional(),
	status: z.string().trim().optional(),
});

export const DynamoiGetCampaignInputSchema = z.object({
	campaignId: z.string().uuid(),
	format: ToolFormatSchema.optional(),
	includeCountries: z.boolean().optional(),
});

export const DateRangeSchema = z.object({
	end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const DynamoiGetCampaignAnalyticsInputSchema = z.object({
	campaignId: z.string().uuid(),
	dateRange: DateRangeSchema.optional(),
	format: ToolFormatSchema.optional(),
	granularity: z.enum(["TOTAL", "DAILY"]).optional(),
});

export const DynamoiGetArtistAnalyticsInputSchema = z.object({
	artistId: z.string().uuid(),
	dateRange: DateRangeSchema.optional(),
	format: ToolFormatSchema.optional(),
	granularity: z.enum(["TOTAL", "DAILY"]).optional(),
});

export const DynamoiGetBillingInputSchema = z.object({
	artistId: z.string().uuid(),
	format: ToolFormatSchema.optional(),
});

export const DynamoiGetPlatformStatusInputSchema = z.object({
	artistId: z.string().uuid(),
	format: ToolFormatSchema.optional(),
});

export const DynamoiPauseCampaignInputSchema = z.object({
	campaignId: z.string().uuid(),
});

export const DynamoiResumeCampaignInputSchema = z.object({
	campaignId: z.string().uuid(),
});

export const DynamoiUpdateBudgetInputSchema = z.object({
	budgetAmount: z.number().finite().positive(),
	campaignId: z.string().uuid(),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
});

const LocationTargetSchema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
});

export const DynamoiListMediaAssetsInputSchema = z.object({
	artistId: z.string().uuid(),
	cursor: z.string().optional(),
	format: ToolFormatSchema.optional(),
	limit: z.number().int().min(1).max(50).optional(),
});

export const DynamoiLaunchCampaignInputSchema = z
	.object({
		// Creative
		adCopy: z.string().trim().optional(),
		appleMusicUrl: z.string().trim().min(1).optional(),
		artistId: z.string().uuid(),

		// Budget
		budgetAmount: z.number().finite().positive(),
		budgetSplits: z.record(
			z.enum(["META", "GOOGLE"]),
			z.number().int().min(0).max(100),
		),
		budgetType: z.enum(["DAILY", "TOTAL"]),

		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		// Idempotency (client-generated UUID)
		clientRequestId: z.string().uuid(),

		// Content
		contentTitle: z.string().trim().min(1),
		contentType: z.enum(["TRACK", "ALBUM", "PLAYLIST", "VIDEO"]),
		endDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional(),

		// Targeting
		locationTargets: z.array(LocationTargetSchema).optional(),

		// Smart Campaign creative selection (existing assets only in Phase 3)
		mediaAssetIds: z.array(z.string().uuid()).optional(),
		spotifyUrl: z.string().trim().min(1).optional(),
		useAiGeneratedCopy: z.boolean().optional(),
		youtubeVideoId: z.string().trim().min(1).optional(),
	})
	.superRefine((data, ctx) => {
		if (data.budgetType === "TOTAL" && !data.endDate) {
			ctx.addIssue({
				code: "custom",
				message: "endDate is required when budgetType is TOTAL",
				path: ["endDate"],
			});
		}

		const sum = Object.values(data.budgetSplits ?? {}).reduce(
			(acc, v) => acc + (Number.isFinite(v) ? v : 0),
			0,
		);
		if (!(sum > 0)) {
			ctx.addIssue({
				code: "custom",
				message: "budgetSplits must allocate at least one platform",
				path: ["budgetSplits"],
			});
		}

		// Require splits to sum to ~100 for predictable intent.
		if (sum > 0 && Math.abs(sum - 100) > 0.01) {
			ctx.addIssue({
				code: "custom",
				message: "budgetSplits must sum to 100",
				path: ["budgetSplits"],
			});
		}

		if (data.campaignType === "SMART_CAMPAIGN") {
			if (!data.spotifyUrl) {
				ctx.addIssue({
					code: "custom",
					message: "spotifyUrl is required for SMART_CAMPAIGN",
					path: ["spotifyUrl"],
				});
			}
			if (!data.mediaAssetIds || data.mediaAssetIds.length === 0) {
				ctx.addIssue({
					code: "custom",
					message: "mediaAssetIds is required for SMART_CAMPAIGN",
					path: ["mediaAssetIds"],
				});
			}
			if (!("META" in data.budgetSplits) || data.budgetSplits.META <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "SMART_CAMPAIGN requires a META budget split > 0",
					path: ["budgetSplits", "META"],
				});
			}
			// Smart Campaigns are Meta-only today. Keep the public contract accurate.
			if (data.budgetSplits.GOOGLE && data.budgetSplits.GOOGLE > 0) {
				ctx.addIssue({
					code: "custom",
					message: "SMART_CAMPAIGN does not support GOOGLE budget splits",
					path: ["budgetSplits", "GOOGLE"],
				});
			}
		}

		if (data.campaignType === "YOUTUBE") {
			if (!data.youtubeVideoId) {
				ctx.addIssue({
					code: "custom",
					message: "youtubeVideoId is required for YOUTUBE",
					path: ["youtubeVideoId"],
				});
			}
			if (data.contentType !== "VIDEO") {
				ctx.addIssue({
					code: "custom",
					message: "contentType must be VIDEO for YOUTUBE",
					path: ["contentType"],
				});
			}
			if (!("GOOGLE" in data.budgetSplits) || data.budgetSplits.GOOGLE <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "YOUTUBE requires a GOOGLE budget split > 0",
					path: ["budgetSplits", "GOOGLE"],
				});
			}
			// YouTube campaigns are Google-only today.
			if (data.budgetSplits.META && data.budgetSplits.META > 0) {
				ctx.addIssue({
					code: "custom",
					message: "YOUTUBE does not support META budget splits",
					path: ["budgetSplits", "META"],
				});
			}
		}
	});

export const PHASE_1_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when you need a quick overview of the signed-in Dynamoi account and how many organizations or artists it can access. Do not use this to enumerate artists one by one; use dynamoi_list_artists for that.",
		destructiveHint: false,
		name: "dynamoi_get_current_user",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetCurrentUserInputSchema,
	},
	{
		description:
			"Use this when the user wants to see which artists or YouTube channels they manage, along with billing status, active campaign count, and their role. Do not use this for campaign details; use dynamoi_list_campaigns or dynamoi_get_campaign.",
		destructiveHint: false,
		name: "dynamoi_list_artists",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiListArtistsInputSchema,
	},
	{
		description:
			"Use this when the user mentions an artist, release, campaign, or smart link but you do not yet know the exact record to inspect. Do not use this for analytics summaries or billing questions once you already know the target record.",
		destructiveHint: false,
		name: "dynamoi_search",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiSearchInputSchema,
	},
	{
		description:
			"Use this when the user wants the profile and launch readiness for one specific artist or YouTube channel, including connected platforms and billing state. Do not use this to list every artist; use dynamoi_list_artists first.",
		destructiveHint: false,
		name: "dynamoi_get_artist",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetArtistInputSchema,
	},
	{
		description:
			"Use this when the user wants to browse campaigns for one artist, optionally filtered by type or status. Do not use this for a single campaign deep dive; use dynamoi_get_campaign for that.",
		destructiveHint: false,
		name: "dynamoi_list_campaigns",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiListCampaignsInputSchema,
	},
	{
		description:
			"Use this when the user wants full details for one campaign, including budget, targeting, platform status, and next actions. Do not use this for a campaign list; use dynamoi_list_campaigns instead. Pass includeCountries=true only when the full country list is needed.",
		destructiveHint: false,
		name: "dynamoi_get_campaign",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetCampaignInputSchema,
	},
	{
		description:
			"Use this when the user asks how one campaign is performing across impressions, clicks, spend, CPC, CPM, or CTR. Pass granularity=DAILY when the user asks for a daily breakdown. Do not use this for artist-wide performance across multiple campaigns; use dynamoi_get_artist_analytics instead.",
		destructiveHint: false,
		name: "dynamoi_get_campaign_analytics",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetCampaignAnalyticsInputSchema,
	},
	{
		description:
			"Use this when the user wants artist-level performance across all campaigns, including 30-day rollups or daily breakdowns. Pass granularity=DAILY when the user asks for a daily breakdown. If they also want the strongest campaign, start here for the artist rollup and then use dynamoi_get_campaign_analytics for any campaign-level comparison. Do not use this for one campaign's metrics; use dynamoi_get_campaign_analytics instead.",
		destructiveHint: false,
		name: "dynamoi_get_artist_analytics",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetArtistAnalyticsInputSchema,
	},
	{
		description:
			"Use this when the user asks about billing state, credit balance, promo limits, or whether billing is blocking launches for one artist. Do not use this for campaign analytics or platform connection troubleshooting.",
		destructiveHint: false,
		name: "dynamoi_get_billing",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetBillingInputSchema,
	},
	{
		description:
			"Use this when the user wants to know whether Spotify, Meta, or YouTube are connected and what setup steps still block launches. Do not use this for billing details; use dynamoi_get_billing when the question is about credits or subscription state.",
		destructiveHint: false,
		name: "dynamoi_get_platform_status",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetPlatformStatusInputSchema,
	},
] as const;

export const PHASE_2_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user explicitly wants to pause a running campaign and stop ad delivery. Do not use this for inspection-only questions; this changes external campaign state.",
		destructiveHint: false,
		name: "dynamoi_pause_campaign",
		openWorldHint: true,
		readOnlyHint: false,
		schema: DynamoiPauseCampaignInputSchema,
	},
	{
		description:
			"Use this when the user explicitly wants to resume a paused campaign and restart ad delivery. Do not use this for inspection-only questions; this changes external campaign state.",
		destructiveHint: false,
		name: "dynamoi_resume_campaign",
		openWorldHint: true,
		readOnlyHint: false,
		schema: DynamoiResumeCampaignInputSchema,
	},
	{
		description:
			"Use this when the user explicitly wants to change a campaign budget, and optionally the end date for total-budget campaigns. Do not use this for read-only budget checks; this updates live campaign settings.",
		destructiveHint: false,
		name: "dynamoi_update_budget",
		openWorldHint: true,
		readOnlyHint: false,
		schema: DynamoiUpdateBudgetInputSchema,
	},
] as const;

export const PHASE_3_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user wants to choose from uploaded images or videos that can be reused in a campaign launch. Do not use this when the user only wants campaign status or analytics. Use format=json only when you need asset IDs or URLs for a follow-up launch.",
		destructiveHint: false,
		name: "dynamoi_list_media_assets",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiListMediaAssetsInputSchema,
	},
	{
		description:
			"Use this when the user explicitly wants to launch a new Smart Campaign or YouTube Campaign and has provided the required launch details. Do not use this for recommendations or previews; this creates a real campaign or demo-safe simulated campaign.",
		destructiveHint: false,
		name: "dynamoi_launch_campaign",
		openWorldHint: true,
		readOnlyHint: false,
		schema: DynamoiLaunchCampaignInputSchema,
	},
] as const;
