import { ChannelResultsSchema } from "../channel-results-schema";

const provenance = {
	asOfDate: "2026-09-30",
	attribution: "Observed on the channel; not attributed to the campaign.",
	source: "YouTube Analytics BigQuery warehouse",
} as const;
/** Fixture validated against the real shared schema, with a window distinct from ad analytics. */
export const channelFixture = ChannelResultsSchema.parse({
	channelMetrics: {
		estimatedMinutesWatched: 100,
		estimatedRevenueUsd: 500,
		monetizationCompleteness: "available",
		provenance,
		revenueThroughDay: "2026-09-28",
		subscribersGained: 4,
		subscribersLost: 1,
		views: 200,
	},
	coverage: {
		latestCompleteDay: "2026-09-29",
		missingDays: ["2026-09-20"],
		observedThroughDay: "2026-09-28",
		placeholderDays: ["2026-09-29"],
		provenance,
		trafficSourceDaysWithData: 8,
		trafficSourcePlaceholderRows: 1,
		videoMetricsThroughDay: "2026-09-28",
	},
	dateRange: { end: "2026-09-29", start: "2026-09-20" },
	playlistFunnel: {
		averageTimeInPlaylistSeconds: 30,
		playlistAddsPer1kViews: null,
		playlistStarts: 5,
		provenance,
		viewsPerPlaylistStart: 40,
	},
	status: "available",
	trafficSources: {
		advertisingSourceViews: null,
		otherSourceViews: null,
		provenance,
		rows: [],
		scope: "channel-date-aggregate",
	},
	viewsPerAdClick: {
		adClicks: null,
		days: 0,
		signal: "playlist-waterfall",
		value: null,
		views: null,
	},
});
