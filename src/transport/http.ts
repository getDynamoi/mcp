import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

type HandleOptions = {
	createServer: () => McpServer;
	request: Request;
	parsedBody: unknown;
};

type TransportEntry = {
	createdAtMs: number;
	lastUsedAtMs: number;
	transport: WebStandardStreamableHTTPServerTransport;
};

// Best-effort in-memory session reuse.
// On serverless this may not persist, but it still helps in dev and long-lived nodes.
const transports = new Map<string, TransportEntry>();

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_SESSIONS = 250;

function cleanupTransports(nowMs: number) {
	// TTL eviction
	for (const [sid, entry] of transports.entries()) {
		const expired = nowMs - entry.lastUsedAtMs > SESSION_TTL_MS;
		if (expired) {
			transports.delete(sid);
		}
	}

	// Size eviction (oldest by last-used, best-effort)
	if (transports.size > MAX_SESSIONS) {
		const entries = Array.from(transports.entries()).sort(
			(a, b) => a[1].lastUsedAtMs - b[1].lastUsedAtMs,
		);
		const over = transports.size - MAX_SESSIONS;
		for (let i = 0; i < over; i += 1) {
			const sid = entries[i]?.[0];
			if (sid) {
				transports.delete(sid);
			}
		}
	}
}

function getHeader(request: Request, name: string): string | null {
	const value = request.headers.get(name);
	return value && value.trim().length > 0 ? value : null;
}

export async function handleMcpHttpRequest(
	options: HandleOptions,
): Promise<Response> {
	const nowMs = Date.now();
	cleanupTransports(nowMs);

	const sessionId = getHeader(options.request, "mcp-session-id");
	const existing = sessionId ? transports.get(sessionId) : undefined;

	if (existing) {
		existing.lastUsedAtMs = nowMs;
		const response = await existing.transport.handleRequest(options.request, {
			parsedBody: options.parsedBody,
		});
		// Streamable HTTP uses DELETE to close a session.
		if (options.request.method.toUpperCase() === "DELETE" && sessionId) {
			transports.delete(sessionId);
		}
		return response;
	}

	// Create a new transport per request. If the request is an initialize call,
	// we attach a session ID generator so clients that support sessions can reuse it.
	const isInit = isInitializeRequest(options.parsedBody);
	const transport = new WebStandardStreamableHTTPServerTransport({
		onsessioninitialized: (sid) => {
			transports.set(sid, {
				createdAtMs: nowMs,
				lastUsedAtMs: nowMs,
				transport,
			});
			cleanupTransports(Date.now());
		},
		sessionIdGenerator: isInit ? () => randomUUID() : undefined,
	});

	const server = options.createServer();
	await server.connect(transport);

	return transport.handleRequest(options.request, {
		parsedBody: options.parsedBody,
	});
}
