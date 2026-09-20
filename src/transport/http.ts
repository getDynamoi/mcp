import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { normalizeLegacySmartLinkInclude } from "../server/smart-link-tools";

type HandleOptions = {
	createServer: () => McpServer;
	request: Request;
	parsedBody: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

type NormalizedMcpBody =
	| string
	| number
	| boolean
	| null
	| undefined
	| NormalizedMcpBody[]
	| { [key: string]: unknown };

function normalizeLegacyDynamoiToolCallArguments(
	parsedBody: unknown,
): NormalizedMcpBody {
	if (Array.isArray(parsedBody)) {
		return parsedBody.map((message) =>
			normalizeLegacyDynamoiToolCallArguments(message),
		);
	}
	if (!isRecord(parsedBody)) {
		if (
			parsedBody === null ||
			parsedBody === undefined ||
			typeof parsedBody === "string" ||
			typeof parsedBody === "number" ||
			typeof parsedBody === "boolean"
		) {
			return parsedBody;
		}
		return null;
	}
	if (parsedBody["method"] !== "tools/call") {
		return parsedBody;
	}
	const params = parsedBody["params"];
	if (!isRecord(params) || params["name"] !== "dynamoi_get_smart_link") {
		return parsedBody;
	}
	const normalizedArguments = normalizeLegacySmartLinkInclude(
		params["arguments"],
	);
	if (normalizedArguments === params["arguments"]) {
		return parsedBody;
	}
	return {
		...parsedBody,
		params: {
			...params,
			arguments: normalizedArguments,
		},
	};
}

export async function handleMcpHttpRequest(
	options: HandleOptions,
): Promise<Response> {
	if (options.request.method.toUpperCase() !== "POST") {
		return new Response(
			JSON.stringify({
				error: { code: -32_000, message: "Method not allowed." },
				id: null,
				jsonrpc: "2.0",
			}),
			{
				headers: {
					Allow: "POST",
					"content-type": "application/json",
				},
				status: 405,
			},
		);
	}

	const parsedBody = normalizeLegacyDynamoiToolCallArguments(
		options.parsedBody,
	);

	// CUSTOM INTEROP SHIM (Anthropic MCP SDK vs OpenAI ChatGPT):
	// Why custom code is required here:
	// 1. OpenAI's ChatGPT client backend (Python/3.11 aiohttp) probes MCP discovery by sending `POST /mcp`
	//    with JSON-RPC `{"method": "tools/list"}` and `Accept: application/json`.
	// 2. Anthropic's official `@modelcontextprotocol/sdk` (`WebStandardStreamableHTTPServerTransport:468`)
	//    strictly enforces the MCP transport specification by hardcoding a validation check:
	//    `if (!acceptHeader?.includes('application/json') || !acceptHeader.includes('text/event-stream'))`
	//    returning `HTTP 406 Not Acceptable: Client must accept both application/json and text/event-stream`.
	// 3. Even with `enableJsonResponse: true`, Anthropic's SDK executes this Accept header check
	//    BEFORE switching to JSON response mode.
	// 4. Result: OpenAI's client probe gets rejected with 406 before any OAuth, Better Auth, or tool execution
	//    can take place. OpenAI reviewers see the connection fail during setup and reject it as an "OAuth issue".
	//
	// This shim normalizes the `Accept` header to satisfy Anthropic's SDK validation while preserving
	// JSON response mode for single-result tools. It should be removed once Anthropic's SDK relaxes its
	// Accept validation or OpenAI's client probe advertises `text/event-stream`.
	const accept = options.request.headers.get("accept");
	let effectiveRequest = options.request;

	const needsAcceptNormalization =
		!accept ||
		accept === "*/*" ||
		(accept.includes("application/json") &&
			!accept.includes("text/event-stream"));

	if (needsAcceptNormalization) {
		const headers = new Headers(options.request.headers);
		headers.set("accept", "application/json, text/event-stream");
		const init: RequestInit = {
			headers,
			method: options.request.method,
		};
		// When parsedBody is provided to transport.handleRequest, avoid reading/locking request.body.
		if (
			options.parsedBody === undefined &&
			!options.request.bodyUsed &&
			options.request.body !== null
		) {
			init.body = options.request.body;
		}
		effectiveRequest = new Request(options.request.url, init);
	}

	// Each request owns its transport. MCP sessions are optional, and this helper
	// deliberately does not advertise a reusable session that serverless routing
	// cannot guarantee will reach the same process.
	// These tools return one result and do not emit progress notifications.
	// Prefer the SDK's JSON mode instead of buffering and rewriting SSE frames.
	const transport = new WebStandardStreamableHTTPServerTransport({
		enableJsonResponse: true,
	});

	const server = options.createServer();
	await server.connect(transport);

	return transport.handleRequest(effectiveRequest, {
		parsedBody,
	});
}
