import { describe, expect, test } from "bun:test";
import {
	buildProtectedResourceMetadata,
	buildWwwAuthenticateHeader,
	DYNAMOI_BETTER_AUTH_MCP_SCOPES,
	// biome-ignore lint/suspicious/noDeprecatedImports: This contract test protects the deprecated public alias.
	DYNAMOI_MCP_SCOPES,
} from "./protected-resource";

describe("protected resource metadata", () => {
	test("keeps the public scope alias on the strict Better Auth contract", () => {
		expect(DYNAMOI_MCP_SCOPES).toBe(DYNAMOI_BETTER_AUTH_MCP_SCOPES);
	});

	test("advertises Better Auth resource scopes by default", () => {
		expect(
			buildProtectedResourceMetadata({
				authorizationServers: ["https://dynamoi.com/api/auth"],
				resource: "https://dynamoi.com/mcp",
			}).scopes_supported,
		).toEqual([...DYNAMOI_BETTER_AUTH_MCP_SCOPES]);
	});

	test("includes OAuth error details in WWW-Authenticate challenges", () => {
		expect(
			buildWwwAuthenticateHeader({
				resourceMetadataUrl:
					"https://dynamoi.com/.well-known/oauth-protected-resource",
			}),
		).toBe(
			'Bearer resource_metadata="https://dynamoi.com/.well-known/oauth-protected-resource", scope="dynamoi:read", error="invalid_token", error_description="Sign in to Dynamoi to continue."',
		);

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
				errorDescription: "Sign in\r\nX-Injected: true",
				resourceMetadataUrl:
					"https://dynamoi.com/.well-known/oauth-protected-resource",
			}),
		).toThrow("cannot contain control characters");
	});
});
