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

describe("DYNAMOI_CHATGPT_APP_INSTRUCTIONS", () => {
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
