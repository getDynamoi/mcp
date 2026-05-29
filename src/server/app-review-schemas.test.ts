import { describe, expect, test } from "bun:test";
import * as z from "zod/v4";
import {
	DynamoiGetSmartLinkInputSchema,
	parseDynamoiGetSmartLinkInput,
} from "./smart-link-tools";
import { DynamoiListCampaignsInputSchema } from "./tools";

describe("mcp app review schemas", () => {
	test("list campaigns status filter is an explicit enum in parser and JSON schema", () => {
		const parsed = DynamoiListCampaignsInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			status: "ACTIVE",
		});
		expect(parsed.status).toBe("ACTIVE");
		expect(() =>
			DynamoiListCampaignsInputSchema.parse({
				artistId: "00000000-0000-0000-0000-000000000000",
				status: "active",
			}),
		).toThrow();
		expect(() =>
			DynamoiListCampaignsInputSchema.parse({
				artistId: "00000000-0000-0000-0000-000000000000",
				status: "ENDED",
			}),
		).toThrow();

		const schema = z.toJSONSchema(DynamoiListCampaignsInputSchema) as {
			properties?: Record<string, { enum?: string[] }>;
		};
		expect(schema.properties?.status?.enum).toContain("ACTIVE");
		expect(schema.properties?.status?.enum).toContain("READY_FOR_REVIEW");
		expect(schema.properties?.status?.enum).not.toContain("ENDED");
	});

	test("get smart link include flags render as booleans in JSON schema", () => {
		const parsed = DynamoiGetSmartLinkInputSchema.parse({
			artistId: "00000000-0000-0000-0000-000000000000",
			includeAnalytics: true,
			includeArtistSettings: true,
			playLinkId: "22222222-2222-4222-8222-222222222222",
		});
		expect(parsed.includeAnalytics).toBe(true);
		expect(parsed.includeArtistSettings).toBe(true);
		const legacyParsed = parseDynamoiGetSmartLinkInput({
			include: ["analytics", "artist_settings"],
			playLinkId: "22222222-2222-4222-8222-222222222222",
		});
		expect(legacyParsed.includeAnalytics).toBe(true);
		expect(legacyParsed.includeArtistSettings).toBe(true);

		const schema = z.toJSONSchema(DynamoiGetSmartLinkInputSchema) as {
			additionalProperties?: unknown;
			properties?: Record<string, unknown>;
		};
		expect(schema.additionalProperties).toBe(false);
		expect(schema.properties?.include).toBeUndefined();
		expect(schema.properties?.includeAnalytics).toEqual({ type: "boolean" });
		expect(schema.properties?.includeArtistSettings).toEqual({
			type: "boolean",
		});
	});
});
