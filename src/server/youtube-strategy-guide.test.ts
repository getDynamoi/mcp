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

	test("uses ad network, paid and organic view vocabulary", () => {
		const text = JSON.stringify(buildYouTubeCampaignStrategiesGuide());
		expect(text).not.toContain("Google Ads");
		expect(text.toLowerCase()).not.toContain("follow-on");
		expect(text).toContain("Google's ad network");
		const { vocabulary } = buildYouTubeCampaignStrategiesGuide();
		expect(vocabulary.paidViews).toContain("ADVERTISING");
		expect(vocabulary.organicViews).toContain("except advertising");
	});

	test("describes Revenue Optimization without claiming real-time revenue bidding", () => {
		const entry = buildYouTubeStrategyGuide("ADSENSE_ROI");
		expect(entry?.adNetworkOptimizesFor).toContain(
			"does not see the channel's revenue",
		);
		expect(entry?.requirements).toContain("Monetized channels only");
	});
});
