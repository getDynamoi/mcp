import { describe, expect, test } from "bun:test";
import * as z from "zod/v4";
import { asTextResult, asValidatedTextResult } from "./create-server";
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
