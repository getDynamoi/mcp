import { describe, expect, test } from "bun:test";
import {
	DYNAMOI_CHATGPT_APP_INSTRUCTIONS,
	DYNAMOI_MCP_INSTRUCTIONS,
} from "./instructions";

describe("DYNAMOI_MCP_INSTRUCTIONS", () => {
	test("includes the session-start routing routine", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain("Session Start Routine");
	});

	test("uses account overview only when orientation is needed", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"Use dynamoi_get_account_overview for an explicit account overview, uncertain account context, or onboarding guidance.",
		);
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"When the request already identifies the relevant artist, campaign, or Smart Link, use the targeted tool directly.",
		);
		expect(DYNAMOI_MCP_INSTRUCTIONS).not.toContain(
			"call dynamoi_get_account_overview first to learn the user's state",
		);
	});

	test("references all four persona playbook resource URIs", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"dynamoi://playbooks/spotify-artist",
		);
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"dynamoi://playbooks/youtube-creator",
		);
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"dynamoi://playbooks/label-or-manager",
		);
	});

	test("preserves empty-account guidance without forcing an orientation detour", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"For a known empty account, use account overview to explain supported onboarding.",
		);
		expect(DYNAMOI_MCP_INSTRUCTIONS).not.toContain(
			"Always go through dynamoi_get_account_overview first.",
		);
	});

	test("keeps transient Meta billing checks retryable", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"If it returns billing_check_unavailable, retry shortly instead of treating the user as unpaid.",
		);
	});

	// The USD minimums live in the pricing resource; the instructions must send
	// agents to the selected artist's response so a fixed USD example is never
	// read as a limit in another currency.
	test("defers budget minimums to the selected artist's response", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"Read budget minimums and caps from the selected artist’s readiness or budget-policy response. Fixed USD examples are not limits for other currencies.",
		);
		expect(DYNAMOI_MCP_INSTRUCTIONS).not.toContain("Budget minimums: $");
	});

	test("documents the full-profile Shop checkout boundary", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"dynamoi_shop_get_quote → explicit user confirmation → dynamoi_shop_create_checkout",
		);
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"no Shop order exists until Dynamoi verifies settlement",
		);
	});

	test("preserves the existing principles block after the routine", () => {
		const routineEnd = DYNAMOI_MCP_INSTRUCTIONS.indexOf(
			"=== End Session Start Routine ===",
		);
		expect(routineEnd).toBeGreaterThan(0);
		const tail = DYNAMOI_MCP_INSTRUCTIONS.slice(routineEnd);
		expect(tail).toContain("Principles:");
		expect(tail).toContain("Common workflows:");
	});
});

describe("ad network vocabulary", () => {
	for (const [name, instructions] of [
		["MCP", DYNAMOI_MCP_INSTRUCTIONS],
		["ChatGPT", DYNAMOI_CHATGPT_APP_INSTRUCTIONS],
	] as const) {
		test(`${name} instructions steer agents to say "the ad network"`, () => {
			expect(instructions).toContain(
				'When reporting to users, say "the ad network" (you may name Google once; do not repeat "Google Ads"',
			);
		});
		test(`${name} instructions do not call every non-advertising view organic`, () => {
			expect(instructions).toContain("campaign-period lift");
			expect(instructions).toContain("organic lift");
			expect(instructions).toContain(
				"Never call all non-ADVERTISING views organic",
			);
			expect(instructions).not.toContain('"paid views"');
		});
	}
});

describe("DYNAMOI_CHATGPT_APP_INSTRUCTIONS", () => {
	test("names the single-purpose Smart Link update tools", () => {
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).toContain(
			"dynamoi_update_smart_link_description",
		);
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).toContain(
			"dynamoi_update_smart_link_artist_settings",
		);
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).not.toContain(
			"dynamoi_update_smart_link with action=",
		);
	});

	test("uses targeted reads when the request already identifies a resource", () => {
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).toContain(
			"If the request identifies the artist, campaign,",
		);
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).toContain(
			"or Smart Link, use its targeted read directly;",
		);
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).not.toContain(
			"For account questions, use dynamoi_get_account_overview first.",
		);
	});

	test("keeps roster and search calls for identity resolution", () => {
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).toContain(
			"resolve missing or ambiguous",
		);
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).toContain(
			"identity with the relevant roster or search tool first.",
		);
		expect(DYNAMOI_CHATGPT_APP_INSTRUCTIONS).toContain(
			"dynamoi_list_campaigns to resolve a missing or ambiguous campaign",
		);
	});
});

describe("YouTube channel data qualifications", () => {
	for (const [name, instructions] of [
		["MCP", DYNAMOI_MCP_INSTRUCTIONS],
		["ChatGPT", DYNAMOI_CHATGPT_APP_INSTRUCTIONS],
	] as const) {
		test(`${name} preserves channel data evidence and sample limitations`, () => {
			expect(instructions).not.toContain("observed channel data");
			expect(instructions).toContain(
				"Preserve the returned source, coverage, freshness, and synthetic/sample qualifications",
			);
			expect(instructions).toContain(
				"do not treat synthetic/sample data as observed channel results, campaign attribution, or actual earnings/payouts.",
			);
			expect(instructions).toContain(
				"Treat returned ad revenue as estimated revenue, not an AdSense payout.",
			);
		});
	}
});
