import * as z from "zod/v4";

const MoneyDisplayOutputSchema = z
	.object({
		amountUsd: z.number(),
		formatted: z.string(),
	})
	.strict();

const ErrorEnvelopeOutputSchema = z
	.object({
		kind: z.enum(["validation", "business", "platform", "unknown"]).optional(),
		message: z.string(),
		status: z.literal("error"),
	})
	.strict();

const AnyToolDataOutputSchema = z.object({}).passthrough();

const MediaAssetSummaryOutputSchema = z
	.object({
		aspectRatio: z.string().optional(),
		createdAt: z.string(),
		fileName: z.string().optional(),
		fileType: z.string(),
		height: z.number().optional(),
		id: z.string(),
		url: z.string().optional(),
		urlExpiresAt: z.string().optional(),
		width: z.number().optional(),
	})
	.strict();

const ListMediaAssetsDataOutputSchema = z
	.object({
		assets: z.array(MediaAssetSummaryOutputSchema),
		nextCursor: z.string().optional(),
	})
	.strict();

const ListMediaAssetsSummaryOutputSchema = z
	.object({
		nextCursor: z.string().optional(),
		summary: z.string(),
		totalCount: z.number(),
	})
	.strict();

const SmartLinkStatusSchemas = {
	claimStatus: z.enum([
		"auto_approved",
		"pending_ops_review",
		"approved_by_ops",
		"rejected",
	]),
	odesliStatus: z.enum(["pending", "resolved", "failed"]),
	publishState: z.enum(["published", "unpublished"]),
	renderState: z.enum(["queued", "rendering", "rendered", "failed"]),
	takedownStatus: z.enum(["none", "active", "resolved"]),
	theme: z.enum(["classic", "brutalist", "aurora", "cinematic"]),
};

const SmartLinkSummaryOutputSchema = z
	.object({
		artistHubUrl: z.string(),
		artistId: z.string(),
		artistName: z.string(),
		claimStatus: SmartLinkStatusSchemas.claimStatus,
		createdAt: z.string(),
		id: z.string(),
		isPublic: z.boolean(),
		localizedPublicUrls: z.array(z.string()).optional(),
		odesliStatus: SmartLinkStatusSchemas.odesliStatus,
		publicUrl: z.string(),
		publishState: SmartLinkStatusSchemas.publishState,
		releaseSlug: z.string(),
		releaseTitle: z.string(),
		releaseType: z.string(),
		renderState: SmartLinkStatusSchemas.renderState,
		spotifyUrl: z.string().nullable(),
		takedownStatus: SmartLinkStatusSchemas.takedownStatus,
		theme: SmartLinkStatusSchemas.theme,
		updatedAt: z.string(),
	})
	.strict();

const SmartLinkDetailsOutputSchema = SmartLinkSummaryOutputSchema.extend({
	actionRequired: z.array(z.string()).optional(),
	customDescription: z.string().nullable(),
	nextActions: z.array(z.string()),
	originalSpotifyUrl: z.string().nullable(),
	resourceUri: z.string(),
	settingsResourceUri: z.string(),
	spotifyDiscographyId: z.string(),
	summary: z.string(),
	warnings: z.array(z.string()).optional(),
}).strict();

const ListSmartLinksDataOutputSchema = z
	.object({
		nextCursor: z.string().optional(),
		smartLinks: z.array(SmartLinkSummaryOutputSchema),
	})
	.strict();

const ListSmartLinksSummaryOutputSchema = z
	.object({
		nextCursor: z.string().optional(),
		summary: z.string(),
		totalCount: z.number(),
	})
	.strict();

const AvailableCountryOutputSchema = z
	.object({
		code: z.string(),
		dominantLanguage: z.string().optional(),
		googleAdsId: z.number(),
		name: z.string(),
	})
	.strict();

const ListAvailableCountriesDataOutputSchema = z
	.object({
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		countries: z.array(AvailableCountryOutputSchema),
		nextCursor: z.string().optional(),
		notes: z.array(z.string()),
		source: z.enum(["SMART_CAMPAIGN_COUNTRIES", "GOOGLE_ADS_COUNTRIES"]),
		totalCount: z.number(),
	})
	.strict();

const SummaryCountOutputSchema = z
	.object({
		nextCursor: z.string().optional(),
		summary: z.string(),
		totalCount: z.number(),
	})
	.strict();

const SummaryWarningsActionsOutputSchema = z
	.object({
		actionRequired: z.array(z.string()).optional(),
		summary: z.string(),
		warnings: z.array(z.string()).optional(),
	})
	.strict();

const NormalizedTargetingOutputSchema = z.union([
	z.object({ mode: z.literal("GLOBAL") }).strict(),
	z
		.object({
			countries: z.array(
				z.object({ code: z.string(), name: z.string() }).strict(),
			),
			mode: z.literal("COUNTRIES"),
		})
		.strict(),
]);

const GetCampaignReadinessDataOutputSchema = z
	.object({
		artistId: z.string(),
		artistName: z.string(),
		blockingIssues: z.array(z.string()),
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		isReady: z.boolean(),
		missingInputs: z.array(z.string()),
		normalizedTargeting: NormalizedTargetingOutputSchema,
		recommendedNextAction: z.string(),
		warnings: z.array(z.string()),
	})
	.strict();

const CreateSmartLinkFromSpotifyDataOutputSchema =
	SmartLinkDetailsOutputSchema.extend({
		outcome: z.enum(["created", "existing"]),
		workflowRunId: z.string().nullable(),
		workflowWarning: z.string().nullable(),
	}).strict();

const CreateSmartLinksFromSpotifyArtistDataOutputSchema = z
	.object({
		artistCreatedFromSpotify: z.boolean().optional(),
		artistHubUrl: z.string(),
		artistId: z.string(),
		artistName: z.string(),
		catalogImportStatus: z.enum(["started", "start_failed"]),
		catalogWorkflowRunId: z.string().nullable(),
		currentSmartLinkCount: z.number(),
		existingCount: z.number(),
		initialRenderRunId: z.string().nullable(),
		initialSmartLink: SmartLinkSummaryOutputSchema.nullable(),
		newlyAvailableCount: z.number(),
		nextActions: z.array(z.string()),
		smartLinks: z.array(SmartLinkSummaryOutputSchema),
		spotifyArtistUrl: z.string(),
		summary: z.string(),
		warnings: z.array(z.string()).optional(),
	})
	.strict();

const LaunchCampaignDataOutputSchema = z
	.object({
		budget: MoneyDisplayOutputSchema,
		budgetType: z.enum(["DAILY", "TOTAL"]),
		campaignType: z.enum(["SMART_CAMPAIGN", "YOUTUBE"]),
		contentTitle: z.string(),
		deliveryState: z.enum(["ACTIVE", "PENDING_REVIEW", "CONTENT_VALIDATION"]),
		id: z.string(),
		isLive: z.boolean(),
		nextSteps: z.array(z.string()),
		platforms: z.array(z.string()),
		status: z.string(),
		summary: z.string(),
		warnings: z.array(z.string()).optional(),
	})
	.strict();

export const AnyOutputEnvelopeSchema = z.union([
	z.object({ data: AnyToolDataOutputSchema, status: z.literal("success") }),
	z.object({
		data: AnyToolDataOutputSchema,
		message: z.string(),
		status: z.literal("partial_success"),
	}),
	ErrorEnvelopeOutputSchema,
]);

export const ListMediaAssetsOutputEnvelopeSchema = z.union([
	z.object({
		data: z.union([
			ListMediaAssetsDataOutputSchema,
			ListMediaAssetsSummaryOutputSchema,
		]),
		status: z.literal("success"),
	}),
	ErrorEnvelopeOutputSchema,
]);

export const LaunchCampaignOutputEnvelopeSchema = z.union([
	z.object({
		data: LaunchCampaignDataOutputSchema,
		status: z.literal("success"),
	}),
	ErrorEnvelopeOutputSchema,
]);

export const ListAvailableCountriesOutputEnvelopeSchema = z.union([
	z.object({
		data: z.union([
			ListAvailableCountriesDataOutputSchema,
			SummaryCountOutputSchema,
		]),
		status: z.literal("success"),
	}),
	ErrorEnvelopeOutputSchema,
]);

export const GetCampaignReadinessOutputEnvelopeSchema = z.union([
	z.object({
		data: z.union([
			GetCampaignReadinessDataOutputSchema,
			SummaryWarningsActionsOutputSchema,
		]),
		status: z.literal("success"),
	}),
	ErrorEnvelopeOutputSchema,
]);

export const CreateSmartLinkFromSpotifyOutputEnvelopeSchema = z.union([
	z.object({
		data: CreateSmartLinkFromSpotifyDataOutputSchema,
		status: z.literal("success"),
	}),
	ErrorEnvelopeOutputSchema,
]);

export const CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema = z.union([
	z.object({
		data: CreateSmartLinksFromSpotifyArtistDataOutputSchema,
		status: z.literal("success"),
	}),
	ErrorEnvelopeOutputSchema,
]);

export const ListSmartLinksOutputEnvelopeSchema = z.union([
	z.object({
		data: z.union([
			ListSmartLinksDataOutputSchema,
			ListSmartLinksSummaryOutputSchema,
		]),
		status: z.literal("success"),
	}),
	ErrorEnvelopeOutputSchema,
]);
