import { describe, expect, test } from "bun:test";
import {
	DynamoiShopCreateCheckoutInputSchema,
	DynamoiShopGetQuoteInputSchema,
	SHOP_TOOL_DEFINITIONS,
} from "./shop-tools";

const promotion = {
	marketLocale: "en-US",
	selection: { kind: "package" as const, tier: "standard" as const },
	storefrontSlug: "youtube-promotion",
	targeting: { mode: "GLOBAL" as const },
	youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

describe("Shop MCP tool contracts", () => {
	test("keeps pricing and provider authority out of quote input", () => {
		expect(DynamoiShopGetQuoteInputSchema.safeParse(promotion).success).toBe(true);
		expect(
			DynamoiShopGetQuoteInputSchema.safeParse({
				...promotion,
				amountMinor: 1,
			}).success,
		).toBe(false);
		expect(
			DynamoiShopGetQuoteInputSchema.safeParse({
				...promotion,
				currency: "USD",
			}).success,
		).toBe(false);
	});

	test("checkout accepts only a compare-and-reject total plus idempotency id", () => {
		expect(
			DynamoiShopCreateCheckoutInputSchema.safeParse({
				expectedTotal: { amountMinor: 5000, currency: "USD" },
				promotion,
				requestId: "0198f6ac-f544-78ac-a62c-a30f7f69b4a7",
			}).success,
		).toBe(true);
		expect(
			DynamoiShopCreateCheckoutInputSchema.safeParse({
				expectedTotal: { amountMinor: 5000, currency: "USD" },
				paymentMethodConfigurationId: "pmc_untrusted",
				promotion,
				requestId: "0198f6ac-f544-78ac-a62c-a30f7f69b4a7",
			}).success,
		).toBe(false);
	});

	test("marks quote read-only and checkout as an unpaid side-effecting handoff", () => {
		const quote = SHOP_TOOL_DEFINITIONS.find(
			(tool) => tool.name === "dynamoi_shop_get_quote",
		);
		const checkout = SHOP_TOOL_DEFINITIONS.find(
			(tool) => tool.name === "dynamoi_shop_create_checkout",
		);
		expect(quote?.readOnlyHint).toBe(true);
		expect(checkout?.readOnlyHint).toBe(false);
		expect(checkout?.description).toContain("unpaid Stripe Checkout Session");
		expect(checkout?.description).toContain("does not charge the user");
	});
});
