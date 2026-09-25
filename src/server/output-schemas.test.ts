import { describe, expect, test } from "bun:test";
import {
	GetCampaignReadinessOutputEnvelopeSchema,
	LaunchCampaignOutputEnvelopeSchema,
} from "./output-schemas";

function launchData(budget: Record<string, unknown>) {
	return {
		budget,
		budgetType: "DAILY",
		campaignType: "SMART_CAMPAIGN",
		contentTitle: "Track",
		deliveryState: "ACTIVE",
		id: "camp_1",
		isLive: true,
		nextSteps: [],
		platforms: ["META"],
		status: "ACTIVE",
		summary: "ok",
	};
}

describe("MoneyDisplayOutputSchema currency contract", () => {
	test("accepts USD budget with amountUsd for backward compatibility", () => {
		const result = LaunchCampaignOutputEnvelopeSchema.safeParse({
			data: launchData({
				amount: 10,
				amountUsd: 10,
				currency: "USD",
				formatted: "$10.00",
			}),
			status: "success",
		});
		expect(result.success).toBeTrue();
	});

	test("accepts non-USD budget without amountUsd", () => {
		const result = LaunchCampaignOutputEnvelopeSchema.safeParse({
			data: launchData({
				amount: 12.34,
				currency: "EUR",
				formatted: "€12.34",
			}),
			status: "success",
		});
		expect(result.success).toBeTrue();
	});

	test("rejects non-USD budget carrying amountUsd", () => {
		const result = LaunchCampaignOutputEnvelopeSchema.safeParse({
			data: launchData({
				amount: 12.34,
				amountUsd: 12.34,
				currency: "EUR",
				formatted: "€12.34",
			}),
			status: "success",
		});
		expect(result.success).toBeFalse();
	});

	test("rejects USD budget missing amountUsd or with a mismatched one", () => {
		for (const budget of [
			{ amount: 10, currency: "USD", formatted: "$10.00" },
			{
				amount: 10,
				amountUsd: 11,
				currency: "USD",
				formatted: "$10.00",
			},
		]) {
			const result = LaunchCampaignOutputEnvelopeSchema.safeParse({
				data: launchData(budget),
				status: "success",
			});
			expect(result.success).toBeFalse();
		}
	});
});

describe("YouTube entries in output envelopes", () => {
	test("launch output accepts ordered youtubeEntries", () => {
		const result = LaunchCampaignOutputEnvelopeSchema.safeParse({
			data: {
				...launchData({
					amount: 20,
					amountUsd: 20,
					currency: "USD",
					formatted: "$20.00",
				}),
				campaignType: "YOUTUBE",
				platforms: ["GOOGLE"],
				youtubeEntries: [
					{ playlistId: "PL1", selectionIndex: 0, videoId: "v1" },
					{ playlistId: "PL1", selectionIndex: 1, videoId: "v2" },
				],
			},
			status: "success",
		});
		expect(result.success).toBeTrue();
	});

	test("readiness output accepts youtubeEntries with a missing playlist", () => {
		const result = GetCampaignReadinessOutputEnvelopeSchema.safeParse({
			data: {
				artistId: "a",
				artistName: "A",
				blockingIssues: [],
				campaignType: "YOUTUBE",
				isReady: false,
				missingInputs: [],
				normalizedTargeting: { mode: "GLOBAL" },
				recommendedNextAction: "Add a playlist.",
				warnings: [],
				youtubeEntries: [{ playlistId: null, videoId: "v1" }],
			},
			status: "success",
		});
		expect(result.success).toBeTrue();
	});
});
