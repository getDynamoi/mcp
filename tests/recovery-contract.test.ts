import { describe, expect, test } from "bun:test";
import {
	asValidatedTextResult,
	type DynamoiMcpToolProfile,
	getDynamoiToolDefinitions,
} from "../src/server/create-server";
import {
	AnyOutputEnvelopeSchema,
	ListMediaAssetsOutputEnvelopeSchema,
} from "../src/server/output-schemas";

const legacyError = {
	kind: "business",
	message: "The requested operation cannot be completed.",
	status: "error",
} as const;

const unknownError = {
	kind: "unknown",
	message: "Something went wrong. Please try again.",
	status: "error",
} as const;

const recoveryError = {
	code: "STATE_CONFLICT",
	field: "expectedUpdatedAt",
	kind: "business",
	message: "The requested operation cannot be completed.",
	nextAction: {
		field: "expectedUpdatedAt",
		kind: "read_status",
		reason: "Read the existing resource before submitting again.",
	},
	prerequisite: "The existing resource must be read first.",
	retryable: false,
	status: "error",
} as const;

const profiles = [
	"full",
	"chatgpt-app",
] as const satisfies readonly DynamoiMcpToolProfile[];

describe("typed recovery envelope contract", () => {
	test("keeps legacy errors valid for every registered strict output schema", () => {
		for (const profile of profiles) {
			for (const definition of getDynamoiToolDefinitions({
				toolProfile: profile,
			})) {
				expect(definition.outputSchema.safeParse(legacyError).success).toBe(
					true,
				);
			}
		}
	});

	test("accepts additive recovery fields for every registered strict output schema", () => {
		for (const profile of profiles) {
			for (const definition of getDynamoiToolDefinitions({
				toolProfile: profile,
			})) {
				expect(definition.outputSchema.safeParse(recoveryError).success).toBe(
					true,
				);
			}
		}
	});

	test("preserves existing success and partial-success envelopes", () => {
		const success = {
			data: { assets: [], nextCursor: "cursor-2" },
			status: "success",
		} as const;
		const partial = {
			data: { summary: "Some artists were unavailable.", totalCount: 0 },
			message: "Some artists were unavailable.",
			status: "partial_success",
		} as const;

		expect(ListMediaAssetsOutputEnvelopeSchema.parse(success)).toEqual(success);
		expect(AnyOutputEnvelopeSchema.parse(success)).toEqual(success);
		expect(AnyOutputEnvelopeSchema.parse(partial)).toEqual(partial);
	});

	test("keeps recovery metadata scoped to errors and rejects unsafe descriptors", () => {
		const definitions = getDynamoiToolDefinitions({ toolProfile: "full" });
		const unsafeNextAction = {
			...recoveryError,
			nextAction: {
				...recoveryError.nextAction,
				toolName: "dynamoi_launch_campaign",
			},
		};
		const successWithRecovery = {
			code: "STATE_CONFLICT",
			data: { artists: [], summary: "No artists.", totalCount: 0 },
			status: "success",
		};
		for (const definition of definitions) {
			expect(definition.outputSchema.safeParse(unsafeNextAction).success).toBe(
				false,
			);
			expect(
				definition.outputSchema.safeParse(successWithRecovery).success,
			).toBe(false);
		}
	});

	test("requires explicit retryability for retry timing", () => {
		const withoutRetryability = {
			...legacyError,
			retryAfterSeconds: 30,
		};
		const withRetryability = {
			...legacyError,
			code: "RATE_LIMITED",
			retryAfterSeconds: 30,
			retryable: true,
		};
		for (const definition of getDynamoiToolDefinitions({
			toolProfile: "full",
		})) {
			expect(
				definition.outputSchema.safeParse(withoutRetryability).success,
			).toBe(false);
			expect(definition.outputSchema.safeParse(withRetryability).success).toBe(
				true,
			);
		}
	});

	test("only accepts bounded retryability for rate limits", () => {
		const definitions = getDynamoiToolDefinitions({ toolProfile: "full" });
		const validRateLimit = {
			...legacyError,
			code: "RATE_LIMITED",
			retryAfterSeconds: 30,
			retryable: true,
		};
		const withoutCode = {
			...legacyError,
			retryAfterSeconds: 30,
			retryable: true,
		};
		const unknownEffect = {
			...validRateLimit,
			code: "UNKNOWN_EFFECT",
		};
		const terminalError = {
			...validRateLimit,
			code: "ACCOUNT_READ_ONLY",
		};
		const missingTiming = {
			...legacyError,
			code: "RATE_LIMITED",
			retryable: true,
		};
		const zeroTiming = {
			...validRateLimit,
			retryAfterSeconds: 0,
		};
		const safeFalse = {
			...legacyError,
			code: "UNKNOWN_EFFECT",
			retryable: false,
		};

		for (const definition of definitions) {
			expect(definition.outputSchema.safeParse(validRateLimit).success).toBe(
				true,
			);
			for (const unsafe of [
				withoutCode,
				unknownEffect,
				terminalError,
				missingTiming,
				zeroTiming,
			]) {
				expect(definition.outputSchema.safeParse(unsafe).success).toBe(false);
			}
			expect(definition.outputSchema.safeParse(safeFalse).success).toBe(true);
		}
	});

	test("marks unexpected failures on mutations as unknown effects", () => {
		const definitions = getDynamoiToolDefinitions({ toolProfile: "full" });
		const expectedRecovery = {
			code: "UNKNOWN_EFFECT",
			nextAction: {
				kind: "read_status",
				reason:
					"Inspect the existing operation or resource identity before retrying.",
			},
			prerequisite:
				"The existing operation or resource identity must be inspected before replaying.",
			retryable: false,
		};

		for (const definition of definitions) {
			const result = asValidatedTextResult({
				envelope: unknownError,
				outputSchema: definition.outputSchema,
				toolName: definition.name,
			});
			if (definition.readOnlyHint) {
				expect(result.structuredContent).toEqual(unknownError);
			} else {
				expect(result.structuredContent).toEqual({
					...unknownError,
					...expectedRecovery,
				});
			}
		}
	});

	test("preserves explicit producer recovery metadata on unexpected mutation failures", () => {
		const envelope = {
			...unknownError,
			code: "UNKNOWN_EFFECT",
			nextAction: {
				kind: "read_status",
				reason: "Check the existing operation before replaying.",
			},
			retryable: false,
		};
		const result = asValidatedTextResult({
			envelope,
			outputSchema: AnyOutputEnvelopeSchema,
			toolName: "dynamoi_shop_create_checkout",
		});

		expect(result.structuredContent).toEqual(envelope);
	});

	test("maps only matching bounded Shop admission errors", () => {
		const definitions = getDynamoiToolDefinitions({ toolProfile: "full" });
		const definitionFor = (toolName: string) => {
			const definition = definitions.find(
				(candidate) => candidate.name === toolName,
			);
			if (!definition) {
				throw new Error(`Missing fixture definition: ${toolName}`);
			}
			return definition;
		};
		const validCases = [
			{
				message: "Too many Shop quote requests. Try again in 60 seconds.",
				retryAfterSeconds: 60,
				toolName: "dynamoi_shop_get_quote",
			},
			{
				message: "Too many Shop checkout requests. Try again in 600 seconds.",
				retryAfterSeconds: 600,
				toolName: "dynamoi_shop_create_checkout",
			},
		] as const;

		for (const validCase of validCases) {
			const result = asValidatedTextResult({
				envelope: {
					kind: "business",
					message: validCase.message,
					status: "error",
				},
				outputSchema: definitionFor(validCase.toolName).outputSchema,
				toolName: validCase.toolName,
			});
			expect(result.structuredContent).toEqual({
				code: "RATE_LIMITED",
				kind: "business",
				message: validCase.message,
				retryAfterSeconds: validCase.retryAfterSeconds,
				retryable: true,
				status: "error",
			});
		}

		const negativeCases = [
			{
				kind: "business",
				message: "Too many Shop quote requests. Try again in 60 seconds.",
				status: "error",
				toolName: "dynamoi_shop_create_checkout",
			},
			{
				kind: "business",
				message: "Too many Shop checkout requests. Try again in 600 seconds.",
				status: "error",
				toolName: "dynamoi_shop_get_quote",
			},
			{
				kind: "validation",
				message: "Too many Shop quote requests. Try again in 60 seconds.",
				status: "error",
				toolName: "dynamoi_shop_get_quote",
			},
			{
				kind: "business",
				message: "Too many Shop quote requests. Try again in 0 seconds.",
				status: "error",
				toolName: "dynamoi_shop_get_quote",
			},
			{
				kind: "business",
				message: "Too many Shop quote requests. Try again in 61 seconds.",
				status: "error",
				toolName: "dynamoi_shop_get_quote",
			},
			{
				kind: "business",
				message: "Too many Shop checkout requests. Try again in 601 seconds.",
				status: "error",
				toolName: "dynamoi_shop_create_checkout",
			},
			{
				kind: "business",
				message: "Too many Shop quote requests. Try again in many seconds.",
				status: "error",
				toolName: "dynamoi_shop_get_quote",
			},
			{
				kind: "business",
				message: "Too many Shop quote requests. Try again in 60 seconds.",
				status: "error",
				toolName: "shop-promotion-quote",
			},
		] as const;

		for (const negativeCase of negativeCases) {
			const { toolName, ...envelope } = negativeCase;
			const result = asValidatedTextResult({
				envelope,
				outputSchema: AnyOutputEnvelopeSchema,
				toolName,
			});
			expect(result.structuredContent).toEqual(envelope);
		}
	});

	test("leaves exact messages unchanged outside their guarded business causes", () => {
		const wrongKind = asValidatedTextResult({
			envelope: {
				kind: "validation",
				message: "Reviewer accounts are read-only in MCP.",
				status: "error",
			},
			outputSchema: AnyOutputEnvelopeSchema,
			toolName: "dynamoi_update_smart_link",
		});
		const wrongTool = asValidatedTextResult({
			envelope: {
				kind: "business",
				message: "Reviewer accounts are read-only in MCP.",
				status: "error",
			},
			outputSchema: AnyOutputEnvelopeSchema,
			toolName: "dynamoi_list_artists",
		});
		const wrongSpotifyTool = asValidatedTextResult({
			envelope: {
				kind: "business",
				message:
					"Use a Spotify artist URL for full-catalog Smart Link import. For album or track URLs, use dynamoi_create_smart_link_from_spotify.",
				status: "error",
			},
			outputSchema: AnyOutputEnvelopeSchema,
			toolName: "dynamoi_create_smart_link_from_spotify",
		});
		const producerMetadata = asValidatedTextResult({
			envelope: {
				code: "UNKNOWN_EFFECT",
				kind: "business",
				message: "Reviewer accounts are read-only in MCP.",
				retryable: false,
				status: "error",
			},
			outputSchema: AnyOutputEnvelopeSchema,
			toolName: "dynamoi_update_smart_link",
		});

		expect(wrongKind.structuredContent).toEqual({
			kind: "validation",
			message: "Reviewer accounts are read-only in MCP.",
			status: "error",
		});
		expect(wrongTool.structuredContent).toEqual({
			kind: "business",
			message: "Reviewer accounts are read-only in MCP.",
			status: "error",
		});
		expect(wrongSpotifyTool.structuredContent).toEqual({
			kind: "business",
			message:
				"Use a Spotify artist URL for full-catalog Smart Link import. For album or track URLs, use dynamoi_create_smart_link_from_spotify.",
			status: "error",
		});
		expect(producerMetadata.structuredContent).toEqual({
			code: "UNKNOWN_EFFECT",
			kind: "business",
			message: "Reviewer accounts are read-only in MCP.",
			retryable: false,
			status: "error",
		});
	});
});
