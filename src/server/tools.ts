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
			"Get the currently authenticated Dynamoi account context — user ID, email, and accessible organizations/artists with resolved roles.",
		destructiveHint: false,
		name: "dynamoi_get_current_user",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetCurrentUserInputSchema,
	},
	{
		description:
			"List all music artists and YouTube channels the user manages. Returns each artist's subscription tier, billing status, active campaign count, and the user's role.",
		destructiveHint: false,
		name: "dynamoi_list_artists",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiListArtistsInputSchema,
	},
	{
		description:
			"Search across artists, ad campaigns, and smart links by name or URL. Find a specific Spotify release, YouTube campaign, or artist profile.",
		destructiveHint: false,
		name: "dynamoi_search",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiSearchInputSchema,
	},
	{
		description:
			"Get a music artist or YouTube channel profile — connected platforms (Spotify, Meta, YouTube), subscription tier, billing status, and whether they're ready to launch campaigns.",
		destructiveHint: false,
		name: "dynamoi_get_artist",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetArtistInputSchema,
	},
	{
		description:
			"List ad campaigns for an artist — each campaign's content title, type (Smart Campaign for Spotify or YouTube for channel growth), budget, status, and platforms. Supports status filtering and pagination.",
		destructiveHint: false,
		name: "dynamoi_list_campaigns",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiListCampaignsInputSchema,
	},
	{
		description:
			"Get full details for a campaign — budget, targeting countries, per-platform status for Meta and Google, smart link URL, and any blocked reasons with suggested next actions.",
		destructiveHint: false,
		name: "dynamoi_get_campaign",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetCampaignInputSchema,
	},
	{
		description:
			"Get performance analytics for a campaign — impressions, clicks, ad spend, CPC, CPM, and CTR. Optionally filter by date range. Returns per-platform breakdowns for Meta Ads and Google Ads.",
		destructiveHint: false,
		name: "dynamoi_get_campaign_analytics",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetCampaignAnalyticsInputSchema,
	},
	{
		description:
			"Get an artist's billing summary — subscription tier, ad credit balance, billing status, and recent spend. Shows remaining credits and campaign usage for the current period.",
		destructiveHint: false,
		name: "dynamoi_get_billing",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiGetBillingInputSchema,
	},
	{
		description:
			"Check connection health for Spotify, Meta (Facebook/Instagram), and YouTube. Shows connection status, token expiry, and what steps remain before campaigns can launch on each platform.",
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
			"Pause a running campaign, stopping ad delivery on Meta (Facebook/Instagram) and/or Google (YouTube). Returns per-platform results.",
		destructiveHint: false,
		name: "dynamoi_pause_campaign",
		openWorldHint: true,
		readOnlyHint: false,
		schema: DynamoiPauseCampaignInputSchema,
	},
	{
		description:
			"Resume a paused campaign, restarting ad delivery on Meta and/or Google. Returns per-platform results.",
		destructiveHint: false,
		name: "dynamoi_resume_campaign",
		openWorldHint: true,
		readOnlyHint: false,
		schema: DynamoiResumeCampaignInputSchema,
	},
	{
		description:
			"Change a campaign's daily or total budget amount in USD. For total-budget campaigns, the end date can also be updated. Cannot switch between daily and total budget types.",
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
			"List an artist's uploaded creative assets (images and videos) available for campaign launches. Use this to select media before launching a Smart Campaign.",
		destructiveHint: false,
		name: "dynamoi_list_media_assets",
		openWorldHint: false,
		readOnlyHint: true,
		schema: DynamoiListMediaAssetsInputSchema,
	},
	{
		description:
			"Launch a new campaign to promote a Spotify release (track, album, or playlist via Meta Ads) or grow a YouTube channel (via Google Ads with AdSense revenue optimization). Provide a client-generated request ID for safe retries.",
		destructiveHint: false,
		name: "dynamoi_launch_campaign",
		openWorldHint: true,
		readOnlyHint: false,
		schema: DynamoiLaunchCampaignInputSchema,
	},
] as const;
