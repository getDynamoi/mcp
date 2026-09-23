import { describe, expect, test } from "bun:test";
import { buildWwwAuthenticateHeader } from "./protected-resource";

describe("WWW-Authenticate challenges", () => {
	test("omits error information for the initial OAuth challenge", () => {
		expect(
			buildWwwAuthenticateHeader({
				resourceMetadataUrl:
					"https://dynamoi.com/.well-known/oauth-protected-resource",
			}),
		).toBe(
			'Bearer resource_metadata="https://dynamoi.com/.well-known/oauth-protected-resource", scope="dynamoi:read"',
		);
	});

	test("only includes error information when a caller identifies a token failure", () => {
		expect(
			buildWwwAuthenticateHeader({
				error: "invalid_token",
				resourceMetadataUrl:
					"https://dynamoi.com/.well-known/oauth-protected-resource/mcp",
			}),
		).toContain('error="invalid_token"');

		expect(
			buildWwwAuthenticateHeader({
				error: "insufficient_scope",
				resourceMetadataUrl:
					"https://dynamoi.com/.well-known/oauth-protected-resource",
				scope: "dynamoi:campaign.write",
			}),
		).toBe(
			'Bearer resource_metadata="https://dynamoi.com/.well-known/oauth-protected-resource", scope="dynamoi:campaign.write", error="insufficient_scope", error_description="Additional Dynamoi permissions are required."',
		);
	});

	test("rejects header control characters", () => {
		expect(() =>
			buildWwwAuthenticateHeader({
				error: "invalid_token",
				errorDescription: "Sign in\r\nX-Injected: true",
				resourceMetadataUrl:
					"https://dynamoi.com/.well-known/oauth-protected-resource",
			}),
		).toThrow("cannot contain control characters");
	});
});
