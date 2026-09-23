// Canonical public messaging for the Dynamoi MCP server. Registry metadata
// (package.json and server.json), the public server card, agent discovery
// documents, and docs metadata reuse these strings so the wording cannot drift.

/** Product name for the hosted MCP server. */
export const DYNAMOI_MCP_SERVER_NAME = "Dynamoi MCP Server";

/** One-line tagline. */
export const DYNAMOI_MCP_TAGLINE = "Music marketing for AI agents";

/**
 * Short description. The MCP Registry caps `server.json` descriptions at 100
 * characters, and `package.json` and `server.json` must equal this exactly.
 */
export const DYNAMOI_MCP_SHORT_DESCRIPTION =
	"Music marketing for AI agents: free Smart Links, promotion campaigns, analytics, and distribution.";

/** Standard description for docs metadata, listings, and discovery summaries. */
export const DYNAMOI_MCP_STANDARD_DESCRIPTION =
	"Connect ChatGPT, Claude, Cursor, and other AI agents to Dynamoi for free Spotify Smart Links, music promotion campaigns, analytics, and distribution.";

/** Registry limit for `server.json` descriptions. */
export const DYNAMOI_MCP_REGISTRY_DESCRIPTION_MAX_LENGTH = 100;
