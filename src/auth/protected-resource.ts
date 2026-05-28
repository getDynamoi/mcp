type ProtectedResourceMetadata = {
	authorization_servers: string[];
	bearer_methods_supported: ["header"];
	resource: string;
	resource_documentation?: string;
	scopes_supported: string[];
};

// Supabase OAuth Server currently rejects custom resource scopes, so the public
// MCP auth contract advertises only the standard identity scopes it can mint.
export const DYNAMOI_MCP_SCOPES = ["email", "profile"] as const;

export function buildProtectedResourceMetadata(options: {
	resource: string;
	authorizationServers: string[];
	resourceDocumentation?: string;
	scopesSupported?: string[];
}): ProtectedResourceMetadata {
	return {
		authorization_servers: options.authorizationServers,
		bearer_methods_supported: ["header"],
		resource: options.resource,
		...(options.resourceDocumentation
			? { resource_documentation: options.resourceDocumentation }
			: {}),
		// Supabase OAuth Server (beta) can fail token exchange when `openid` is requested
		// (it attempts to mint an ID token). Our MCP only needs an access token.
		scopes_supported: options.scopesSupported ?? [...DYNAMOI_MCP_SCOPES],
	};
}

export function buildWwwAuthenticateHeader(options: {
	resourceMetadataUrl: string;
	errorDescription?: string;
	error?: "insufficient_scope" | "invalid_token";
	scope?: string;
}): string {
	const scope = options.scope ?? "email profile";
	const error = options.error ?? "invalid_token";
	const errorDescription =
		options.errorDescription ??
		(error === "insufficient_scope"
			? "Additional Dynamoi permissions are required."
			: "Sign in to Dynamoi to continue.");
	const params = [
		`resource_metadata="${escapeHeaderValue(options.resourceMetadataUrl)}"`,
		`scope="${escapeHeaderValue(scope)}"`,
		`error="${escapeHeaderValue(error)}"`,
		`error_description="${escapeHeaderValue(errorDescription)}"`,
	];
	// RFC 6750 style with resource metadata extension.
	return `Bearer ${params.join(", ")}`;
}

function escapeHeaderValue(value: string): string {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
