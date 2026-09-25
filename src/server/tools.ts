import * as z from "zod/v4";
import {
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY as prospectiveFundingConsentCopy,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH as prospectiveFundingConsentCopyHash,
	PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION as prospectiveFundingConsentVersion,
} from "../consent";
import { createPhaseOnboardingToolDefinitions } from "./onboarding-tool-definitions";
import { OPENAI_TOOL_DEFINITIONS } from "./openai-tools";
import {
	AnyOutputEnvelopeSchema,
	GetCampaignOutputEnvelopeSchema,
	GetCampaignReadinessOutputEnvelopeSchema,
	ListAvailableCountriesOutputEnvelopeSchema,
	ManageYoutubeDraftOutputEnvelopeSchema,
	UpdateCampaignOutputEnvelopeSchema,
} from "./output-schemas";
import {
	ClientRequestIdSchema,
	IsoCalendarDateSchema,
	DateRangeSchema as SharedDateRangeSchema,
	ToolFormatSchema as SharedToolFormatSchema,
	UserIntentSummarySchema,
} from "./shared-schemas";

export const DateRangeSchema = SharedDateRangeSchema;
export const ToolFormatSchema = SharedToolFormatSchema;

const OnboardingAttemptIdSchema = z.string().trim().min(1).max(120).optional();
const ExpectedCampaignStatusEnum = z.enum([
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
]);
const ExpectedCampaignStatusSchema = ExpectedCampaignStatusEnum.optional();
const CampaignStatusFilterSchema = ExpectedCampaignStatusEnum.exclude([
	"ENDED",
]).optional();

export const DynamoiListArtistsInputSchema = z
	.object({
		artistId: z.string().uuid().optional(),
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

const DynamoiGetCurrentUserIntentSchema = z.enum([
	"account_overview",
	"artist_access_check",
	"organization_access_check",
	"platform_connection_check",
]);

export const DynamoiGetCurrentUserInputSchema = z
	.object({
		format: ToolFormatSchema.optional(),
		intent: DynamoiGetCurrentUserIntentSchema.default("account_overview"),
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
		status: CampaignStatusFilterSchema,
	})
	.strict();

export const DynamoiGetCampaignInputSchema = z
	.object({
		analyticsDateRange: DateRangeSchema.optional(),
		analyticsGranularity: z.enum(["TOTAL", "DAILY"]).optional(),
		campaignId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		includeAnalytics: z.boolean().optional(),
		includeChannelResults: z.boolean().optional(),
		includeCountries: z.boolean().optional(),
		includeDeploymentStatus: z.boolean().optional(),
	})
	.strict();

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
		onboardingAttemptId: OnboardingAttemptIdSchema,
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
		onboardingAttemptId: OnboardingAttemptIdSchema,
		onboardingFlow: z.enum(["meta", "youtube"]).optional(),
	})
	.strict();

export const DynamoiStartYoutubeChannelLinkInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		purpose: z.enum(["advertising", "distribution_identity"]).optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiStartMetaConnectionInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
		purpose: z.enum(["advertising", "distribution_identity"]).optional(),
		userIntentSummary: UserIntentSummarySchema,
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

// Keep this standalone package's public limit in sync with web-shared's
// MAX_PROMOTED_VIDEOS_PER_CAMPAIGN (10).
const YouTubeEntriesSchema = z
	.array(
		z
			.object({
				playlistId: z.string().trim().min(1).max(128).optional(),
				videoId: z.string().trim().min(1).max(128),
			})
			.strict(),
	)
	.min(1)
	.max(10);

function validateYouTubeEntries(
	data: {
		youtubeEntries?: z.infer<typeof YouTubeEntriesSchema> | undefined;
		youtubeVideoId?: string | undefined;
		youtubePlaylistId?: string | undefined;
		youtubeStrategy?: string | undefined;
	},
	ctx: {
		addIssue: (issue: {
			code: "custom";
			message: string;
			path: (string | number)[];
		}) => void;
	},
) {
	if (data.youtubeEntries && (data.youtubeVideoId || data.youtubePlaylistId)) {
		ctx.addIssue({
			code: "custom",
			message:
				"Use youtubeEntries or youtubeVideoId/youtubePlaylistId, not both",
			path: ["youtubeEntries"],
		});
	}
	if (data.youtubeEntries && data.youtubeStrategy !== "CHEAPEST_VIEWS") {
		data.youtubeEntries.forEach((entry, index) => {
			if (!entry.playlistId) {
				ctx.addIssue({
					code: "custom",
					message:
						"playlistId is required unless youtubeStrategy is CHEAPEST_VIEWS",
					path: ["youtubeEntries", index, "playlistId"],
				});
			}
		});
	}
	if (
		data.youtubeEntries &&
		data.youtubeStrategy === "CHEAPEST_VIEWS" &&
		data.youtubeEntries.length > 1
	) {
		ctx.addIssue({
			code: "custom",
			message: "Maximize Views campaigns support one promoted video.",
			path: ["youtubeEntries"],
		});
	}
}

export const DynamoiGetCampaignReadinessInputSchema = z
	.object({
		adCopy: z.string().trim().max(500).optional(),
		artistId: z.string().uuid(),
		budgetAmount: z.number().finite().positive().optional(),
		budgetType: z.enum(["DAILY", "TOTAL"]).optional(),
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		contentType: z.enum(["TRACK", "ALBUM", "PLAYLIST", "VIDEO"]).optional(),
		endDate: IsoCalendarDateSchema.optional(),
		format: ToolFormatSchema.optional(),
		locationTargets: z.array(LocationTargetSchema).optional(),
		mediaAssetIds: z.array(z.string().uuid()).optional(),
		spotifyUrl: z.string().trim().min(1).max(500).optional(),
		useAiGeneratedCopy: z.boolean().optional(),
		youtubeEntries: YouTubeEntriesSchema.optional(),
		youtubePlaylistId: z.string().trim().min(1).max(128).optional(),
		youtubeStrategy: z
			.enum([
				"CHEAPEST_VIEWS",
				"ORGANIC_VIEWS",
				"SUBSCRIBERS",
				"ORGANIC_VIEWS_AND_SUBSCRIBERS",
				"ADSENSE_ROI",
			])
			.optional(),
		youtubeVideoId: z.string().trim().min(1).max(128).optional(),
	})
	.strict()
	.superRefine(validateYouTubeEntries);

export const DynamoiManageYoutubeDraftInputSchema = z
	.object({
		action: z.enum(["inspect", "discard"]),
		artistId: z.string().uuid(),
		campaignId: z.string().uuid().optional(),
		expectedUpdatedAt: z.string().datetime().optional(),
		userIntentSummary: UserIntentSummarySchema.optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (data.action === "discard" && !data.campaignId) {
			ctx.addIssue({
				code: "custom",
				message: "campaignId is required to discard a draft",
				path: ["campaignId"],
			});
		}
		if (data.action === "discard" && !data.expectedUpdatedAt) {
			ctx.addIssue({
				code: "custom",
				message: "expectedUpdatedAt is required to discard a draft",
				path: ["expectedUpdatedAt"],
			});
		}
		if (data.action === "discard" && !data.userIntentSummary) {
			ctx.addIssue({
				code: "custom",
				message: "userIntentSummary is required to discard a draft",
				path: ["userIntentSummary"],
			});
		}
	});

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
		acceptedConsentCopyHash: z
			.literal(prospectiveFundingConsentCopyHash)
			.optional(),
		acceptedConsentVersion: z
			.literal(prospectiveFundingConsentVersion)
			.optional(),
		authorizeAutomaticDailyFunding: z.literal(true).optional(),
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		expectedCurrentStatus: ExpectedCampaignStatusSchema,
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.authorizeAutomaticDailyFunding &&
			!(
				data.acceptedConsentCopyHash &&
				data.acceptedConsentVersion &&
				data.clientRequestId
			)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"acceptedConsentCopyHash, acceptedConsentVersion, and clientRequestId are required with automatic daily funding authorization",
				path: ["authorizeAutomaticDailyFunding"],
			});
		}
	});

export const DynamoiUpdateBudgetInputSchema = z
	.object({
		acceptedConsentCopyHash: z
			.literal(prospectiveFundingConsentCopyHash)
			.optional(),
		acceptedConsentVersion: z
			.literal(prospectiveFundingConsentVersion)
			.optional(),
		authorizeAutomaticDailyFunding: z
			.literal(true)
			.describe(
				`Set only after the client explicitly accepts: “${prospectiveFundingConsentCopy}”`,
			)
			.optional(),
		budgetAmount: z.number().finite().positive(),
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		endDate: IsoCalendarDateSchema.optional(),
		expectedCurrentBudgetAmount: z.number().finite().positive().optional(),
		expectedCurrentEndDate: IsoCalendarDateSchema.optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.authorizeAutomaticDailyFunding &&
			!(
				data.acceptedConsentCopyHash &&
				data.acceptedConsentVersion &&
				data.clientRequestId
			)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"acceptedConsentCopyHash, acceptedConsentVersion, and clientRequestId are required with automatic daily funding authorization",
				path: ["authorizeAutomaticDailyFunding"],
			});
		}
	});

export const DynamoiUpdateCampaignInputSchema = z
	.object({
		acceptedConsentCopyHash: z
			.literal(prospectiveFundingConsentCopyHash)
			.optional(),
		acceptedConsentVersion: z
			.literal(prospectiveFundingConsentVersion)
			.optional(),
		action: z.enum([
			"pause",
			"resume",
			"update_budget",
			"change_strategy",
			"update_location",
			"update_end_date",
			"archive",
			"update_goals",
		]),
		authorizeAutomaticDailyFunding: z
			.literal(true)
			.describe(
				`Set only after the client explicitly accepts: “${prospectiveFundingConsentCopy}”`,
			)
			.optional(),
		budgetAmount: z.number().finite().positive().optional(),
		campaignId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		endDate: IsoCalendarDateSchema.optional(),
		expectedCurrentBudgetAmount: z.number().finite().positive().optional(),
		expectedCurrentEndDate: IsoCalendarDateSchema.optional(),
		expectedCurrentStatus: ExpectedCampaignStatusSchema,
		locationTargets: z
			.union([
				z.object({ mode: z.literal("GLOBAL") }).strict(),
				z
					.object({
						countries: z.array(z.string().length(2)).min(1),
						mode: z.literal("COUNTRIES"),
					})
					.strict(),
			])
			.optional(),
		monetizationQualificationMode: z
			.enum(["STANDARD", "MONETIZATION_QUALIFICATION"])
			.optional(),
		optimizeForOrganicViews: z.boolean().optional(),
		optimizeForSubscribers: z.boolean().optional(),
		strategy: z
			.enum([
				"CHEAPEST_VIEWS",
				"ORGANIC_VIEWS",
				"SUBSCRIBERS",
				"ORGANIC_VIEWS_AND_SUBSCRIBERS",
				"ADSENSE_ROI",
			])
			.optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			[
				"change_strategy",
				"update_location",
				"update_end_date",
				"archive",
				"update_goals",
			].includes(data.action) &&
			!data.clientRequestId
		) {
			ctx.addIssue({
				code: "custom",
				message: "clientRequestId is required for this action",
				path: ["clientRequestId"],
			});
		}
		if (data.action === "update_budget" && data.budgetAmount === undefined) {
			ctx.addIssue({
				code: "custom",
				message: "budgetAmount is required when action is update_budget",
				path: ["budgetAmount"],
			});
		}
		if (data.action === "update_end_date" && data.endDate === undefined) {
			ctx.addIssue({
				code: "custom",
				message: "endDate is required",
				path: ["endDate"],
			});
		}
		if (data.action === "change_strategy" && data.strategy === undefined) {
			ctx.addIssue({
				code: "custom",
				message: "strategy is required",
				path: ["strategy"],
			});
		}
		if (
			data.action === "update_location" &&
			data.locationTargets === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "locationTargets is required",
				path: ["locationTargets"],
			});
		}
		if (
			data.action === "update_goals" &&
			data.optimizeForOrganicViews === undefined &&
			data.optimizeForSubscribers === undefined &&
			data.monetizationQualificationMode === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"At least one goal or monetizationQualificationMode is required",
				path: ["action"],
			});
		}
		if (data.action !== "update_budget" && data.action !== "update_end_date") {
			for (const field of [
				"budgetAmount",
				"endDate",
				"expectedCurrentBudgetAmount",
				"expectedCurrentEndDate",
			] as const) {
				if (data[field] !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: `${field} is only valid when action is update_budget`,
						path: [field],
					});
				}
			}
		}
		if (
			data.action === "update_end_date" &&
			data.expectedCurrentBudgetAmount !== undefined
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"expectedCurrentBudgetAmount is not valid for an end-date-only edit",
				path: ["expectedCurrentBudgetAmount"],
			});
		}
		for (const [field, action] of [
			["strategy", "change_strategy"],
			["locationTargets", "update_location"],
			["optimizeForOrganicViews", "update_goals"],
			["optimizeForSubscribers", "update_goals"],
			["monetizationQualificationMode", "update_goals"],
		] as const) {
			if (data[field] !== undefined && data.action !== action) {
				ctx.addIssue({
					code: "custom",
					message: `${field} is only valid when action is ${action}`,
					path: [field],
				});
			}
		}
		if (data.action === "update_end_date" && data.budgetAmount !== undefined) {
			ctx.addIssue({
				code: "custom",
				message: "budgetAmount is not valid for an end-date-only edit",
				path: ["budgetAmount"],
			});
		}
		if (
			data.action !== "update_budget" &&
			data.action !== "update_end_date" &&
			data.action !== "resume"
		) {
			for (const field of [
				"acceptedConsentCopyHash",
				"acceptedConsentVersion",
				"authorizeAutomaticDailyFunding",
			] as const) {
				if (data[field] !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: `${field} is only valid when action is update_budget or resume`,
						path: [field],
					});
				}
			}
		}
		if (
			data.authorizeAutomaticDailyFunding &&
			!(
				data.acceptedConsentCopyHash &&
				data.acceptedConsentVersion &&
				data.clientRequestId
			)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"acceptedConsentCopyHash, acceptedConsentVersion, and clientRequestId are required with automatic daily funding authorization",
				path: ["authorizeAutomaticDailyFunding"],
			});
		}
	});

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
		acceptedConsentCopyHash: z
			.literal(prospectiveFundingConsentCopyHash)
			.optional(),
		acceptedConsentVersion: z
			.literal(prospectiveFundingConsentVersion)
			.optional(),
		// Creative
		adCopy: z.string().trim().max(500).optional(),
		appleMusicUrl: z.string().trim().min(1).max(500).optional(),
		artistId: z.string().uuid(),
		authorizeAutomaticDailyFunding: z
			.literal(true)
			.describe(
				`Required for DAILY budgets. Set only after the client explicitly accepts: “${prospectiveFundingConsentCopy}”`,
			)
			.optional(),

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
		endDate: IsoCalendarDateSchema.optional(),

		// Targeting
		locationTargets: z.array(LocationTargetSchema).optional(),

		// Smart Campaign creative selection (existing assets only in Phase 3)
		mediaAssetIds: z.array(z.string().uuid()).optional(),
		spotifyUrl: z.string().trim().min(1).max(500).optional(),
		useAiGeneratedCopy: z.boolean().optional(),
		userIntentSummary: UserIntentSummarySchema,
		youtubeEntries: YouTubeEntriesSchema.optional(),
		// YouTube content (same choices as the app's YouTube campaign setup)
		youtubePlaylistId: z.string().trim().min(1).max(128).optional(),
		youtubeStrategy: z
			.enum([
				"CHEAPEST_VIEWS",
				"ORGANIC_VIEWS",
				"SUBSCRIBERS",
				"ORGANIC_VIEWS_AND_SUBSCRIBERS",
				"ADSENSE_ROI",
			])
			.optional(),
		youtubeVideoId: z.string().trim().min(1).max(128).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.budgetType === "DAILY" &&
			!(
				data.authorizeAutomaticDailyFunding &&
				data.acceptedConsentCopyHash &&
				data.acceptedConsentVersion
			)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"DAILY budgets require authorizeAutomaticDailyFunding with acceptedConsentCopyHash and acceptedConsentVersion",
				path: ["authorizeAutomaticDailyFunding"],
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
			validateYouTubeEntries(data, ctx);
			if (!(data.youtubeVideoId || data.youtubeEntries)) {
				ctx.addIssue({
					code: "custom",
					message: "youtubeVideoId is required for YOUTUBE",
					path: ["youtubeVideoId"],
				});
			}
			if (!data.youtubeStrategy) {
				ctx.addIssue({
					code: "custom",
					message: "youtubeStrategy is required for YOUTUBE",
					path: ["youtubeStrategy"],
				});
			}
			if (
				data.youtubeStrategy &&
				data.youtubeStrategy !== "CHEAPEST_VIEWS" &&
				!data.youtubePlaylistId &&
				!data.youtubeEntries
			) {
				ctx.addIssue({
					code: "custom",
					message:
						"youtubePlaylistId is required for YOUTUBE unless youtubeStrategy is CHEAPEST_VIEWS",
					path: ["youtubePlaylistId"],
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
			"Use this when the user explicitly asks about the signed-in Dynamoi account itself, such as who is logged in, how many organizations or artists it can access, or whether account-level platform connections exist. Pass intent to match that explicit account question; it defaults to account_overview. Do not use this to confirm a specific Meta or YouTube onboarding attempt because this account-level state can span multiple artists; use dynamoi_get_platform_status for the target artist instead. Do not use this to enumerate artists one by one; use dynamoi_list_artists for that. Never use this to 'check context' before answering generic Instagram, lyrics, songwriting, or marketing-advice questions, even if Dynamoi is attached.",
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
			"Use this when the user wants to see which artists or YouTube channels they manage, along with billing status, active campaign count, and their role. Pass artistId when you need the full profile/readiness details for one artist instead of a roster page. Do not use this for campaign details; use dynamoi_list_campaigns or dynamoi_get_campaign. Never use this for generic social-media or marketing advice, including Instagram follower-growth questions, unless the user explicitly asked about their Dynamoi roster. If the result is empty, the user is brand-new — do not stop with 'no records found'; route through dynamoi_get_account_overview.recommendedNextActions.",
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
			"Use this when the user mentions an artist, release, campaign, or smart link but you do not yet know the exact record to inspect. Do not use this for analytics summaries or billing questions once you already know the target record. If the result is empty for a brand-new user (no artists yet), do not respond 'no records found' as a terminal answer — instead suggest creating their first artist hub via dynamoi_create_smart_links_from_spotify_artist.",
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
			"Use this when the user wants full details for one campaign, including budget, targeting, platform status, and next actions. Set includeAnalytics=true for paid delivery, includeChannelResults=true for observed YouTube organic channel results (never attributed to the campaign), includeDeploymentStatus=true for delivery/deployment blockers, and includeCountries=true only when the full country list is needed. Do not use this for a campaign list; use dynamoi_list_campaigns instead. After a successful launch or campaign mutation, prefer format=summary when you need a follow-up read to relay the final answer.",
		destructiveHint: false,
		name: "dynamoi_get_campaign",
		openWorldHint: false,
		outputSchema: GetCampaignOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignInputSchema,
		title: "Get Campaign",
	},
	{
		description:
			"Use this when the user wants artist-level performance across all campaigns, including 30-day rollups or daily breakdowns. Pass granularity=DAILY when the user asks for a daily breakdown. Pass format=summary when the user wants a written rollup, a strongest-campaign verdict, or a direct answer you can relay immediately. If this tool already returned the requested strongest-campaign comparison, stop and answer instead of calling more analytics tools. For one campaign's metrics, use dynamoi_get_campaign with includeAnalytics=true.",
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
			"Use this when the user asks about billing state, credit balance, promo limits, subscription status, or whether billing blocks launches for one artist. This is a read-only status check; it does not create checkout links or collect payment. If billing blocks a launch, starting or restoring managed advertising is not available through this MCP surface; tell the user: 'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.' Then call this tool again to confirm the status. Do not use this for campaign analytics or platform connection troubleshooting.",
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
			"Use this when the user wants to know whether Spotify, Meta, or YouTube are connected and what setup steps still block launches. When polling after a connection-start flow, pass the returned onboardingAttemptId and onboardingFlow so Dynamoi ops can correlate the browser step. Do not use this for detailed billing questions. Never use this to personalize generic Instagram or marketing-advice questions.",
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
			"Use this when the user is planning a campaign and wants to know if the proposed inputs are ready before dynamoi_launch_campaign. This validates readiness and targeting without creating a campaign. Do not use this to create or mutate campaigns.",
		destructiveHint: false,
		name: "dynamoi_get_campaign_readiness",
		openWorldHint: false,
		outputSchema: GetCampaignReadinessOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetCampaignReadinessInputSchema,
		title: "Get Campaign Readiness",
	},
] as const;

export const PHASE_ONBOARDING_TOOL_DEFINITIONS =
	createPhaseOnboardingToolDefinitions({
		metaConnection: DynamoiStartMetaConnectionInputSchema,
		youtubeChannelLink: DynamoiStartYoutubeChannelLinkInputSchema,
	});

export const PHASE_2_TOOL_DEFINITIONS = [
	{
		description:
			"Inspect an artist's open YouTube draft with action=inspect after an interrupted launch. Returns completed steps, screening, failure stage, and updatedAt. Use action=discard only when the user explicitly asks to discard that draft, supplying its campaignId, expectedUpdatedAt from inspect, and userIntentSummary. Discard cannot be undone.",
		destructiveHint: true,
		name: "dynamoi_manage_youtube_draft",
		openWorldHint: false,
		outputSchema: ManageYoutubeDraftOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiManageYoutubeDraftInputSchema,
		title: "Manage YouTube Draft",
	},
	{
		description: `Use only when the user explicitly requests a campaign change. Actions: pause, resume, update_budget, update_end_date (DAILY or TOTAL budget; TOTAL end-date extensions may require the same funding consent fields as update_budget or resume), update_location (GLOBAL or catalog-valid countries), change_strategy (managed YouTube Demand Gen), update_goals (YouTube optimization toggles and monetization qualification mode), archive (never deletes). Inspect the campaign first and supply expectedCurrentStatus where possible. For resume, update_budget, or a TOTAL update_end_date that needs automatic daily card funding, first show the user this exact consent copy: "${prospectiveFundingConsentCopy}" — then pass authorizeAutomaticDailyFunding=true with the exact acceptedConsentVersion ("${prospectiveFundingConsentVersion}") and acceptedConsentCopyHash ("${prospectiveFundingConsentCopyHash}") plus the request's clientRequestId. Without them, a resume that needs card funding is refused with: "Review and accept the daily funding authorization to resume this campaign." When retrying the same action, reuse the same clientRequestId.`,
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_update_campaign",
		openWorldHint: true,
		outputSchema: UpdateCampaignOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateCampaignInputSchema,
		title: "Update Campaign",
	},
] as const;
