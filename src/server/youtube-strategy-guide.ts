import * as z from "zod/v4";

export const YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI =
	"dynamoi://youtube/campaign-strategies";

export const YouTubeStrategyKeySchema = z.enum([
	"CHEAPEST_VIEWS",
	"ORGANIC_VIEWS",
	"SUBSCRIBERS",
	"ORGANIC_VIEWS_AND_SUBSCRIBERS",
	"ADSENSE_ROI",
]);

export type YouTubeStrategyKey = z.infer<typeof YouTubeStrategyKeySchema>;

type YouTubeStrategyGuideEntry = {
	adNetworkOptimizesFor: string;
	bestFor: string;
	goal: string;
	judgeBy: string[];
	key: YouTubeStrategyKey;
	label: string;
	misleadingSignals: string[];
	placements: string;
	requirements: string;
};

const ORGANIC_LIFT_SIGNAL =
	"Organic lift: organic views above the channel's pre-campaign baseline.";
const CHEAP_VIEWS_MISLEAD =
	"A low cost per click or per paid view with no organic lift is a miss, not a win.";
const CONTINUED_VIEWS_MISLEAD =
	"Ad network-reported continued views are the ad network's own estimate. They include the promoted-video watch and are not YouTube's organic view count.";

const STRATEGY_ENTRIES = {
	ADSENSE_ROI: {
		adNetworkOptimizesFor:
			"Viewers it predicts will keep watching the artist's videos after the ad (its continued-views goal, the same as Organic Views). The ad network does not see the channel's revenue while it bids; Dynamoi judges revenue afterwards from YouTube data.",
		bestFor:
			"Monetized channels that want channel revenue to grow faster than campaign spend.",
		goal: "Grow the channel's YouTube ad revenue from organic views the campaign brings.",
		judgeBy: [
			"Channel revenue during the campaign compared with its pre-campaign baseline and with campaign spend as shown in Dynamoi.",
			"Revenue per 1,000 monetized playbacks by country and by video.",
			ORGANIC_LIFT_SIGNAL,
		],
		key: "ADSENSE_ROI",
		label: "Revenue Optimization",
		misleadingSignals: [
			"Cheap views or clicks from viewers who do not earn are a miss, not a win.",
			"Revenue for the latest 2-3 days is incomplete; YouTube also revises its revenue estimates.",
			CONTINUED_VIEWS_MISLEAD,
		],
		placements:
			"In-feed YouTube placements (home feed, watch-next and search) plus the ad network's Discover feed.",
		requirements:
			"Monetized channels only: YouTube revenue or monetized playbacks in the last 90 days. A playlist entry point is required.",
	},
	CHEAPEST_VIEWS: {
		adNetworkOptimizesFor:
			"The most video ad views for the budget, as a fixed-length video campaign.",
		bestFor:
			"A launch push or a one-off view target for a single video.",
		goal: "Show the promoted video to as many viewers as possible for the budget.",
		judgeBy: [
			"Paid views and cost per paid view against the budget and end date.",
			"Watch time per paid view, to check viewers actually watched.",
		],
		key: "CHEAPEST_VIEWS",
		label: "Maximize Views",
		misleadingSignals: [
			"Weak organic lift or few subscribers are expected: this strategy does not aim for them.",
			"Many paid views come from ads shown before or during other videos, so they can carry less watch time than in-feed views.",
		],
		placements:
			"All YouTube video placements, including ads that play before or during other videos.",
		requirements:
			"One video; a playlist is optional. Uses a total budget with an end date.",
	},
	ORGANIC_VIEWS: {
		adNetworkOptimizesFor:
			"Viewers it predicts will keep watching the artist's videos after the ad (its continued-views goal).",
		bestFor:
			"Channels that want ongoing views of their catalog, not just the promoted video.",
		goal: "Grow the channel's ongoing organic views by reaching viewers who keep watching after the ad.",
		judgeBy: [
			ORGANIC_LIFT_SIGNAL,
			"Watch time, playlist starts and views per playlist start.",
			"Cost per click or per paid view only as a secondary efficiency check.",
		],
		key: "ORGANIC_VIEWS",
		label: "Organic Views",
		misleadingSignals: [CHEAP_VIEWS_MISLEAD, CONTINUED_VIEWS_MISLEAD],
		placements:
			"In-feed YouTube placements: home feed, watch-next and search results.",
		requirements: "A playlist entry point is required.",
	},
	ORGANIC_VIEWS_AND_SUBSCRIBERS: {
		adNetworkOptimizesFor:
			"Both continued watching after the ad and new subscribers, balanced by the ad network.",
		bestFor:
			"Most channels that are not monetized yet; this is Dynamoi's default for them.",
		goal: "Grow organic views and subscribers together.",
		judgeBy: [
			ORGANIC_LIFT_SIGNAL,
			"Net subscribers (gained minus lost) compared with the pre-campaign baseline.",
			"Watch time and playlist starts.",
		],
		key: "ORGANIC_VIEWS_AND_SUBSCRIBERS",
		label: "Organic Views + Subscribers",
		misleadingSignals: [
			CHEAP_VIEWS_MISLEAD,
			"Subscribers gained without subscribers lost overstates growth.",
			CONTINUED_VIEWS_MISLEAD,
		],
		placements:
			"In-feed YouTube placements: home feed, watch-next and search results.",
		requirements: "A playlist entry point is required.",
	},
	SUBSCRIBERS: {
		adNetworkOptimizesFor:
			"Viewers it predicts will subscribe to the channel after the ad.",
		bestFor:
			"Channels whose main goal is audience size, for example to reach monetization thresholds.",
		goal: "Grow the channel's subscriber base.",
		judgeBy: [
			"Net subscribers (gained minus lost) compared with the pre-campaign baseline.",
			"Campaign spend per net subscriber.",
		],
		key: "SUBSCRIBERS",
		label: "Subscriber Growth",
		misleadingSignals: [
			"View volume: this strategy can trade views for subscribers.",
			"Subscribers gained without subscribers lost overstates growth.",
		],
		placements:
			"In-feed YouTube placements: home feed, watch-next and search results.",
		requirements: "A playlist entry point is required.",
	},
} as const satisfies Record<YouTubeStrategyKey, YouTubeStrategyGuideEntry>;

const VOCABULARY = {
	adNetwork:
		"Dynamoi YouTube campaigns run on Google's ad network and serve on YouTube. Call it 'the ad network'.",
	adNetworkReportedContinuedViews:
		"The ad network's own estimate of viewers who kept watching the artist's videos after the ad. It includes the promoted-video watch and is not YouTube's count; use it to understand what the ad network optimizes toward, never as organic views.",
	organicLift:
		"Organic views above the channel's pre-campaign baseline. The comparison, not the raw total, shows campaign impact.",
	organicViews:
		"Every other channel view: all traffic sources except advertising.",
	paidViews:
		"Channel views YouTube credits to advertising (traffic source ADVERTISING).",
	strategyNames:
		"Use the strategy label with users (for example 'Revenue Optimization'); use the key (for example ADSENSE_ROI) only in tool calls.",
} as const;

const PLAYLIST_WATERFALL = {
	advice: [
		"Use long playlists, up to about 10 hours; repeat the catalog when there are not enough videos.",
		"The video after the promoted one must be the artist's own.",
		"Similar-artist videos further down the playlist are only an optional idea the artist decides on.",
		"Do not claim that every stream earns revenue.",
	],
	measurementLimits:
		"YouTube data reports totals by day, video and traffic source. It does not follow individual viewers from video to video, so no data source proves how many views the playlist itself caused. Report playlist starts, views per playlist start and organic lift; do not claim exact playlist-caused views.",
	mechanism:
		"Except Maximize Views, each campaign promotes a video as the entry point into a playlist of the artist's own videos. After a viewer clicks, playback continues through that playlist instead of YouTube autoplay choosing unrelated videos.",
	purpose:
		"Keep ad-driven and background listeners on the artist's channel. It improves listener quality; it is not a hidden view multiplier.",
} as const;

const RESULT_TIMING = {
	baseline:
		"Compare with the channel's own pre-campaign period of similar length, on complete days only.",
	dataLag:
		"YouTube views, subscribers and revenue arrive about 2-3 days late, and the latest days may be partial. Check the coverage fields (observedThroughDay, revenueThroughDay) before comparing.",
	learning:
		"The ad network learns for about 7-14 days after launch or a strategy change. Delivery and cost swing during this time; do not give a verdict in the first week.",
	missingData: "Missing days are unknown, not zero.",
} as const;

export function buildYouTubeCampaignStrategiesGuide() {
	return {
		playlistWaterfall: PLAYLIST_WATERFALL,
		resultTiming: RESULT_TIMING,
		strategies: Object.values(STRATEGY_ENTRIES),
		vocabulary: VOCABULARY,
	};
}

export type YouTubeStrategyGuide = YouTubeStrategyGuideEntry & {
	moreDetail: string;
	resultTiming: string;
};

export function buildYouTubeStrategyGuide(
	strategy: string,
): YouTubeStrategyGuide | null {
	const parsed = YouTubeStrategyKeySchema.safeParse(strategy);
	if (!parsed.success) {
		return null;
	}
	const entry: YouTubeStrategyGuideEntry = STRATEGY_ENTRIES[parsed.data];
	return {
		...entry,
		judgeBy: [...entry.judgeBy],
		misleadingSignals: [...entry.misleadingSignals],
		moreDetail: `Read ${YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI} for view definitions, the playlist waterfall and result timing.`,
		resultTiming: `${RESULT_TIMING.learning} ${RESULT_TIMING.dataLag}`,
	};
}
