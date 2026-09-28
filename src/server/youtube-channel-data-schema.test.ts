import { describe, expect, test } from "bun:test";
import { getDynamoiToolDefinitions } from "./create-server";
import { PHASE_1_TOOL_DEFINITIONS } from "./tools";
import { DynamoiGetYouTubeChannelDataInputSchema } from "./youtube-channel-data-schema";

const artistId = "00000000-0000-4000-8000-000000000000";

function parse(input: Record<string, unknown>) {
	return DynamoiGetYouTubeChannelDataInputSchema.safeParse({
		artistId,
		dataset: "channel_daily",
		endDate: "2026-09-25",
		startDate: "2026-09-01",
		...input,
	});
}

describe("dynamoi_get_youtube_channel_data input", () => {
	test("accepts a bounded channel request", () => {
		expect(parse({}).success).toBe(true);
		expect(parse({ limit: 1000 }).success).toBe(true);
	});

	test("rejects reversed and over-long ranges", () => {
		expect(parse({ startDate: "2026-09-26" }).success).toBe(false);
		expect(
			parse({ endDate: "2026-09-25", startDate: "2025-08-21" }).success,
		).toBe(false);
		expect(
			parse({ endDate: "2026-09-24", startDate: "2025-08-21" }).success,
		).toBe(true);
		expect(parse({ endDate: "2026-02-30" }).success).toBe(false);
	});

	test("limits videoIds to video datasets and valid IDs", () => {
		expect(
			parse({ dataset: "video_daily", videoIds: ["dQw4w9WgXcQ"] }).success,
		).toBe(true);
		expect(parse({ videoIds: ["dQw4w9WgXcQ"] }).success).toBe(false);
		expect(
			parse({ dataset: "video_daily", videoIds: ["x' OR 1=1 --"] }).success,
		).toBe(false);
		expect(
			parse({
				dataset: "video_daily",
				videoIds: Array.from({ length: 51 }, () => "dQw4w9WgXcQ"),
			}).success,
		).toBe(false);
	});

	test("rejects unknown datasets, limits and fields", () => {
		expect(parse({ dataset: "demographics" }).success).toBe(false);
		expect(parse({ limit: 1001 }).success).toBe(false);
		expect(parse({ adSpend: true }).success).toBe(false);
	});
});

describe("dynamoi_get_youtube_channel_data definition", () => {
	const definition = PHASE_1_TOOL_DEFINITIONS.find(
		(tool) => tool.name === "dynamoi_get_youtube_channel_data",
	);

	test("is a read-only tool in the directory profile", () => {
		expect(definition?.readOnlyHint).toBe(true);
		expect(definition?.destructiveHint).toBe(false);
		expect(definition?.openWorldHint).toBe(false);
		const directoryNames = getDynamoiToolDefinitions({
			toolProfile: "directory",
		}).map((tool) => tool.name);
		expect(directoryNames).toContain("dynamoi_get_youtube_channel_data");
	});

	test("describes datasets, gaps and paid versus organic in shared vocabulary", () => {
		const description = definition?.description ?? "";
		expect(description).toContain("traffic_source_daily");
		expect(description).toContain("ADVERTISING");
		expect(description).toContain("not attributed");
		expect(description).toContain("demographics");
		expect(description).toContain("unknown, never zero");
		expect(description).not.toContain("Google Ads");
		expect(description).not.toContain("follow-on");
		expect(description).not.toContain("dynamoi://");
	});
});
