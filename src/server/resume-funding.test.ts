import { describe, expect, test } from "bun:test";
import { DYNAMOI_MCP_TOOL_SCOPES } from "../auth/protected-resource";
import { getDynamoiToolDefinitions } from "./create-server";
import { GetResumeFundingOutputEnvelopeSchema } from "./output-schemas";
import { DynamoiGetResumeFundingInputSchema } from "./tools";

describe("resume funding tool contract", () => {
	test("advertises a read-only billing-scoped tool only in the full profile", () => {
		const definition = getDynamoiToolDefinitions({ toolProfile: "full" }).find(
			(tool) => tool.name === "dynamoi_get_resume_funding",
		);
		expect(definition?.readOnlyHint).toBe(true);
		expect(definition?.destructiveHint).toBe(false);
		expect(DYNAMOI_MCP_TOOL_SCOPES.dynamoi_get_resume_funding).toEqual([
			"dynamoi:read",
			"dynamoi:billing.read",
		]);
		expect(
			getDynamoiToolDefinitions({ toolProfile: "directory" }).some(
				(tool) => tool.name === "dynamoi_get_resume_funding",
			),
		).toBe(false);
	});
	test("refuses consent or mutation fields on a read request", () => {
		expect(
			DynamoiGetResumeFundingInputSchema.safeParse({
				authorizeAutomaticDailyFunding: true,
				campaignId: "00000000-0000-4000-8000-000000000002",
			}).success,
		).toBe(false);
	});
	test("output requires currency, refusal and exact funding evidence", () => {
		const data = {
			appliedCreditsCents: 100,
			budgetCents: 1000,
			consent: null,
			coveredByFundedWindow: true,
			currency: "jpy",
			currencyExponent: 0,
			deliveryWindowCents: 1000,
			firstWindow: false,
			formatted: {
				appliedCredits: "¥100",
				budget: "¥1,000",
				deliveryWindow: "¥1,000",
				netImmediateCharge: "¥0",
			},
			isTotal: false,
			netImmediateChargeCents: 0,
			paymentMethod: null,
			refusal: "credit_review_required",
		};
		expect(
			GetResumeFundingOutputEnvelopeSchema.safeParse({
				data,
				status: "success",
			}).success,
		).toBe(true);
		expect(
			GetResumeFundingOutputEnvelopeSchema.safeParse({
				data: { ...data, currency: undefined },
				status: "success",
			}).success,
		).toBe(false);
		expect(
			GetResumeFundingOutputEnvelopeSchema.safeParse({
				data: { ...data, refusal: "ignore" },
				status: "success",
			}).success,
		).toBe(false);
	});
});
