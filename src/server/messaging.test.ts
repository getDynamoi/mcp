import { describe, expect, test } from "bun:test";
import packageJson from "../../package.json" with { type: "json" };
import serverJson from "../../server.json" with { type: "json" };
import {
	DYNAMOI_MCP_REGISTRY_DESCRIPTION_MAX_LENGTH,
	DYNAMOI_MCP_SHORT_DESCRIPTION,
	DYNAMOI_MCP_STANDARD_DESCRIPTION,
	DYNAMOI_MCP_TAGLINE,
} from "./messaging";

describe("Dynamoi MCP canonical messaging", () => {
	test("short description fits the MCP Registry limit", () => {
		expect(
			Array.from(DYNAMOI_MCP_SHORT_DESCRIPTION).length,
		).toBeLessThanOrEqual(DYNAMOI_MCP_REGISTRY_DESCRIPTION_MAX_LENGTH);
		expect(DYNAMOI_MCP_REGISTRY_DESCRIPTION_MAX_LENGTH).toBe(100);
	});

	test("package.json and server.json descriptions equal the short description", () => {
		expect(packageJson.description).toBe(DYNAMOI_MCP_SHORT_DESCRIPTION);
		expect(serverJson.description).toBe(DYNAMOI_MCP_SHORT_DESCRIPTION);
	});

	test("short description starts with the tagline", () => {
		expect(
			DYNAMOI_MCP_SHORT_DESCRIPTION.startsWith(`${DYNAMOI_MCP_TAGLINE}:`),
		).toBe(true);
	});

	test("canonical copy follows the term rules", () => {
		for (const copy of [
			DYNAMOI_MCP_SHORT_DESCRIPTION,
			DYNAMOI_MCP_STANDARD_DESCRIPTION,
		]) {
			expect(copy).toContain("Smart Links");
			expect(copy).toContain("promotion campaigns");
			expect(copy).toContain("AI agents");
			expect(copy).toContain(", and ");
			expect(copy).not.toMatch(/smart links|Smart links/u);
		}
	});
});
