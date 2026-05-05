import * as z from "zod/v4";
import { AnyOutputEnvelopeSchema } from "./output-schemas";

/**
 * OpenAI ChatGPT Connectors / Deep Research spec requires every connector
 * to expose tools literally named `search` and `fetch`. These schemas are
 * intentionally minimal to match the spec exactly.
 */

/**
 * OpenAI ChatGPT Connectors / Deep Research search tool result shape.
 * The spec requires `results: [{id, title, url?, text?}]`. We prefix `id`
 * with `${type}:` so the matching `fetch` tool can route.
 */
export type OpenAiSearchData = {
	results: Array<{
		id: string;
		title: string;
		url?: string;
		text?: string;
	}>;
};

/**
 * OpenAI Deep Research fetch tool result shape.
 * The spec requires `id`, `title`, `text`, `url`, optional `metadata`.
 */
export type OpenAiFetchData = {
	id: string;
	title: string;
	text: string;
	url: string;
	metadata?: Record<string, unknown>;
};

export const DynamoiOpenAiSearchInputSchema = z
	.object({
		query: z.string().trim().min(1).max(500),
	})
	.strict();

export const DynamoiOpenAiFetchInputSchema = z
	.object({
		id: z.string().trim().min(1).max(200),
	})
	.strict();

export const OPENAI_TOOL_DEFINITIONS = [
	{
		// OpenAI ChatGPT Connectors / Deep Research expects a tool literally
		// named `search` returning {results: [{id, title, text?, url?}]}. This
		// is the same data dynamoi_search returns, reshaped for OpenAI Deep
		// Research citation flows. ChatGPT will not call this tool directly in
		// regular chat — it picks dynamoi_search by description.
		description:
			"OpenAI ChatGPT Deep Research / Connectors search contract. Returns matching Dynamoi artists, campaigns, and Smart Links so they can be cited in a deep-research session. For regular ChatGPT chat use dynamoi_search instead.",
		destructiveHint: false,
		name: "search",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiOpenAiSearchInputSchema,
		title: "Search (OpenAI Connectors)",
	},
	{
		// OpenAI Deep Research follow-up tool: given an id returned by `search`,
		// returns the full record so it can be cited.
		description:
			"OpenAI ChatGPT Deep Research / Connectors fetch contract. Given an id returned by `search` (formatted as 'artist:<uuid>', 'campaign:<uuid>', or 'smartlink:<uuid>'), returns the full record for citation.",
		destructiveHint: false,
		name: "fetch",
		openWorldHint: false,
		outputSchema: AnyOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiOpenAiFetchInputSchema,
		title: "Fetch (OpenAI Connectors)",
	},
] as const;
