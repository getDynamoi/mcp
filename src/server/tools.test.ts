import { describe, expect, test } from "bun:test";
import {
	DynamoiGetArtistAnalyticsInputSchema,
	DynamoiGetCampaignInputSchema,
	DynamoiLaunchCampaignInputSchema,
	DynamoiPauseCampaignInputSchema,
	DynamoiResumeCampaignInputSchema,
	DynamoiUpdateBudgetInputSchema,
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_3_TOOL_DEFINITIONS,
} from "./tools";

describe("mcp/tools phase 1 definitions", () => {
	test("read tools include required annotations", () => {
		for (const def of PHASE_1_TOOL_DEFINITIONS) {
			expect(def.readOnlyHint).toBe(true);
			expect(def.destructiveHint).toBe(false);
			expect(def.openWorldHint).toBe(false);
		}
	});

	test("get campaign schema supports includeCountries", () => {
		const parsed = DynamoiGetCampaignInputSchema.parse({
			campaignId: "00000000-0000-0000-0000-000000000000",
			includeCountries: true,
		});
		expect(parsed.includeCountries).toBe(true);
	});

	test("get artist analytics schema accepts uuid artistId", () => {
		const parsed = DynamoiGetArtistAnalyticsInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
		});
		expect(parsed.artistId).toBe("00000000-0000-0000-0000-000000000000");
	});
});

describe("mcp/tools phase 2 definitions", () => {
	test("write tools include required annotations", () => {
		for (const def of PHASE_2_TOOL_DEFINITIONS) {
			expect(def.readOnlyHint).toBe(false);
			expect(def.destructiveHint).toBe(false);
			expect(def.openWorldHint).toBe(true);
		}
	});

	test("pause schema accepts uuid campaignId", () => {
		const parsed = DynamoiPauseCampaignInputSchema.parse({
			campaignId: "00000000-0000-0000-0000-000000000000",
		});
		expect(parsed.campaignId).toBe("00000000-0000-0000-0000-000000000000");
	});

	test("resume schema accepts uuid campaignId", () => {
		const parsed = DynamoiResumeCampaignInputSchema.parse({
			campaignId: "00000000-0000-0000-0000-000000000000",
		});
		expect(parsed.campaignId).toBe("00000000-0000-0000-0000-000000000000");
	});

	test("update budget schema requires positive budgetAmount", () => {
		expect(() =>
			DynamoiUpdateBudgetInputSchema.parse({
				budgetAmount: 0,
				campaignId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow();
	});
});

describe("mcp/tools phase 3 definitions", () => {
	test("tools include required annotations", () => {
		for (const def of PHASE_3_TOOL_DEFINITIONS) {
			// Phase 3 includes both read and write tools; both must set all annotations.
			expect(typeof def.readOnlyHint).toBe("boolean");
			expect(def.destructiveHint).toBe(false);
			expect(typeof def.openWorldHint).toBe("boolean");
		}
	});

	test("launch campaign requires endDate for TOTAL", () => {
		expect(() =>
			DynamoiLaunchCampaignInputSchema.parse({
				adCopy: "hello world",
				artistId: "00000000-0000-0000-0000-000000000000",
				budgetAmount: 100,
				budgetSplits: { GOOGLE: 0, META: 100 },
				budgetType: "TOTAL",
				campaignType: "SMART_CAMPAIGN",
				clientRequestId: "00000000-0000-0000-0000-000000000000",
				contentTitle: "Song",
				contentType: "TRACK",
				mediaAssetIds: ["00000000-0000-0000-0000-000000000000"],
				spotifyUrl: "https://open.spotify.com/track/abc",
				useAiGeneratedCopy: true,
			}),
		).toThrow();
	});
});
