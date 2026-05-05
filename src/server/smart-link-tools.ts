import * as z from "zod/v4";
import {
	AnyOutputEnvelopeSchema,
	CreateSmartLinkFromSpotifyOutputEnvelopeSchema,
	CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema,
	ListSmartLinksOutputEnvelopeSchema,
} from "./output-schemas";

const ToolFormatSchema = z.enum(["json", "summary"]);
const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const UserIntentSummarySchema = z.string().trim().max(500).optional();
const ClientRequestIdSchema = z.string().uuid().optional();
const RequiredClientRequestIdSchema = z.string().uuid();

function isValidCalendarDate(value: string): boolean {
	const date = new Date(`${value}T00:00:00.000Z`);
	return (
		Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
	);
}

const DateRangeSchema = z
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

const SmartLinkStatusFiltersSchema = {
	claimStatus: z
		.enum([
			"auto_approved",
			"pending_ops_review",
			"approved_by_ops",
			"rejected",
		])
		.optional(),
	publishState: z.enum(["published", "unpublished"]).optional(),
	renderState: z.enum(["queued", "rendering", "rendered", "failed"]).optional(),
} as const;

const SmartLinkThemeSchema = z.enum([
	"classic",
	"brutalist",
	"aurora",
	"cinematic",
]);

export const DynamoiCreateSmartLinkFromSpotifyInputSchema = z
	.object({
		artistId: z.string().uuid(),
		clientRequestId: RequiredClientRequestIdSchema.optional(),
		customDescription: z.string().trim().max(500).optional(),
		format: ToolFormatSchema.optional(),
		spotifyUrl: z.string().trim().min(1).max(500),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiCreateSmartLinksFromSpotifyArtistInputSchema = z
	.object({
		artistId: z.string().uuid().optional(),
		clientRequestId: RequiredClientRequestIdSchema.optional(),
		format: ToolFormatSchema.optional(),
		spotifyArtistUrl: z.string().trim().min(1).max(500),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const DynamoiListSmartLinksInputSchema = z
	.object({
		artistId: z.string().uuid(),
		cursor: z.string().optional(),
		format: ToolFormatSchema.optional(),
		limit: z.number().int().min(1).max(50).optional(),
		query: z.string().trim().max(120).optional(),
		...SmartLinkStatusFiltersSchema,
	})
	.strict();

export const DynamoiGetSmartLinkInputSchema = z
	.object({
		artistId: z.string().uuid().optional(),
		dateRange: DateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
		include: z
			.array(z.enum(["analytics", "artist_settings"]))
			.max(2)
			.optional(),
		includeBreakdowns: z.boolean().optional(),
		playLinkId: z.string().uuid().optional(),
		spotifyUrl: z.string().trim().min(1).max(500).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		const settingsOnly =
			data.include?.includes("artist_settings") &&
			!data.playLinkId &&
			!data.spotifyUrl &&
			Boolean(data.artistId);
		if (
			!(data.playLinkId || (data.artistId && data.spotifyUrl) || settingsOnly)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"Provide playLinkId, artistId with spotifyUrl, or artistId with include=['artist_settings']",
				path: ["playLinkId"],
			});
		}
		if (
			(data.dateRange || data.granularity || data.includeBreakdowns) &&
			!data.include?.includes("analytics")
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"dateRange, granularity, and includeBreakdowns require include to contain analytics",
				path: ["include"],
			});
		}
	});

export const DynamoiGetSmartLinkAnalyticsInputSchema = z
	.object({
		dateRange: DateRangeSchema.optional(),
		format: ToolFormatSchema.optional(),
		granularity: z.enum(["TOTAL", "DAILY"]).optional(),
		includeBreakdowns: z.boolean().optional(),
		playLinkId: z.string().uuid(),
	})
	.strict();

export const DynamoiGetSmartLinkArtistSettingsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		format: ToolFormatSchema.optional(),
	})
	.strict();

export const DynamoiUpdateSmartLinkInputSchema = z
	.object({
		action: z.enum([
			"update_description",
			"update_artist_settings",
			"publish",
			"unpublish",
		]),
		artistId: z.string().uuid().optional(),
		clientRequestId: ClientRequestIdSchema,
		customDescription: z.string().max(500).nullable().optional(),
		expectedPublishState: z.enum(["published", "unpublished"]).optional(),
		expectedUpdatedAt: z.string().datetime().optional(),
		googleAdsConversionId: z.string().trim().max(32).nullable().optional(),
		metaPixelId: z.string().trim().max(32).nullable().optional(),
		playLinkId: z.string().uuid().optional(),
		theme: SmartLinkThemeSchema.optional(),
		tiktokPixelId: z.string().trim().max(32).nullable().optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.action === "update_description" &&
			data.customDescription === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"customDescription is required when action is update_description",
				path: ["customDescription"],
			});
		}
		if (data.action !== "update_artist_settings" && !data.playLinkId) {
			ctx.addIssue({
				code: "custom",
				message:
					"playLinkId is required when action is update_description, publish, or unpublish",
				path: ["playLinkId"],
			});
		}
		if (data.action === "update_artist_settings") {
			if (!data.artistId) {
				ctx.addIssue({
					code: "custom",
					message: "artistId is required when action is update_artist_settings",
					path: ["artistId"],
				});
			}
			if (
				data.theme === undefined &&
				data.metaPixelId === undefined &&
				data.tiktokPixelId === undefined &&
				data.googleAdsConversionId === undefined
			) {
				ctx.addIssue({
					code: "custom",
					message: "Provide at least one setting to update",
					path: ["theme"],
				});
			}
		}
		if (
			(data.action === "publish" || data.action === "unpublish") &&
			data.customDescription !== undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "customDescription is only valid for update_description",
				path: ["customDescription"],
			});
		}
		if (data.action !== "update_artist_settings") {
			for (const field of [
				"artistId",
				"googleAdsConversionId",
				"metaPixelId",
				"theme",
				"tiktokPixelId",
			] as const) {
				if (data[field] !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: `${field} is only valid for update_artist_settings`,
						path: [field],
					});
				}
			}
		}
		if (
			data.action !== "publish" &&
			data.action !== "unpublish" &&
			data.expectedPublishState !== undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "expectedPublishState is only valid for publish or unpublish",
				path: ["expectedPublishState"],
			});
		}
	});

export const DynamoiUpdateSmartLinkArtistSettingsInputSchema = z
	.object({
		artistId: z.string().uuid(),
		clientRequestId: ClientRequestIdSchema,
		googleAdsConversionId: z.string().trim().max(32).nullable().optional(),
		metaPixelId: z.string().trim().max(32).nullable().optional(),
		theme: SmartLinkThemeSchema.optional(),
		tiktokPixelId: z.string().trim().max(32).nullable().optional(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict()
	.superRefine((data, ctx) => {
		if (
			data.theme === undefined &&
			data.metaPixelId === undefined &&
			data.tiktokPixelId === undefined &&
			data.googleAdsConversionId === undefined
		) {
			ctx.addIssue({
				code: "custom",
				message: "Provide at least one setting to update",
				path: ["theme"],
			});
		}
	});

export const DynamoiPublishSmartLinkInputSchema = z
	.object({
		clientRequestId: ClientRequestIdSchema,
		expectedPublishState: z.enum(["published", "unpublished"]).optional(),
		playLinkId: z.string().uuid(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

export const PHASE_4_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user wants to create one free Dynamoi Smart Link from a Spotify album or track URL/URI, or a single starter release from a Spotify artist URL. For full-catalog artist imports or artist hub requests, prefer dynamoi_create_smart_links_from_spotify_artist. Smart Links are free: no per-link fee, no subscription requirement, and no upgrade gate. This does not create a paid ad campaign. Spotify playlist URLs are not supported today. If the Smart Link already exists, return the existing link instead of creating a duplicate. In the final answer, lead with the public URL and do not expose internal IDs unless asked.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_create_smart_link_from_spotify",
		openWorldHint: true,
		outputSchema: CreateSmartLinkFromSpotifyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiCreateSmartLinkFromSpotifyInputSchema,
		title: "Create Free Smart Link from Spotify",
	},
	{
		description:
			"Use this when the user gives a Spotify artist URL and wants Dynamoi to create, import, or refresh free Smart Links for the artist catalog and return the artist hub. If the signed-in user has no Dynamoi artist yet, omit artistId so Dynamoi can create the first artist from the Spotify artist profile. This starts the background catalog import so the user does not need to open the dashboard. Smart Links are free: no per-link fee, no subscription requirement, and no upgrade gate. This does not create a paid ad campaign. In the final answer, lead with the artist hub URL and current public Smart Link URLs; do not expose internal IDs unless asked.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_create_smart_links_from_spotify_artist",
		openWorldHint: true,
		outputSchema: CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiCreateSmartLinksFromSpotifyArtistInputSchema,
		title: "Create Free Smart Links for Spotify Artist",
	},
	{
		description:
			"Use this when the user wants to list free Smart Links for one artist, including release title, public URL, publish state, claim state, render state, and theme. Do not use this for paid campaign lists; use dynamoi_list_campaigns for campaigns. In the final answer, show public URLs and avoid internal IDs unless asked. If empty for an artist with connected Spotify, suggest dynamoi_create_smart_links_from_spotify_artist for catalog import or dynamoi_create_smart_link_from_spotify for one release instead of stopping at 'no Smart Links yet'.",
		destructiveHint: false,
		name: "dynamoi_list_smart_links",
		openWorldHint: false,
		outputSchema: ListSmartLinksOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListSmartLinksInputSchema,
		title: "List Smart Links",
	},
	{
		description:
			"Use this when the user wants full details for one free Smart Link, including release, Spotify URL, public play.dynamoi.com URL, current status, theme source, and next actions. Add include=['analytics'] for visit/click analytics and include=['artist_settings'] for artist-level theme/pixel settings. In the final answer, lead with the public URL and do not expose internal IDs unless asked.",
		destructiveHint: false,
		name: "dynamoi_get_smart_link",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetSmartLinkInputSchema,
		title: "Get Smart Link",
	},
	{
		description:
			"Use this when the user wants to change one Smart Link's public description, publish/unpublish the public landing page, or update artist-level Smart Link theme/pixel settings. Set action to update_description, publish, unpublish, or update_artist_settings. This updates public landing-page behavior and may queue background rendering.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_update_smart_link",
		openWorldHint: true,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateSmartLinkInputSchema,
		title: "Update Smart Link",
	},
] as const;
