import { describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
	createDynamoiMcpServer,
	type DynamoiMcpToolProfile,
	getDynamoiToolDefinitions,
	type Phase3Adapter,
} from "../src/server/create-server";

type Observer = NonNullable<
	Parameters<typeof createDynamoiMcpServer>[0]["onToolCall"]
>;
type Observation = Parameters<Observer>[0];

/** Package-boundary fixture only: this does not test the app's auth or domains. */
async function withFixture(
	profile: DynamoiMcpToolProfile,
	envelope: unknown,
	body: (fixture: {
		client: Client;
		observations: Observation[];
		adapterCalls: string[];
	}) => Promise<void>,
	observerThrows = false,
	options: {
		adapterMethod?: string;
		arguments?: Record<string, unknown>;
	} = {},
): Promise<void> {
	const observations: Observation[] = [];
	const adapterCalls: string[] = [];
	const adapterMethod = options.adapterMethod ?? "listArtists";
	// The deliberate test-only cast permits malformed provider output injection.
	// There are no imports of the private adapter, database, or provider clients.
	const adapter = new Proxy({} as Phase3Adapter, {
		get(_target, key) {
			return async () => {
				adapterCalls.push(String(key));
				if (String(key) !== adapterMethod) {
					throw new Error(`Unexpected fixture adapter call: ${String(key)}`);
				}
				return structuredClone(envelope);
			};
		},
	});
	const server = createDynamoiMcpServer({
		adapter,
		onToolCall(observation) {
			observations.push(structuredClone(observation));
			if (observerThrows) {
				throw new Error("Simulated telemetry failure");
			}
		},
		toolProfile: profile,
	});
	const client = new Client({
		name: "dynamoi-contract-test",
		version: "0.0.0",
	});
	const [clientTransport, serverTransport] =
		InMemoryTransport.createLinkedPair();
	try {
		await server.connect(serverTransport);
		await client.connect(clientTransport);
		await body({ adapterCalls, client, observations });
	} finally {
		await client.close();
		await server.close();
	}
}

const success = {
	data: { artists: [], summary: "No fixture artists.", totalCount: 0 },
	status: "success",
};
const denied = {
	kind: "business",
	message: "Fixture account is read-only.",
	status: "error",
};

for (const profile of ["full", "chatgpt-app"] as const) {
	describe(`public outcome boundary: ${profile}`, () => {
		test("discovery uses the registered inventory without dispatch", async () => {
			await withFixture(
				profile,
				success,
				async ({ client, adapterCalls, observations }) => {
					const { tools } = await client.listTools();
					const actual = tools.map((tool) => tool.name).sort();
					const expected = getDynamoiToolDefinitions({ toolProfile: profile })
						.map((tool) => tool.name)
						.sort();
					expect(actual).toEqual(expected);
					expect(new Set(actual).size).toBe(actual.length);
					expect(adapterCalls).toHaveLength(0);
					expect(observations).toHaveLength(0);
				},
			);
		});

		test("valid output and the observer receive the same envelope", async () => {
			await withFixture(
				profile,
				success,
				async ({ client, adapterCalls, observations }) => {
					const result = await client.callTool({
						arguments: {},
						name: "dynamoi_list_artists",
					});
					expect(result.isError).not.toBe(true);
					expect(result.structuredContent).toEqual(success);
					expect(adapterCalls).toEqual(["listArtists"]);
					expect(observations).toHaveLength(1);
					expect(observations[0]?.result).toEqual(result.structuredContent);
					expect(observations[0]?.toolName).toBe("dynamoi_list_artists");
				},
			);
		});

		test("invalid nominal success is observed as the returned validation error", async () => {
			await withFixture(
				profile,
				{ status: "success" },
				async ({ client, observations }) => {
					const result = await client.callTool({
						arguments: {},
						name: "dynamoi_list_artists",
					});
					expect(result.isError).toBe(true);
					expect(result.structuredContent).toMatchObject({
						kind: "validation",
						status: "error",
					});
					expect(observations).toHaveLength(1);
					expect(observations[0]?.result).toEqual(result.structuredContent);
				},
			);
		});

		test("ordinary domain error keeps its result and one observation", async () => {
			await withFixture(profile, denied, async ({ client, observations }) => {
				const result = await client.callTool({
					arguments: {},
					name: "dynamoi_list_artists",
				});
				expect(result.isError).toBe(true);
				expect(result.structuredContent).toEqual(denied);
				expect(observations).toHaveLength(1);
				expect(observations[0]?.result).toEqual(result.structuredContent);
			});
		});

		test("adapter-independent preview emits one finalized observer envelope", async () => {
			await withFixture(
				profile,
				success,
				async ({ client, adapterCalls, observations }) => {
					const result = await client.callTool({
						arguments: {
							artistName: "Fixture Artist",
							releaseTitle: "Fixture Single",
						},
						name: "dynamoi_preview_smart_link_themes",
					});
					expect(result.isError).not.toBe(true);
					expect(result.structuredContent).toMatchObject({
						data: {
							artistName: "Fixture Artist",
							releaseTitle: "Fixture Single",
							themes: expect.any(Array),
						},
						status: "success",
					});
					expect(adapterCalls).toHaveLength(0);
					expect(observations).toHaveLength(1);
					expect(observations[0]?.toolName).toBe(
						"dynamoi_preview_smart_link_themes",
					);
					expect(observations[0]?.result).toEqual(result.structuredContent);
				},
			);
		});

		test("dispatcher failures survive a throwing observer", async () => {
			await withFixture(
				profile,
				success,
				async ({ client, observations }) => {
					const result = await client.callTool({
						arguments: {},
						name: "dynamoi_list_artists",
					});
					expect(result.isError).toBe(true);
					expect(result.content).toEqual([
						{
							text: "Unexpected fixture adapter call: listArtists",
							type: "text",
						},
					]);
					expect(observations).toHaveLength(1);
					expect(observations[0]?.error).toMatchObject({
						message: "Unexpected fixture adapter call: listArtists",
					});
				},
				true,
				{ adapterMethod: "fixtureMethodThatMustNotRun" },
			);
		});

		test("classifies the exact reviewer denial as nonretryable", async () => {
			await withFixture(
				profile,
				{
					kind: "business",
					message: "Reviewer accounts are read-only in MCP.",
					status: "error",
				},
				async ({ client, observations }) => {
					const result = await client.callTool({
						arguments: {
							action: "update_description",
							clientRequestId: "11111111-1111-4111-8111-111111111111",
							customDescription: "Updated copy",
							playLinkId: "22222222-2222-4222-8222-222222222222",
						},
						name: "dynamoi_update_smart_link",
					});
					expect(result.structuredContent).toEqual({
						code: "ACCOUNT_READ_ONLY",
						kind: "business",
						message: "Reviewer accounts are read-only in MCP.",
						nextAction: {
							kind: "handoff",
							reason: "Use an authorized non-reviewer account for this write.",
						},
						prerequisite:
							"A non-reviewer account with write access is required.",
						retryable: false,
						status: "error",
					});
					expect(observations[0]?.result).toEqual(result.structuredContent);
				},
				false,
				{
					adapterMethod: "updateSmartLink",
				},
			);
		});

		test("classifies an exact Spotify source rejection with its input field", async () => {
			await withFixture(
				profile,
				{
					kind: "business",
					message: "Paste a valid Spotify artist, album, or track URL.",
					status: "error",
				},
				async ({ client, observations }) => {
					const result = await client.callTool({
						arguments: {
							artistId: "00000000-0000-0000-0000-000000000000",
							spotifyUrl: "not-a-spotify-url",
						},
						name: "dynamoi_create_smart_link_from_spotify",
					});
					expect(result.structuredContent).toEqual({
						code: "INVALID_SPOTIFY_SOURCE",
						field: "spotifyUrl",
						kind: "business",
						message: "Paste a valid Spotify artist, album, or track URL.",
						nextAction: {
							field: "spotifyUrl",
							kind: "provide_input",
							reason: "Provide a public Spotify artist, album, or track URL.",
						},
						prerequisite:
							"Provide a public Spotify artist, album, or track URL.",
						retryable: false,
						status: "error",
					});
					expect(observations[0]?.result).toEqual(result.structuredContent);
				},
				false,
				{
					adapterMethod: "createSmartLinkFromSpotify",
					arguments: {
						artistId: "00000000-0000-0000-0000-000000000000",
						spotifyUrl: "not-a-spotify-url",
					},
				},
			);
		});

		test("classifies an exact catalog source rejection with the artist URL field", async () => {
			await withFixture(
				profile,
				{
					kind: "business",
					message:
						"Use a Spotify artist URL for full-catalog Smart Link import. For album or track URLs, use dynamoi_create_smart_link_from_spotify.",
					status: "error",
				},
				async ({ client, observations }) => {
					const result = await client.callTool({
						arguments: {
							artistId: "00000000-0000-0000-0000-000000000000",
							spotifyArtistUrl: "https://open.spotify.com/track/abc",
						},
						name: "dynamoi_create_smart_links_from_spotify_artist",
					});
					expect(result.structuredContent).toMatchObject({
						code: "INVALID_SPOTIFY_SOURCE",
						field: "spotifyArtistUrl",
						nextAction: {
							field: "spotifyArtistUrl",
							kind: "provide_input",
						},
						retryable: false,
						status: "error",
					});
					expect(observations[0]?.result).toEqual(result.structuredContent);
				},
				false,
				{
					adapterMethod: "createSmartLinksFromSpotifyArtist",
					arguments: {
						artistId: "00000000-0000-0000-0000-000000000000",
						spotifyArtistUrl: "https://open.spotify.com/track/abc",
					},
				},
			);
		});

		test("classifies stale Smart Link state without suggesting an unchanged retry", async () => {
			await withFixture(
				profile,
				{
					kind: "business",
					message:
						"Smart Link changed since it was last read. Read it again before updating.",
					status: "error",
				},
				async ({ client, observations }) => {
					const result = await client.callTool({
						arguments: {
							action: "update_description",
							clientRequestId: "11111111-1111-4111-8111-111111111111",
							customDescription: "Updated copy",
							expectedUpdatedAt: "2026-05-01T00:00:00.000Z",
							playLinkId: "22222222-2222-4222-8222-222222222222",
						},
						name: "dynamoi_update_smart_link",
					});
					expect(result.structuredContent).toEqual({
						code: "STATE_CONFLICT",
						field: "expectedUpdatedAt",
						kind: "business",
						message:
							"Smart Link changed since it was last read. Read it again before updating.",
						nextAction: {
							kind: "read_status",
							reason:
								"Read the existing Smart Link again, then resubmit only with its current state.",
						},
						prerequisite: "Read the Smart Link before updating it.",
						retryable: false,
						status: "error",
					});
					expect(observations[0]?.result).toEqual(result.structuredContent);
				},
				false,
				{
					adapterMethod: "updateSmartLink",
					arguments: {
						action: "update_description",
						clientRequestId: "11111111-1111-4111-8111-111111111111",
						customDescription: "Updated copy",
						expectedUpdatedAt: "2026-05-01T00:00:00.000Z",
						playLinkId: "22222222-2222-4222-8222-222222222222",
					},
				},
			);
		});

		if (profile === "full") {
			test("classifies the source-backed Shop quote conflict with renewed confirmation guidance", async () => {
				await withFixture(
					profile,
					{
						kind: "business",
						message:
							"The Shop quote changed. Get a new quote before creating checkout.",
						status: "error",
					},
					async ({ client, observations }) => {
						const result = await client.callTool({
							arguments: {
								expectedTotal: { amountMinor: 5000, currency: "USD" },
								promotion: {
									marketLocale: "en-US",
									selection: { kind: "package", tier: "starter" },
									storefrontSlug: "demo-store",
									targeting: { mode: "GLOBAL" },
									youtubeUrl: "https://www.youtube.com/watch?v=abc123def45",
								},
								requestId: "33333333-3333-4333-8333-333333333333",
							},
							name: "dynamoi_shop_create_checkout",
						});
						expect(result.structuredContent).toEqual({
							code: "QUOTE_CHANGED",
							field: "expectedTotal",
							kind: "business",
							message:
								"The Shop quote changed. Get a new quote before creating checkout.",
							nextAction: {
								field: "expectedTotal",
								kind: "provide_input",
								reason:
									"Get a fresh quote, ask the user to confirm its total, then submit with that total and the same requestId.",
							},
							prerequisite:
								"Get a fresh Shop quote and obtain renewed user confirmation for its total before creating checkout.",
							retryable: false,
							status: "error",
						});
						expect(observations[0]?.result).toEqual(result.structuredContent);
					},
					false,
					{
						adapterMethod: "shopCreateCheckout",
					},
				);
			});
		}

		test("throwing observer cannot change a successful tool result", async () => {
			await withFixture(
				profile,
				success,
				async ({ client, observations }) => {
					const result = await client.callTool({
						arguments: {},
						name: "dynamoi_list_artists",
					});
					expect(result.isError).not.toBe(true);
					expect(result.structuredContent).toEqual(success);
					expect(observations).toHaveLength(1);
				},
				true,
			);
		});

		test("throwing observer cannot mask an output validation error", async () => {
			await withFixture(
				profile,
				{ status: "success" },
				async ({ client, observations }) => {
					const result = await client.callTool({
						arguments: {},
						name: "dynamoi_list_artists",
					});
					expect(result.isError).toBe(true);
					expect(result.structuredContent).toMatchObject({
						kind: "validation",
						status: "error",
					});
					expect(observations).toHaveLength(1);
					expect(observations[0]?.result).toEqual(result.structuredContent);
				},
				true,
			);
		});
	});
}
