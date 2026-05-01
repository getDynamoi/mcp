type ProtectedResourceMetadata = {
	authorization_servers: string[];
	bearer_methods_supported: ["header"];
	resource: string;
	resource_documentation?: string;
	scopes_supported: string[];
};

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
	error?: "insufficient_scope" | "invalid_token";
	scope?: string;
}): string {
	const scope = options.scope ?? "email profile";
	const error = options.error ? `, error="${options.error}"` : "";
	// RFC 6750 style with resource metadata extension.
	return `Bearer resource_metadata="${options.resourceMetadataUrl}", scope="${scope}"${error}`;
}
