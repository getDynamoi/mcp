type ProtectedResourceMetadata = {
	resource: string;
	authorization_servers: string[];
	scopes_supported: string[];
};

export function buildProtectedResourceMetadata(options: {
	resource: string;
	authorizationServers: string[];
	scopesSupported?: string[];
}): ProtectedResourceMetadata {
	return {
		authorization_servers: options.authorizationServers,
		resource: options.resource,
		// Supabase OAuth Server (beta) can fail token exchange when `openid` is requested
		// (it attempts to mint an ID token). Our MCP only needs an access token.
		scopes_supported: options.scopesSupported ?? ["email", "profile"],
	};
}

export function buildWwwAuthenticateHeader(options: {
	resourceMetadataUrl: string;
	scope?: string;
}): string {
	const scope = options.scope ?? "email profile";
	// RFC 6750 style with resource metadata extension.
	return `Bearer resource_metadata="${options.resourceMetadataUrl}", scope="${scope}"`;
}
