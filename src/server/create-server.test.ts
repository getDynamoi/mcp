import { describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import * as z from "zod/v4";
import {
	asTextResult,
	asValidatedTextResult,
	createDynamoiMcpServer,
	type Phase3Adapter,
} from "./create-server";
import { ListMediaAssetsOutputEnvelopeSchema } from "./output-schemas";

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
	test("calls tools whose canonical output schemas are success/error unions", async () => {
		const adapter = {
			search: async () => ({
				data: {
					results: [],
					summary: "No matching records found.",
					totalCount: 0,
				},
				status: "success",
			}),
		} as unknown as Phase3Adapter;
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
				resourceUri:
					"dynamoi://smart-link/11111111-1111-4111-8111-111111111111",
				settingsResourceUri:
					"dynamoi://artist/00000000-0000-0000-0000-000000000000/smart-link-settings",
				spotifyDiscographyId: "22222222-2222-4222-8222-222222222222",
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

		expect(result.content[0]?.text).toContain(
			"Public URL: https://play.dynamoi.com/92-keys/song",
		);
		expect(result.content[0]?.text).not.toContain(
			"11111111-1111-4111-8111-111111111111",
		);
		expect(result.structuredContent).toEqual(envelope);
	});
});
