import { describe, expect, mock, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import * as z from "zod/v4";
import { DYNAMOI_BETTER_AUTH_MCP_SCOPES } from "../auth/protected-resource";
import { handleMcpHttpRequest } from "../transport/http";
import { DYNAMOI_MCP_VERSION } from "../version";
import {
	asTextResult,
	asValidatedTextResult,
	createDynamoiMcpServer,
	type Phase3Adapter,
} from "./create-server";
import { DISTRIBUTION_TOOL_DEFINITIONS } from "./distribution-tools";
import { ListMediaAssetsOutputEnvelopeSchema } from "./output-schemas";
import {
	SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
	SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION,
} from "./smart-link-theme-preview";
import { PHASE_4_TOOL_DEFINITIONS } from "./smart-link-tools";
import { SHOP_TOOL_DEFINITIONS } from "./shop-tools";
import {
	PHASE_1_TOOL_DEFINITIONS,
	PHASE_2_TOOL_DEFINITIONS,
	PHASE_ONBOARDING_TOOL_DEFINITIONS,
} from "./tools";
import { PHASE_3_TOOL_DEFINITIONS } from "./workflow-tools";

const REGISTERED_TOOL_DEFINITIONS = [
	...PHASE_1_TOOL_DEFINITIONS,
	...PHASE_ONBOARDING_TOOL_DEFINITIONS,
	...PHASE_2_TOOL_DEFINITIONS,
	...PHASE_3_TOOL_DEFINITIONS,
	...DISTRIBUTION_TOOL_DEFINITIONS,
	...SHOP_TOOL_DEFINITIONS,
	SMART_LINK_THEME_PREVIEW_TOOL_DEFINITION,
	...PHASE_4_TOOL_DEFINITIONS,
];

function buildStubAdapter(
	overrides: Partial<Phase3Adapter> = {},
): Phase3Adapter {
	const unusedAdapterMethod = async () => ({
		message: "Adapter method not used in create-server tests.",
		status: "error" as const,
	});
	return new Proxy(overrides, {
		get: (target, property) =>
			typeof property === "string" && property in target
				? target[property as keyof Phase3Adapter]
				: unusedAdapterMethod,
	}) as Phase3Adapter;
}

describe("asTextResult", () => {
	test("marks tool execution error envelopes as MCP tool errors", () => {
		const result = asTextResult({
			kind: "business",
			message: "Invalid budget",
			status: "error",
		});

		expect(result.isError).toBe(true);
		expect(result.content).toEqual([{ text: "Invalid budget", type: "text" }]);
		expect(result.structuredContent).toEqual({
			kind: "business",
			message: "Invalid budget",
			status: "error",
		});
	});

	test("returns a tool error when a tool result violates its output schema", () => {
		const result = asValidatedTextResult({
			envelope: { data: { id: 123 }, status: "success" },
			outputSchema: z
				.object({
					data: z.object({ id: z.string() }),
					status: z.literal("success"),
				})
				.strict(),
			toolName: "dynamoi_test_tool",
		});

		expect(result.isError).toBe(true);
		expect(result.content).toEqual([
			{
				text: "Tool dynamoi_test_tool returned an invalid result shape.",
				type: "text",
			},
		]);
		expect(result.structuredContent).toEqual({
			kind: "validation",
			message: "Tool dynamoi_test_tool returned an invalid result shape.",
			status: "error",
		});
	});

	test("accepts media asset summary output", () => {
		const result = asValidatedTextResult({
			envelope: {
				data: {
					nextCursor: "cursor-2",
					summary: "2 media assets are available.",
					totalCount: 2,
				},
				status: "success",
			},
			outputSchema: ListMediaAssetsOutputEnvelopeSchema,
			toolName: "dynamoi_list_media_assets",
		});

		expect(result.isError).toBeUndefined();
		expect(result.structuredContent).toEqual({
			data: {
				nextCursor: "cursor-2",
				summary: "2 media assets are available.",
				totalCount: 2,
			},
			status: "success",
		});
	});
});

describe("createDynamoiMcpServer", () => {
	test("registers every public tool definition once", async () => {
		const expectedToolNames = REGISTERED_TOOL_DEFINITIONS.map(
			(definition) => definition.name,
		);
		const server = createDynamoiMcpServer({ adapter: buildStubAdapter() });
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.listTools();

			expect(new Set(expectedToolNames).size).toBe(expectedToolNames.length);
			expect(result.tools.map((tool) => tool.name).sort()).toEqual(
				[...expectedToolNames].sort(),
			);
		} finally {
			await client.close();
		}
	});

	test("uses a concrete MCP server version in source and bundled builds", () => {
		expect(DYNAMOI_MCP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
		expect(DYNAMOI_MCP_VERSION).not.toContain("__");
	});

	test("advertises each tool's least-privilege OAuth scopes", async () => {
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter(),
			oauthScopes: DYNAMOI_BETTER_AUTH_MCP_SCOPES,
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.listTools();
			const scopesFor = (toolName: string) =>
				result.tools.find((tool) => tool.name === toolName)?._meta?.[
					"securitySchemes"
				];
			expect(scopesFor("search")).toEqual([
				{ scopes: ["dynamoi:read"], type: "oauth2" },
			]);
			expect(scopesFor("dynamoi_shop_get_quote")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:mcp.full"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_shop_create_checkout")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:mcp.full"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_get_billing")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:billing.read"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_launch_campaign")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:campaign.launch"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_get_distribution_application")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:distribution.read"],
					type: "oauth2",
				},
			]);
			expect(scopesFor("dynamoi_apply_for_distribution")).toEqual([
				{
					scopes: ["dynamoi:read", "dynamoi:distribution.apply"],
					type: "oauth2",
				},
			]);
		} finally {
			await client.close();
		}
	});

	test("chatgpt-app profile omits paid launch, billing, and connection-start tools", async () => {
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter(),
			toolProfile: "chatgpt-app",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.listTools();
			const toolNames = result.tools.map((tool) => tool.name);

			expect(toolNames).toHaveLength(17);
			expect(toolNames).toContain("dynamoi_create_smart_link_from_spotify");
			expect(toolNames).toContain(
				"dynamoi_create_smart_links_from_spotify_artist",
			);
			expect(toolNames).toContain("dynamoi_get_campaign");
			expect(toolNames).toContain("dynamoi_get_distribution_application");
			expect(toolNames).toContain("dynamoi_apply_for_distribution");
			expect(toolNames).toContain("dynamoi_preview_smart_link_themes");
			expect(toolNames).not.toContain("dynamoi_shop_get_quote");
			expect(toolNames).not.toContain("dynamoi_shop_create_checkout");
			expect(toolNames).not.toContain("dynamoi_get_billing");
			expect(toolNames).not.toContain("dynamoi_get_campaign_readiness");
			expect(toolNames).not.toContain("dynamoi_launch_campaign");
			expect(toolNames).not.toContain("dynamoi_start_meta_connection");
			expect(toolNames).not.toContain("dynamoi_start_youtube_channel_link");
			expect(toolNames).not.toContain("dynamoi_update_campaign");
			const chatGptDescriptions = result.tools
				.map((tool) => tool.description ?? "")
				.join("\n");
			expect(chatGptDescriptions).not.toContain("dynamoi_get_billing");
			expect(chatGptDescriptions).not.toContain(
				"dynamoi_get_campaign_readiness",
			);
			expect(chatGptDescriptions).not.toContain(
				"dynamoi_start_meta_connection",
			);
			expect(chatGptDescriptions).not.toContain(
				"dynamoi_start_youtube_channel_link",
			);
			expect(chatGptDescriptions).not.toContain("dynamoi://");
			for (const tool of result.tools) {
				const outputProperties = tool.outputSchema?.properties as
					| Record<string, { anyOf?: unknown[]; properties?: unknown }>
					| undefined;
				const dataSchema = outputProperties?.data;
				expect(
					Boolean(dataSchema?.properties) ||
						(dataSchema?.anyOf?.length ?? 0) > 0,
				).toBe(true);
			}

			const getSmartLink = result.tools.find(
				(tool) => tool.name === "dynamoi_get_smart_link",
			);
			const getSmartLinkProperties = getSmartLink?.inputSchema?.properties as
				| Record<string, unknown>
				| undefined;
			expect(getSmartLinkProperties?.playLinkId).toMatchObject({
				type: "string",
			});
			expect(getSmartLinkProperties?.includeAnalytics).toEqual({
				type: "boolean",
			});
			expect(getSmartLinkProperties?.includeArtistSettings).toEqual({
				type: "boolean",
			});
			expect(getSmartLinkProperties?.include).toBeUndefined();
		} finally {
			await client.close();
		}
	});

	test("chatgpt-app profile advertises the Smart Link theme preview widget", async () => {
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter(),
			toolProfile: "chatgpt-app",
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const tools = await client.listTools();
			const previewTool = tools.tools.find(
				(tool) => tool.name === "dynamoi_preview_smart_link_themes",
			) as
				| ((typeof tools.tools)[number] & { _meta?: Record<string, unknown> })
				| undefined;
			expect(previewTool?._meta?.["openai/outputTemplate"]).toBe(
				SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
			);
			expect(previewTool?._meta?.ui).toEqual({
				resourceUri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
			});

			const resource = await client.readResource({
				uri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
			});
			expect(resource.contents).toHaveLength(1);
			expect(resource.contents[0]).toMatchObject({
				_meta: {
					ui: {
						csp: {
							connectDomains: [],
							resourceDomains: [],
						},
						domain: "https://dynamoi.com",
						prefersBorder: true,
					},
				},
				mimeType: "text/html;profile=mcp-app",
				uri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
			});
			const widgetHtml = resource.contents[0]?.text;
			expect(widgetHtml).toContain("Smart Link themes");
			expect(widgetHtml).not.toContain(".innerHTML");

			const result = await client.callTool({
				arguments: {
					artistName: "92 Keys",
					releaseTitle: "Demo Review Single",
				},
				name: "dynamoi_preview_smart_link_themes",
			});
			expect(result.structuredContent).toMatchObject({
				data: {
					artistName: "92 Keys",
					releaseTitle: "Demo Review Single",
					themes: [
						{ id: "classic", name: "Classic" },
						{ id: "brutalist", name: "Brutalist" },
						{ id: "aurora", name: "Aurora" },
						{ id: "cinematic", name: "Cinematic" },
					],
					widgetResourceUri: SMART_LINK_THEME_PREVIEW_RESOURCE_URI,
				},
				status: "success",
			});
		} finally {
			await client.close();
		}
	});

	test("normalizes legacy Smart Link include arrays before HTTP tool validation", async () => {
		let receivedInput: unknown;
		const requestBody = {
			id: 1,
			jsonrpc: "2.0",
			method: "tools/call",
			params: {
				arguments: {
					include: ["analytics"],
					playLinkId: "22222222-2222-4222-8222-222222222222",
				},
				name: "dynamoi_get_smart_link",
			},
		};

		const response = await handleMcpHttpRequest({
			createServer: () =>
				createDynamoiMcpServer({
					adapter: buildStubAdapter({
						getSmartLink: async (input) => {
							receivedInput = input;
							return {
								data: { summary: "Smart Link details loaded." },
								status: "success",
							};
						},
					}),
					toolProfile: "chatgpt-app",
				}),
			parsedBody: requestBody,
			request: new Request("http://example.com/mcp", {
				body: JSON.stringify(requestBody),
				headers: {
					accept: "application/json, text/event-stream",
					"content-type": "application/json",
				},
				method: "POST",
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toContain("Smart Link details loaded.");
		expect(receivedInput).toEqual(
			expect.objectContaining({ includeAnalytics: true }),
		);
		expect((receivedInput as Record<string, unknown>).include).toBeUndefined();
	});

	test("calls tools whose canonical output schemas are success/error unions", async () => {
		const adapter = buildStubAdapter({
			search: async () => ({
				data: {
					results: [],
					summary: "No matching records found.",
					totalCount: 0,
				},
				status: "success",
			}),
		});
		const server = createDynamoiMcpServer({ adapter });
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			const result = await client.callTool({
				arguments: {
					format: "summary",
					limit: 10,
					query: "92 Keys",
					type: "artist",
				},
				name: "dynamoi_search",
			});

			expect(result.isError).toBeUndefined();
			expect(result.content).toEqual([
				{ text: "No matching records found.", type: "text" },
			]);
			expect(result.structuredContent).toEqual({
				data: {
					results: [],
					summary: "No matching records found.",
					totalCount: 0,
				},
				status: "success",
			});
		} finally {
			await client.close();
		}
	});

	test("observes each registered tool call once with its canonical name", async () => {
		const onToolCall = mock(async () => undefined);
		const server = createDynamoiMcpServer({
			adapter: buildStubAdapter({
				search: async () => ({
					data: { results: [], summary: "No results.", totalCount: 0 },
					status: "success",
				}),
			}),
			onToolCall,
		});
		const client = new Client({ name: "test-client", version: "1.0.0" });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		try {
			await client.callTool({
				arguments: { query: "92 Keys", type: "artist" },
				name: "dynamoi_search",
			});

			expect(onToolCall).toHaveBeenCalledTimes(1);
			expect(onToolCall).toHaveBeenCalledWith(
				expect.objectContaining({
					result: expect.objectContaining({ status: "success" }),
					toolName: "dynamoi_search",
				}),
			);
		} finally {
			await client.close();
		}
	});

	test("uses Smart Link summaries as URL-first text while keeping IDs structured", () => {
		const envelope = {
			data: {
				actionRequired: [],
				artistHubUrl: "https://play.dynamoi.com/92-keys",
				artistId: "00000000-0000-0000-0000-000000000000",
				artistName: "92 Keys",
				claimStatus: "auto_approved",
				createdAt: "2026-05-01T00:00:00.000Z",
				customDescription: null,
				id: "11111111-1111-4111-8111-111111111111",
				isPublic: true,
				localizedPublicUrls: [],
				nextActions: [],
				odesliStatus: "resolved",
				originalSpotifyUrl: "https://open.spotify.com/track/abc",
				publicUrl: "https://play.dynamoi.com/92-keys/song",
				publishState: "published",
				releaseSlug: "song",
				releaseTitle: "Song",
				releaseType: "track",
				renderState: "rendered",
				spotifyUrl: "https://open.spotify.com/track/abc",
				summary: [
					"# Song",
					"Artist: 92 Keys",
					"Public URL: https://play.dynamoi.com/92-keys/song",
					"Status: public",
				].join("\n"),
				takedownStatus: "none",
				theme: "classic",
				updatedAt: "2026-05-01T00:00:00.000Z",
			},
			status: "success",
		};

		const result = asTextResult(envelope);

		expect(result.content[0].text).toContain(
			"Public URL: https://play.dynamoi.com/92-keys/song",
		);
		expect(result.content[0].text).not.toContain(
			"11111111-1111-4111-8111-111111111111",
		);
		expect(result.structuredContent).toEqual(envelope);
	});
});
