import { describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Phase3Adapter } from "./create-server";
import { registerDynamoiResources } from "./resources";

function buildStubAdapter(): Phase3Adapter {
	const stub = async () => ({
		message: "Adapter not used in resource registration tests.",
		status: "error" as const,
	});
	return new Proxy({} as Phase3Adapter, {
		get: () => stub,
	});
}

async function readResource(uri: string) {
	const server = new McpServer({ name: "test", version: "0.0.0" });
	registerDynamoiResources(server, buildStubAdapter());
	const [serverTransport, clientTransport] =
		InMemoryTransport.createLinkedPair();
	await server.connect(serverTransport);
	const client = new Client({ name: "test", version: "0.0.0" });
	await client.connect(clientTransport);
	const result = await client.readResource({ uri });
	await client.close();
	await server.close();
	return result;
}

describe("registerDynamoiResources persona playbooks", () => {
	test("dynamoi://playbooks/spotify-artist returns guidance for Spotify artists", async () => {
		const result = await readResource("dynamoi://playbooks/spotify-artist");
		const content = result.contents[0];
		expect(content?.mimeType).toBe("application/json");
		const parsed = JSON.parse(String(content?.text ?? ""));
		expect(parsed.fastestPath).toContain(
			"dynamoi_create_smart_links_from_spotify_artist",
		);
		expect(parsed.persona).toContain("Spotify");
		expect(typeof parsed.marginCopyGuard).toBe("string");
	});

	test("dynamoi://playbooks/youtube-creator highlights revenue-per-view differentiator", async () => {
		const result = await readResource("dynamoi://playbooks/youtube-creator");
		const parsed = JSON.parse(String(result.contents[0]?.text ?? ""));
		expect(parsed.differentiator).toContain("revenue per country");
		expect(parsed.channelLinkingPath).toContain(
			"dynamoi_start_youtube_channel_link",
		);
		expect(parsed.talkingPoints.playlistWaterfall.trigger).toContain(
			"subscribers",
		);
	});

	test("dynamoi://playbooks/label-or-manager covers organization roles", async () => {
		const result = await readResource("dynamoi://playbooks/label-or-manager");
		const parsed = JSON.parse(String(result.contents[0]?.text ?? ""));
		expect(parsed.rolesNote).toContain("admin, editor, and viewer");
		expect(parsed.persona).toContain("Label");
	});

	test("dynamoi://playbooks/onboarding-tree mirrors the get_account_overview state branches", async () => {
		const result = await readResource("dynamoi://playbooks/onboarding-tree");
		const parsed = JSON.parse(String(result.contents[0]?.text ?? ""));
		expect(Array.isArray(parsed.nodes)).toBe(true);
		expect(parsed.nodes[0].if).toContain("hasAnyArtist === false");
		const conditions = parsed.nodes.map(
			(node: { if: string }) => node.if,
		) as string[];
		expect(
			conditions.some((c) => c.includes("hasAnySmartLink === false")),
		).toBe(true);
		expect(
			conditions.some((c) => c.includes("hasAnyActiveCampaign === false")),
		).toBe(true);
		expect(
			conditions.some((c) => c.includes("hasAnyConnectedMeta === false")),
		).toBe(true);
	});

	test("dynamoi://mcp/tool-answering-rules now includes the empty-state rule", async () => {
		const result = await readResource("dynamoi://mcp/tool-answering-rules");
		const parsed = JSON.parse(String(result.contents[0]?.text ?? ""));
		expect(parsed.emptyStateRule).toContain("dynamoi_get_account_overview");
		expect(parsed.emptyStateRule).toContain("playbooks/onboarding-tree");
	});
});
