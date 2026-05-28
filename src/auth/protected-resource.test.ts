import { describe, expect, test } from "bun:test";
import {
	buildProtectedResourceMetadata,
	buildWwwAuthenticateHeader,
	DYNAMOI_MCP_SCOPES,
} from "./protected-resource";

describe("protected resource metadata", () => {
	test("advertises only Supabase-supported OAuth scopes by default", () => {
		expect(
			buildProtectedResourceMetadata({
				authorizationServers: ["https://project-ref.supabase.co/auth/v1"],
				resource: "https://dynamoi.com/mcp",
			}).scopes_supported,
		).toEqual([...DYNAMOI_MCP_SCOPES]);
		expect(DYNAMOI_MCP_SCOPES).toEqual(["email", "profile"]);
	});

	test("includes OAuth error details in WWW-Authenticate challenges", () => {
		expect(
			buildWwwAuthenticateHeader({
				resourceMetadataUrl:
					"https://dynamoi.com/.well-known/oauth-protected-resource",
			}),
		).toBe(
			'Bearer resource_metadata="https://dynamoi.com/.well-known/oauth-protected-resource", scope="email profile", error="invalid_token", error_description="Sign in to Dynamoi to continue."',
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
});
