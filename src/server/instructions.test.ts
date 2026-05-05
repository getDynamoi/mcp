import { describe, expect, test } from "bun:test";
import { DYNAMOI_MCP_INSTRUCTIONS } from "./instructions";

describe("DYNAMOI_MCP_INSTRUCTIONS", () => {
	test("includes the session-start routing routine", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain("Session Start Routine");
	});

	test("instructs the agent to call dynamoi_get_account_overview first", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"call dynamoi_get_account_overview first",
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

	test("warns against calling list_artists or search as a first step for new users", () => {
		expect(DYNAMOI_MCP_INSTRUCTIONS).toContain(
			"Do NOT call dynamoi_list_artists or dynamoi_search as a first step for brand-new users",
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
