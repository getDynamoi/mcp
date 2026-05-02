import { describe, expect, test } from "bun:test";
import {
	DynamoiCreateSmartLinkFromSpotifyInputSchema,
	DynamoiPublishSmartLinkInputSchema,
	DynamoiUpdateSmartLinkArtistSettingsInputSchema,
	DynamoiUpdateSmartLinkInputSchema,
	PHASE_4_TOOL_DEFINITIONS,
} from "./smart-link-tools";
import {
	DynamoiGetArtistAnalyticsInputSchema,
	DynamoiGetCampaignInputSchema,
	DynamoiGetCampaignReadinessInputSchema,
	DynamoiGetCurrentUserInputSchema,
	DynamoiLaunchCampaignInputSchema,
	DynamoiListAvailableCountriesInputSchema,
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
			expect(def.outputSchema).toBeDefined();
		}
	});

	test("read tool descriptions follow review-friendly metadata guidance", () => {
		for (const def of PHASE_1_TOOL_DEFINITIONS) {
			expect(def.description.startsWith("Use this when")).toBe(true);
			expect(def.description).toContain("Do not use");
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

	test("current user schema requires explicit account intent", () => {
		expect(() => DynamoiGetCurrentUserInputSchema.parse({})).toThrow();

		const parsed = DynamoiGetCurrentUserInputSchema.parse({
			intent: "account_overview",
		});
		expect(parsed.intent).toBe("account_overview");
	});

	test("artist analytics metadata guides direct summary answers", () => {
		const definition = PHASE_1_TOOL_DEFINITIONS.find(
			(def) => def.name === "dynamoi_get_artist_analytics",
		);
		expect(definition).toBeDefined();
		expect(definition?.description).toContain("Pass format=summary");
		expect(definition?.description).toContain("stop and answer");
	});

	test("available countries schema requires campaignType", () => {
		expect(() => DynamoiListAvailableCountriesInputSchema.parse({})).toThrow();
		const parsed = DynamoiListAvailableCountriesInputSchema.parse({
			campaignType: "SMART_CAMPAIGN",
			query: "United",
		});
		expect(parsed.campaignType).toBe("SMART_CAMPAIGN");
	});

	test("campaign readiness schema accepts no-write preflight inputs", () => {
		const parsed = DynamoiGetCampaignReadinessInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			budgetAmount: 100,
			budgetType: "TOTAL",
			campaignType: "YOUTUBE",
			contentType: "VIDEO",
			endDate: "2026-06-01",
			locationTargets: [{ code: "US", name: "United States" }],
			youtubeVideoId: "abc123",
		});
		expect(parsed.campaignType).toBe("YOUTUBE");
		expect(parsed.endDate).toBe("2026-06-01");
		expect(parsed.locationTargets?.[0]?.code).toBe("US");
	});
});

describe("mcp/tools phase 2 definitions", () => {
	test("write tools include required annotations", () => {
		for (const def of PHASE_2_TOOL_DEFINITIONS) {
			expect(def.readOnlyHint).toBe(false);
			expect(def.destructiveHint).toBe(true);
			expect(def.idempotentHint).toBe(true);
			expect(def.openWorldHint).toBe(true);
			expect(def.outputSchema).toBeDefined();
			expect(def.title.length).toBeGreaterThan(0);
		}
	});

	test("write tool descriptions follow review-friendly metadata guidance", () => {
		for (const def of PHASE_2_TOOL_DEFINITIONS) {
			expect(def.description.startsWith("Use this when")).toBe(true);
			expect(def.description).toContain("Do not use");
		}
	});

	test("pause schema accepts uuid campaignId", () => {
		const parsed = DynamoiPauseCampaignInputSchema.parse({
			campaignId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			expectedCurrentStatus: "ACTIVE",
			userIntentSummary: "Pause because the artist asked to stop delivery.",
		});
		expect(parsed.campaignId).toBe("00000000-0000-0000-0000-000000000000");
		expect(parsed.clientRequestId).toBe("11111111-1111-4111-8111-111111111111");
	});

	test("resume schema accepts uuid campaignId", () => {
		const parsed = DynamoiResumeCampaignInputSchema.parse({
			campaignId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			expectedCurrentStatus: "PAUSED",
			userIntentSummary: "Resume after confirming billing is ready.",
		});
		expect(parsed.campaignId).toBe("00000000-0000-0000-0000-000000000000");
		expect(parsed.expectedCurrentStatus).toBe("PAUSED");
	});

	test("pause and resume schemas accept campaign read status guards", () => {
		for (const expectedCurrentStatus of [
			"AWAITING_SMART_LINK",
			"CONTENT_VALIDATION",
			"DEPLOYING",
			"READY_FOR_REVIEW",
			"ACTIVE",
			"PAUSED",
			"SUBSCRIPTION_PAUSED",
			"ARCHIVED",
			"FAILED",
			"ENDED",
		]) {
			const parsed = DynamoiPauseCampaignInputSchema.parse({
				campaignId: "00000000-0000-0000-0000-000000000000",
				expectedCurrentStatus,
			});
			expect(parsed.expectedCurrentStatus).toBe(expectedCurrentStatus);
		}
	});

	test("update budget schema requires positive budgetAmount", () => {
		expect(() =>
			DynamoiUpdateBudgetInputSchema.parse({
				budgetAmount: 0,
				campaignId: "00000000-0000-0000-0000-000000000000",
			}),
		).toThrow();
	});

	test("update budget schema accepts idempotency and expected-state guards", () => {
		const parsed = DynamoiUpdateBudgetInputSchema.parse({
			budgetAmount: 250,
			campaignId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			expectedCurrentBudgetAmount: 100,
			expectedCurrentEndDate: "2026-05-15",
			userIntentSummary: "Increase after checking campaign performance.",
		});

		expect(parsed.clientRequestId).toBe("11111111-1111-4111-8111-111111111111");
		expect(parsed.expectedCurrentEndDate).toBe("2026-05-15");
	});
});

describe("mcp/tools phase 3 definitions", () => {
	test("tools include required annotations", () => {
		for (const def of PHASE_3_TOOL_DEFINITIONS) {
			// Phase 3 includes both read and write tools; both must set all annotations.
			expect(typeof def.readOnlyHint).toBe("boolean");
			expect(def.destructiveHint).toBe(false);
			expect(typeof def.openWorldHint).toBe("boolean");
			expect(def.outputSchema).toBeDefined();
			expect(def.title.length).toBeGreaterThan(0);
		}
	});

	test("phase 3 tool descriptions follow review-friendly metadata guidance", () => {
		for (const def of PHASE_3_TOOL_DEFINITIONS) {
			expect(def.description.startsWith("Use this when")).toBe(true);
			expect(def.description).toContain("Do not use");
		}
	});

	test("launch campaign schema accepts review-style smart campaign inputs", () => {
		const parsed = DynamoiLaunchCampaignInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			budgetAmount: 100,
			budgetSplits: { GOOGLE: 0, META: 100 },
			budgetType: "TOTAL",
			campaignType: "SMART_CAMPAIGN",
			clientRequestId: "00000000-0000-0000-0000-000000000000",
			contentTitle: "Song",
			contentType: "TRACK",
			locationTargets: [
				{ code: "US", name: "United States" },
				{ code: "CA", name: "Canada" },
			],
			mediaAssetIds: ["00000000-0000-0000-0000-000000000000"],
			useAiGeneratedCopy: true,
		});

		expect(parsed.endDate).toBeUndefined();
		expect(parsed.spotifyUrl).toBeUndefined();
	});

	test("launch campaign metadata documents reviewer-safe defaults", () => {
		const definition = PHASE_3_TOOL_DEFINITIONS.find(
			(def) => def.name === "dynamoi_launch_campaign",
		);
		expect(definition).toBeDefined();
		expect(definition?.description).toContain("omit spotifyUrl and endDate");
		expect(definition?.description).toContain("reviewer-safe defaults");
		expect(definition?.description).toContain("Do not invent placeholder");
	});

	test("current user metadata discourages generic advice context fishing", () => {
		const definition = PHASE_1_TOOL_DEFINITIONS.find(
			(def) => def.name === "dynamoi_get_account_overview",
		);
		expect(definition).toBeDefined();
		expect(definition?.description).toContain("explicitly asks");
		expect(definition?.description).toContain("Always pass intent");
		expect(definition?.description).toContain("check context");
		expect(definition?.description).toContain("generic Instagram");
		expect(definition?.description).toContain("Never use");
	});

	test("launch campaign metadata tells ChatGPT to stop after a successful launch", () => {
		const definition = PHASE_3_TOOL_DEFINITIONS.find(
			(def) => def.name === "dynamoi_launch_campaign",
		);
		expect(definition).toBeDefined();
		expect(definition?.description).toContain("After a successful launch");
		expect(definition?.description).toContain(
			"answer from the returned campaign details directly",
		);
	});

	test("schemas reject unknown properties", () => {
		expect(() =>
			DynamoiGetCampaignInputSchema.parse({
				campaignId: "00000000-0000-0000-0000-000000000000",
				unexpected: true,
			}),
		).toThrow();
	});
});

describe("mcp/tools phase 4 smart link definitions", () => {
	test("smart link tools include required annotations and output schemas", () => {
		for (const def of PHASE_4_TOOL_DEFINITIONS) {
			expect(typeof def.readOnlyHint).toBe("boolean");
			expect(typeof def.destructiveHint).toBe("boolean");
			expect(typeof def.openWorldHint).toBe("boolean");
			expect(def.outputSchema).toBeDefined();
			expect(def.title.length).toBeGreaterThan(0);
		}
	});

	test("smart link descriptions keep the free plan and paid campaign boundary clear", () => {
		const createDefinition = PHASE_4_TOOL_DEFINITIONS.find(
			(def) => def.name === "dynamoi_create_smart_link_from_spotify",
		);
		expect(createDefinition).toBeDefined();
		expect(createDefinition?.description).toContain("Smart Links are free");
		expect(createDefinition?.description).toContain(
			"does not create a paid ad campaign",
		);
		expect(createDefinition?.description).toContain(
			"playlist URLs are not supported",
		);
		expect(createDefinition?.description).toContain("lead with the public URL");
	});

	test("create smart link schema accepts Spotify entrypoint inputs", () => {
		const parsed = DynamoiCreateSmartLinkFromSpotifyInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			customDescription: "New release landing page",
			spotifyUrl: "https://open.spotify.com/track/123",
			userIntentSummary: "Create a free Smart Link for this track.",
		});

		expect(parsed.spotifyUrl).toContain("spotify.com");
	});

	test("smart link settings schema supports theme and validated pixel id fields only", () => {
		const parsed = DynamoiUpdateSmartLinkArtistSettingsInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			clientRequestId: "11111111-1111-4111-8111-111111111111",
			metaPixelId: "1234567890",
			theme: "aurora",
		});

		expect(parsed.theme).toBe("aurora");
		expect(() =>
			DynamoiUpdateSmartLinkArtistSettingsInputSchema.parse({
				artistId: "00000000-0000-0000-0000-000000000000",
				script: "<script>alert(1)</script>",
			}),
		).toThrow();
	});

	test("smart link mutation schemas reject unknown properties", () => {
		expect(() =>
			DynamoiUpdateSmartLinkInputSchema.parse({
				customDescription: "Hello",
				playLinkId: "00000000-0000-0000-0000-000000000000",
				theme: "classic",
			}),
		).toThrow();
		expect(() =>
			DynamoiPublishSmartLinkInputSchema.parse({
				playLinkId: "00000000-0000-0000-0000-000000000000",
				publicUrl: "https://play.dynamoi.com/x",
			}),
		).toThrow();
	});
});
