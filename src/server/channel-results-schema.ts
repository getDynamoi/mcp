import * as z from "zod/v4";

const ProvenanceSchema = z
	.object({
		asOfDate: z.string().nullable(),
		attribution: z.literal(
			"Observed on the channel; not attributed to the campaign.",
		),
		source: z.literal("YouTube Analytics BigQuery warehouse"),
	})
	.strict();

export const ChannelResultsSchema = z.discriminatedUnion("status", [
	z
		.object({
			provenance: ProvenanceSchema,
			reason: z.string(),
			status: z.literal("unavailable"),
		})
		.strict(),
	z
		.object({
			channelMetrics: z
				.object({
					estimatedMinutesWatched: z.number(),
					estimatedRevenueUsd: z.number().optional(),
					monetizationCompleteness: z.enum(["available", "delayed", "missing"]),
					provenance: ProvenanceSchema,
					revenueThroughDay: z.string().nullable(),
					subscribersGained: z.number().nullable(),
					subscribersLost: z.number().nullable(),
					views: z.number(),
				})
				.strict(),
			coverage: z
				.object({
					latestCompleteDay: z.string(),
					missingDays: z.array(z.string()),
					observedThroughDay: z.string(),
					placeholderDays: z.array(z.string()),
					provenance: ProvenanceSchema,
					trafficSourceDaysWithData: z.number(),
					trafficSourcePlaceholderRows: z.number(),
					videoMetricsThroughDay: z.string().nullable(),
				})
				.strict(),
			dateRange: z.object({ end: z.string(), start: z.string() }).strict(),
			playlistFunnel: z
				.object({
					averageTimeInPlaylistSeconds: z.number(),
					playlistAddsPer1kViews: z.number().nullable(),
					playlistStarts: z.number(),
					provenance: ProvenanceSchema,
					viewsPerPlaylistStart: z.number(),
				})
				.strict(),
			status: z.literal("available"),
			trafficSources: z
				.object({
					provenance: ProvenanceSchema,
					rows: z.array(
						z
							.object({
								estimatedMinutesWatched: z.number(),
								trafficSourceType: z.string(),
								views: z.number(),
							})
							.strict(),
					),
					scope: z.literal("channel-date-aggregate"),
				})
				.strict(),
		})
		.strict(),
]);

export type ChannelResults = z.infer<typeof ChannelResultsSchema>;
