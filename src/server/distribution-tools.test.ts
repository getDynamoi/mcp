import { describe, expect, test } from "bun:test";
import {
	DISTRIBUTION_TOOL_DEFINITIONS,
	DynamoiApplyForDistributionInputSchema,
} from "./distribution-tools";
import {
	DynamoiStartMetaConnectionInputSchema,
	DynamoiStartYoutubeChannelLinkInputSchema,
} from "./tools";

const ARTIST_ID = "00000000-0000-4000-8000-000000000001";

describe("distribution MCP contract", () => {
	test("publishes the exact five app eligibility requirements", () => {
		const description = DISTRIBUTION_TOOL_DEFINITIONS.find(
			(tool) => tool.name === "dynamoi_get_distribution_application",
		)?.description;

		expect(description).toContain("Spotify connection");
		expect(description).toContain("1,000 Spotify followers");
		expect(description).toContain(
			"10,000 verified Soundcharts monthly listeners",
		);
		expect(description).toContain(
			"Facebook Page plus Instagram professional identity",
		);
		expect(description).toContain("connected YouTube channel");
		expect(description).toContain("never guarantees approval");
	});

	test("requires explicit submission confirmation and applicant evidence", () => {
		const valid = {
			adultSignerAttestation: true,
			applicantCountry: "US",
			artistId: ARTIST_ID,
			confirmApplicationSubmission: true,
			payoutCountry: "US",
			taxResidencyCountry: "US",
			userIntentSummary: "Apply this artist for Dynamoi music distribution.",
		};

		expect(
			DynamoiApplyForDistributionInputSchema.safeParse(valid).success,
		).toBe(true);
		expect(
			DynamoiApplyForDistributionInputSchema.safeParse({
				...valid,
				confirmApplicationSubmission: false,
			}).success,
		).toBe(false);
		expect(
			DynamoiApplyForDistributionInputSchema.safeParse({
				...valid,
				adultSignerAttestation: false,
			}).success,
		).toBe(false);
		expect(
			DynamoiApplyForDistributionInputSchema.safeParse({
				...valid,
				userIntentSummary: "",
			}).success,
		).toBe(false);
	});

	test("states that application submission stops before legal and release steps", () => {
		const description = DISTRIBUTION_TOOL_DEFINITIONS.find(
			(tool) => tool.name === "dynamoi_apply_for_distribution",
		)?.description;

		expect(description).toContain("manual review");
		expect(description).toContain("does not approve distribution");
		expect(description).toContain("accept an agreement");
		expect(description).toContain("submit a release");
		expect(description).toContain("deliver music to stores");
	});

	test("exposes a distinct least-privilege distribution identity purpose", () => {
		const input = {
			artistId: ARTIST_ID,
			purpose: "distribution_identity",
			userIntentSummary: "Connect identity for a distribution application.",
		};
		expect(DynamoiStartMetaConnectionInputSchema.safeParse(input).success).toBe(
			true,
		);
		expect(
			DynamoiStartYoutubeChannelLinkInputSchema.safeParse(input).success,
		).toBe(true);
		expect(
			DynamoiStartMetaConnectionInputSchema.safeParse({
				...input,
				purpose: "distribution_delivery",
			}).success,
		).toBe(false);
	});
});
