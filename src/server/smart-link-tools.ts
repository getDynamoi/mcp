import * as z from "zod/v4";
import {
	CreateSmartLinkFromSpotifyOutputEnvelopeSchema,
	CreateSmartLinksFromSpotifyArtistOutputEnvelopeSchema,
	GetSmartLinkAnalyticsOutputEnvelopeSchema,
	GetSmartLinkOutputEnvelopeSchema,
	ListSmartLinksOutputEnvelopeSchema,
	PublishSmartLinkOutputEnvelopeSchema,
	SmartLinkArtistSettingsOutputEnvelopeSchema,
	UpdateSmartLinkArtistSettingsOutputEnvelopeSchema,
	UpdateSmartLinkOutputEnvelopeSchema,
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
		artistId: z.string().uuid(),
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
		format: ToolFormatSchema.optional(),
		playLinkId: z.string().uuid().optional(),
		spotifyUrl: z.string().trim().min(1).max(500).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (!(data.playLinkId || (data.artistId && data.spotifyUrl))) {
			ctx.addIssue({
				code: "custom",
				message: "Provide playLinkId or artistId with spotifyUrl",
				path: ["playLinkId"],
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
		clientRequestId: ClientRequestIdSchema,
		customDescription: z.string().max(500).nullable(),
		expectedUpdatedAt: z.string().datetime().optional(),
		playLinkId: z.string().uuid(),
		userIntentSummary: UserIntentSummarySchema,
	})
	.strict();

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
			"Use this when the user gives a Spotify artist URL and wants Dynamoi to create, import, or refresh free Smart Links for the artist catalog and return the artist hub. This starts the background catalog import so the user does not need to open the dashboard. Smart Links are free: no per-link fee, no subscription requirement, and no upgrade gate. This does not create a paid ad campaign. In the final answer, lead with the artist hub URL and current public Smart Link URLs; do not expose internal IDs unless asked.",
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
			"Use this when the user wants full details for one free Smart Link, including release, Spotify URL, public play.dynamoi.com URL, current status, theme source, and next actions. In the final answer, lead with the public URL and do not expose internal IDs unless asked.",
		destructiveHint: false,
		name: "dynamoi_get_smart_link",
		openWorldHint: false,
		outputSchema: GetSmartLinkOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetSmartLinkInputSchema,
		title: "Get Smart Link",
	},
	{
		description:
			"Use this when the user asks how one free Smart Link is performing. Returns aggregate visits, streaming-service clicks, share clicks, promote CTA clicks, and optional daily or capped breakdown data. Never use this to expose raw visitor identifiers.",
		destructiveHint: false,
		name: "dynamoi_get_smart_link_analytics",
		openWorldHint: false,
		outputSchema: GetSmartLinkAnalyticsOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetSmartLinkAnalyticsInputSchema,
		title: "Get Smart Link Analytics",
	},
	{
		description:
			"Use this when the user wants to inspect artist-level Smart Link settings, including whether Smart Links are enabled, default theme, available themes, and configured tracking pixel IDs.",
		destructiveHint: false,
		name: "dynamoi_get_smart_link_artist_settings",
		openWorldHint: false,
		outputSchema: SmartLinkArtistSettingsOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiGetSmartLinkArtistSettingsInputSchema,
		title: "Get Smart Link Artist Settings",
	},
	{
		description:
			"Use this when the user wants to change one Smart Link's public description. This updates a public landing page and queues background rendering. Theme and pixel settings are artist-level; use dynamoi_update_smart_link_artist_settings for those.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_update_smart_link",
		openWorldHint: true,
		outputSchema: UpdateSmartLinkOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateSmartLinkInputSchema,
		title: "Update Smart Link",
	},
	{
		description:
			"Use this when the user wants to update artist-level Smart Link theme or tracking pixel IDs. These settings apply to all current and future Smart Links for the artist. Accepts only validated Meta Pixel ID, TikTok Pixel ID, and Google Ads Conversion ID; arbitrary JavaScript or script snippets are not supported.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_update_smart_link_artist_settings",
		openWorldHint: true,
		outputSchema: UpdateSmartLinkArtistSettingsOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiUpdateSmartLinkArtistSettingsInputSchema,
		title: "Update Smart Link Artist Settings",
	},
	{
		description:
			"Use this when the user explicitly wants to publish an approved Smart Link and expose its public play.dynamoi.com URL. Cannot publish rejected, pending-review, or takedown-active links.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_publish_smart_link",
		openWorldHint: true,
		outputSchema: PublishSmartLinkOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiPublishSmartLinkInputSchema,
		title: "Publish Smart Link",
	},
	{
		description:
			"Use this when the user explicitly wants to unpublish a Smart Link and remove its public play.dynamoi.com landing page. Restate the affected public URL before calling this tool.",
		destructiveHint: true,
		idempotentHint: true,
		name: "dynamoi_unpublish_smart_link",
		openWorldHint: true,
		outputSchema: PublishSmartLinkOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiPublishSmartLinkInputSchema,
		title: "Unpublish Smart Link",
	},
] as const;
