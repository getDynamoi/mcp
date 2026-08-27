type ProtectedResourceMetadata = {
	authorization_servers: string[];
	bearer_methods_supported: ["header"];
	resource: string;
	resource_documentation?: string;
	scopes_supported: string[];
};

export const DYNAMOI_BETTER_AUTH_MCP_SCOPES = [
	"dynamoi:read",
	"dynamoi:billing.read",
	"dynamoi:campaign.launch",
	"dynamoi:campaign.write",
	"dynamoi:distribution.apply",
	"dynamoi:distribution.read",
	"dynamoi:platform.read",
	"dynamoi:platform.write",
	"dynamoi:smart_links.write",
] as const;
/** @deprecated Use DYNAMOI_BETTER_AUTH_MCP_SCOPES. */
export const DYNAMOI_MCP_SCOPES = DYNAMOI_BETTER_AUTH_MCP_SCOPES;
export const DYNAMOI_MCP_TOOL_SCOPES = {
	dynamoi_create_smart_link_from_spotify: [
		"dynamoi:read",
		"dynamoi:smart_links.write",
	],
	dynamoi_create_smart_links_from_spotify_artist: [
		"dynamoi:read",
		"dynamoi:smart_links.write",
	],
	dynamoi_get_account_overview: ["dynamoi:read"],
	dynamoi_get_artist_analytics: ["dynamoi:read"],
	dynamoi_get_billing: ["dynamoi:read", "dynamoi:billing.read"],
	dynamoi_get_campaign: ["dynamoi:read"],
	dynamoi_get_campaign_readiness: ["dynamoi:read"],
	dynamoi_get_distribution_application: [
		"dynamoi:read",
		"dynamoi:distribution.read",
	],
	dynamoi_get_platform_status: ["dynamoi:read", "dynamoi:platform.read"],
	dynamoi_get_smart_link: ["dynamoi:read"],
	dynamoi_launch_campaign: ["dynamoi:read", "dynamoi:campaign.launch"],
	dynamoi_apply_for_distribution: [
		"dynamoi:read",
		"dynamoi:distribution.apply",
	],
	dynamoi_list_artists: ["dynamoi:read"],
	dynamoi_list_available_countries: ["dynamoi:read"],
	dynamoi_list_campaigns: ["dynamoi:read"],
	dynamoi_list_media_assets: ["dynamoi:read"],
	dynamoi_list_smart_links: ["dynamoi:read"],
	dynamoi_preview_smart_link_themes: ["dynamoi:read"],
	dynamoi_search: ["dynamoi:read"],
	dynamoi_start_meta_connection: ["dynamoi:read", "dynamoi:platform.write"],
	dynamoi_start_youtube_channel_link: [
		"dynamoi:read",
		"dynamoi:platform.write",
	],
	dynamoi_update_campaign: ["dynamoi:read", "dynamoi:campaign.write"],
	dynamoi_update_smart_link: ["dynamoi:read", "dynamoi:smart_links.write"],
	fetch: ["dynamoi:read"],
	search: ["dynamoi:read"],
} as const satisfies Record<string, readonly string[]>;

export function buildProtectedResourceMetadata(options: {
	resource: string;
	authorizationServers: string[];
	resourceDocumentation?: string;
	scopesSupported?: string[];
}): ProtectedResourceMetadata {
	const metadata: ProtectedResourceMetadata = {
		authorization_servers: options.authorizationServers,
		bearer_methods_supported: ["header"],
		resource: options.resource,
		scopes_supported: options.scopesSupported ?? [
			...DYNAMOI_BETTER_AUTH_MCP_SCOPES,
		],
	};
	if (options.resourceDocumentation) {
		metadata.resource_documentation = options.resourceDocumentation;
	}
	return metadata;
}

export function buildWwwAuthenticateHeader(options: {
	resourceMetadataUrl: string;
	errorDescription?: string;
	error?: "insufficient_scope" | "invalid_token";
	scope?: string;
}): string {
	const scope = options.scope ?? "dynamoi:read";
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
	const containsControlCharacter = Array.from(value).some((character) => {
		const codePoint = character.codePointAt(0) ?? 0;
		return codePoint <= 31 || codePoint === 127;
	});
	if (containsControlCharacter) {
		throw new Error(
			"WWW-Authenticate values cannot contain control characters.",
		);
	}
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
