import * as z from "zod/v4";
import {
	AnyOutputEnvelopeSchema,
	GetCampaignDeploymentStatusOutputEnvelopeSchema,
	GetCampaignReadinessOutputEnvelopeSchema,
	GetOnboardingStatusOutputEnvelopeSchema,
	ListAvailableCountriesOutputEnvelopeSchema,
	PauseResumeOutputEnvelopeSchema,
	UpdateBudgetOutputEnvelopeSchema,
} from "./output-schemas";

export const ToolFormatSchema = z.enum(["json", "summary"]);
const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const UserIntentSummarySchema = z.string().trim().max(500).optional();
const ClientRequestIdSchema = z.string().uuid().optional();
const ExpectedCampaignStatusSchema = z
	.enum([
		"AWAITING_SMART_LINK",
		"ACTIVE",
		"ARCHIVED",
		"CONTENT_VALIDATION",
		"DEPLOYING",
		"ENDED",
		"FAILED",
		"PAUSED",
		"READY_FOR_REVIEW",
		"SUBSCRIPTION_PAUSED",
	])
	.optional();

function isValidCalendarDate(value: string): boolean {
	const date = new Date(`${value}T00:00:00.000Z`);
	return (
		Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
	);
}

export const DynamoiListArtistsInputSchema = z
	.object({
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		limit: z.number().int().min(1).max(50).optional(),
	})
	.strict();

export const DynamoiSearchInputSchema = z
	.object({
		artistId: z.string().uuid().optional(),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		includeArchived: z.boolean().optional(),
		limit: z.number().int().min(1).max(50).optional(),
		query: z.string().trim().max(120).optional(),
		type: z.enum(["artist", "campaign", "smartlink"]).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (!(data.type || data.query)) {
			ctx.addIssue({
				code: "custom",
				message: "query is required when type is not specified",
				path: ["query"],
			});
		}
	});

import { OPENAI_TOOL_DEFINITIONS } from "./openai-tools";

const DynamoiGetCurrentUserIntentSchema = z.enum([
	"account_overview",
	"artist_access_check",
	"organization_access_check",
	"platform_connection_check",
]);

export const DynamoiGetCurrentUserInputSchema = z
	.object({
		format: ToolFormatSchema.optional(),
		intent: DynamoiGetCurrentUserIntentSchema,
	})
	.strict();

export const DynamoiGetArtistInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

export const DynamoiListCampaignsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]).optional(),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		limit: z.number().int().min(1).max(50).optional(),
		status: z.string().trim().optional(),
	})
	.strict();

export const DynamoiGetCampaignInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		includeCountries: z.boolean().optional(),
	})
	.strict();

export const DateRangeSchema = z
	.object({
		end: IsoDateSchema,
		start: IsoDateSchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (!isValidCalendarDate(data.start)) {
			ctx.addIssue({
				code: "custom",
				message: "start must be a valid calendar date",
				path: ["start"],
			});
		}
		if (!isValidCalendarDate(data.end)) {
			ctx.addIssue({
				code: "custom",
				message: "end must be a valid calendar date",
				path: ["end"],
			});
		}
		if (
			isValidCalendarDate(data.start) &&
			isValidCalendarDate(data.end) &&
			data.start > data.end
		) {
			ctx.addIssue({
				code: "custom",
				message: "start must be on or before end",
				path: ["start"],
			});
		}
	});

export const DynamoiGetCampaignAnalyticsInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		dateRange: DateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
	})
	.strict();

export const DynamoiGetArtistAnalyticsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		dateRange: DateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
	})
	.strict();

export const DynamoiGetBillingInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

const LocationTargetSchema = z
	.object({
		code: z.string().trim().min(1).max(8),
		name: z.string().trim().min(1).max(120),
	})
	.strict();

export const DynamoiGetPlatformStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

export const DynamoiListAvailableCountriesInputSchema = z
	.object({
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		limit: z.number().int().min(1).max(100).optional(),
		query: z.string().trim().max(120).optional(),
	})
	.strict();

export const DynamoiGetOnboardingStatusInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

export const DynamoiGetCampaignReadinessInputSchema = z
	.object({
		artistId: z.string().uuid(),
		budgetAmount: z.number().finite().positive().optional(),
		budgetType: z.enum(["DAILY", "TOTAL"]).optional(),
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		contentType: z.enum(["TRACK", "ALBUM", "PLAYLIST", "VIDEO"]).optional(),
		endDate: IsoDateSchema.optional(),
		format: ToolFormatSchema.optional(),
		locationTargets: z.array(LocationTargetSchema).optional(),
		mediaAssetIds: z.array(z.string().uuid()).optional(),
		spotifyUrl: z.string().trim().min(1).max(500).optional(),
		youtubeVideoId: z.string().trim().min(1).max(128).optional(),
	})
	.strict();

export const DynamoiGetCampaignDeploymentStatusInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

export const DynamoiPauseCampaignInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		expectedCurrentStatus: ExpectedCampaignStatusSchema,
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiResumeCampaignInputSchema = z
	.object({
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		expectedCurrentStatus: ExpectedCampaignStatusSchema,
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiUpdateBudgetInputSchema = z
	.object({
		budgetAmount: z.number().finite().positive(),
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		endDate: IsoDateSchema.optional(),
		expectedCurrentBudgetAmount: z.number().finite().positive().optional(),
		expectedCurrentEndDate: IsoDateSchema.optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiListMediaAssetsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		includeUrls: z.boolean().optional(),
		limit: z.number().int().min(1).max(50).optional(),
	})
	.strict();

export const DynamoiLaunchCampaignInputSchema = z
	.object({
		// Creative
		adCopy: z.string().trim().max(500).optional(),
		appleMusicUrl: z.string().trim().min(1).max(500).optional(),
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
		contentTitle: z.string().trim().min(1).max(160),
		contentType: z.enum(["TRACK", "ALBUM", "PLAYLIST", "VIDEO"]),
		endDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional(),

		// Targeting
		locationTargets: z.array(LocationTargetSchema).optional(),

		// Smart Campaign creative selection (existing assets only in Phase 3)
		mediaAssetIds: z.array(z.string().uuid()).optional(),
		spotifyUrl: z.string().trim().min(1).max(500).optional(),
		useAiGeneratedCopy: z.boolean().optional(),
		userIntentSummary: UserIntentSummarySchema,
		youtubeVideoId: z.string().trim().min(1).max(128).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
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
			"Use this when the user explicitly asks about the signed-in Dynamoi account itself, such as who is logged in, how many organizations or artists it can access, or whether account-level platform connections exist. Always pass intent to match that explicit account question. Do not use this to enumerate artists one by one; use dynamoi_list_artists for that. Never use this to 'check context' before answering generic Instagram, lyrics, songwriting, or marketing-advice questions, even if Dynamoi is attached.",
		destructiveHint: false,
		name: "dynamoi_get_account_overview",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCurrentUserInputSchema,
		title: "Get Account Overview",
	},
	{
		description:
			"Use this when the user wants to see which artists or YouTube channels they manage, along with billing status, active campaign count, and their role. Do not use this for campaign details; use dynamoi_list_campaigns or dynamoi_get_campaign. Never use this for generic social-media or marketing advice, including Instagram follower-growth questions, unless the user explicitly asked about their Dynamoi roster. If the result is empty, the user is brand-new — do not stop with 'no records found'; instead route via dynamoi_get_account_overview.recommendedNextActions or read dynamoi://playbooks/onboarding-tree.",
		destructiveHint: false,
		name: "dynamoi_list_artists",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListArtistsInputSchema,
		title: "List Artists",
	},
	{
		description:
			"Use this when the user mentions an artist, release, campaign, or smart link but you do not yet know the exact record to inspect. Do not use this for analytics summaries or billing questions once you already know the target record. If the result is empty for a brand-new user (no artists yet), do not respond 'no records found' as a terminal answer — instead suggest creating their first artist hub via dynamoi_create_smart_links_from_spotify_artist or read dynamoi://playbooks/onboarding-tree.",
		destructiveHint: false,
		name: "dynamoi_search",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiSearchInputSchema,
		title: "Search Dynamoi",
	},
	...OPENAI_TOOL_DEFINITIONS,
	{
		description:
			"Use this when the user wants the profile and launch readiness for one specific artist or YouTube channel, including connected platforms and billing state. Do not use this to list every artist; use dynamoi_list_artists first. Never use this for generic advice questions that do not require account-specific data, including Instagram growth, songwriting, or lyrics prompts.",
		destructiveHint: false,
		name: "dynamoi_get_artist",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetArtistInputSchema,
		title: "Get Artist",
	},
	{
		description:
			"Use this when the user wants to browse campaigns for one artist, optionally filtered by type or status. Do not use this for a single campaign deep dive; use dynamoi_get_campaign for that. Never use this to personalize generic marketing advice. If the user has no artists yet, do not call this — route via dynamoi_get_account_overview first.",
		destructiveHint: false,
		name: "dynamoi_list_campaigns",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListCampaignsInputSchema,
		title: "List Campaigns",
	},
	{
		description:
			"Use this when the user wants full details for one campaign, including budget, targeting, platform status, and next actions. Do not use this for a campaign list; use dynamoi_list_campaigns instead. Pass includeCountries=true only when the full country list is needed. After a successful launch or budget/status mutation, prefer format=summary when you need a follow-up read to relay the final answer.",
		destructiveHint: false,
		name: "dynamoi_get_campaign",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignInputSchema,
		title: "Get Campaign",
	},
	{
		description:
			"Use this when the user asks how one campaign is performing across impressions, clicks, spend, CPC, CPM, or CTR. Pass granularity=DAILY when the user asks for a daily breakdown. Use this for a deeper audit of one campaign after you already know which campaign to inspect. Do not use this for artist-wide performance across multiple campaigns; use dynamoi_get_artist_analytics instead.",
		destructiveHint: false,
		name: "dynamoi_get_campaign_analytics",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignAnalyticsInputSchema,
		title: "Get Campaign Analytics",
	},
	{
		description:
			"Use this when the user wants artist-level performance across all campaigns, including 30-day rollups or daily breakdowns. Pass granularity=DAILY when the user asks for a daily breakdown. Pass format=summary when the user wants a written rollup, a strongest-campaign verdict, or a direct answer you can relay immediately. If this tool already returned the requested strongest-campaign comparison, stop and answer instead of calling more analytics tools. Do not use this for one campaign's metrics; use dynamoi_get_campaign_analytics instead.",
		destructiveHint: false,
		name: "dynamoi_get_artist_analytics",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetArtistAnalyticsInputSchema,
		title: "Get Artist Analytics",
	},
	{
		description:
			"Use this when the user asks about billing state, credit balance, promo limits, or whether billing is blocking launches for one artist. Do not use this for campaign analytics or platform connection troubleshooting.",
		destructiveHint: false,
		name: "dynamoi_get_billing",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetBillingInputSchema,
		title: "Get Billing",
	},
	{
		description:
			"Use this when the user wants to know whether Spotify, Meta, or YouTube are connected and what setup steps still block launches. Do not use this for billing details; use dynamoi_get_billing when the question is about credits or subscription state. Never use this to personalize generic Instagram or marketing-advice questions.",
		destructiveHint: false,
		name: "dynamoi_get_platform_status",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetPlatformStatusInputSchema,
		title: "Get Platform Status",
	},
	{
		description:
			"Use this when the user asks which countries they can target for a Smart Campaign or YouTube campaign. Always pass campaignType because Smart Campaign and YouTube country catalogs are different. Do not use this for generic country marketing advice.",
		destructiveHint: false,
		name: "dynamoi_list_available_countries",
		openWorldHint: false,
		outputSchema: ListAvailableCountriesOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListAvailableCountriesInputSchema,
		title: "List Available Countries",
	},
	{
		description:
			"Use this when the user asks whether one artist is ready to create Smart Campaigns or YouTube campaigns, or what setup steps are still missing. This is artist-level readiness, not a campaign launch. Do not use this for generic marketing advice.",
		destructiveHint: false,
		name: "dynamoi_get_onboarding_status",
		openWorldHint: false,
		outputSchema: GetOnboardingStatusOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetOnboardingStatusInputSchema,
		title: "Get Onboarding Status",
	},
	{
		description:
			"Use this when the user is planning a campaign and wants to know if the proposed inputs are ready before dynamoi_launch_campaign. This validates readiness and targeting without creating a campaign. Do not use this to create or mutate campaigns.",
		destructiveHint: false,
		name: "dynamoi_get_campaign_readiness",
		openWorldHint: false,
		outputSchema: GetCampaignReadinessOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignReadinessInputSchema,
		title: "Get Campaign Readiness",
	},
	{
		description:
			"Use this when the user asks why an existing campaign is not live, where deployment stands, or what is blocking delivery. This reads local Dynamoi deployment state only. Do not use this for new campaign planning.",
		destructiveHint: false,
		name: "dynamoi_get_campaign_deployment_status",
		openWorldHint: false,
		outputSchema: GetCampaignDeploymentStatusOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignDeploymentStatusInputSchema,
		title: "Get Campaign Deployment Status",
	},
] as const;

export const PHASE_2_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user explicitly wants to pause a running campaign and stop ad delivery. Do not use this for inspection-only questions; this changes external campaign state.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_pause_campaign",
		openWorldHint: true,
		outputSchema: PauseResumeOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiPauseCampaignInputSchema,
		title: "Pause Campaign",
	},
	{
		description:
			"Use this when the user explicitly wants to resume a paused campaign and restart ad delivery. Do not use this for inspection-only questions; this changes external campaign state.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_resume_campaign",
		openWorldHint: true,
		outputSchema: PauseResumeOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiResumeCampaignInputSchema,
		title: "Resume Campaign",
	},
	{
		description:
			"Use this when the user explicitly wants to change a campaign budget, and optionally the end date for total-budget campaigns. Do not use this for read-only budget checks; this updates live campaign settings.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_update_budget",
		openWorldHint: true,
		outputSchema: UpdateBudgetOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateBudgetInputSchema,
		title: "Update Campaign Budget",
	},
] as const;
