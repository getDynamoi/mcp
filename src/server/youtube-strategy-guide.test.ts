import { describe, expect, test } from "bun:test";
import {
	buildYouTubeCampaignStrategiesGuide,
	buildYouTubeStrategyGuide,
	YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI,
	YouTubeStrategyKeySchema,
} from "./youtube-strategy-guide";

describe("YouTube strategy guide", () => {
	test("covers every strategy key with a client label, goal and judging rules", () => {
		const guide = buildYouTubeCampaignStrategiesGuide();
		expect(guide.strategies.map((entry) => entry.key).sort()).toEqual(
			[...YouTubeStrategyKeySchema.options].sort(),
		);
		for (const key of YouTubeStrategyKeySchema.options) {
			const entry = buildYouTubeStrategyGuide(key);
			expect(entry?.label).toBeTruthy();
			expect(entry?.goal).toBeTruthy();
			expect(entry?.judgeBy.length).toBeGreaterThan(0);
			expect(entry?.moreDetail).toContain(
				YOUTUBE_CAMPAIGN_STRATEGIES_RESOURCE_URI,
			);
		}
		expect(buildYouTubeStrategyGuide("ADSENSE_ROI")?.label).toBe(
			"Revenue Optimization",
		);
	});

	test("returns null for an unknown strategy", () => {
		expect(buildYouTubeStrategyGuide("LEGACY_UNKNOWN")).toBeNull();
	});

	test("uses ad network, advertising-source and organic lift vocabulary", () => {
		const guide = buildYouTubeCampaignStrategiesGuide();
		// The vocabulary line is the only place that may mention "Google Ads",
		// and only to tell agents not to repeat it.
		const { adNetwork, ...rest } = guide.vocabulary;
		expect(adNetwork).toContain("say 'the ad network'");
		expect(adNetwork).toContain("you may name Google once");
		expect(adNetwork).toContain("do not repeat 'Google Ads'");
		expect(JSON.stringify({ ...guide, vocabulary: rest })).not.toContain(
			"Google Ads",
		);
		const text = JSON.stringify(guide);
		expect(text.toLowerCase()).not.toContain("follow-on");
		expect(text).toContain("Google's ad network");
		const { vocabulary } = buildYouTubeCampaignStrategiesGuide();
		expect(vocabulary.advertisingSourceViews).toContain("ADVERTISING");
		expect(vocabulary.otherSourceViews).toContain("not organic");
		expect(vocabulary.campaignPeriodLift).toContain("mostly ad sessions");
		expect(vocabulary.organicLift).toContain("persists after spend stops");
		expect(vocabulary.organicLift).toContain("YT_SEARCH");
		expect(vocabulary.organicLift).toContain("are organic proof");
		expect(vocabulary.viewsPerAdClick).toContain("playlist waterfall signal");
		expect(guide.playlistWaterfall.measurement).toContain("Views per ad click");
		expect(Object.keys(vocabulary)).not.toContain("paidViews");
		expect(Object.keys(vocabulary)).not.toContain("organicViews");
		for (const key of ["ORGANIC_VIEWS", "ORGANIC_VIEWS_AND_SUBSCRIBERS"]) {
			const entry = buildYouTubeStrategyGuide(key);
			expect(entry?.judgeBy.join(" ")).toContain("Campaign-period lift");
			expect(entry?.judgeBy.join(" ")).toContain("Views per ad click");
			expect(entry?.misleadingSignals.join(" ")).toContain("not organic proof");
		}
	});

	test("describes Revenue Optimization without claiming real-time revenue bidding", () => {
		const entry = buildYouTubeStrategyGuide("ADSENSE_ROI");
		expect(entry?.adNetworkOptimizesFor).toContain(
			"does not see the channel's revenue",
		);
		expect(entry?.requirements).toContain("Monetized channels only");
	});
});
