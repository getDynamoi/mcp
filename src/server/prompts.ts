import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

function asTextPrompt(text: string) {
	return {
		messages: [
			{
				content: { text, type: "text" as const },
				role: "user" as const,
			},
		],
	};
}

export function registerDynamoiPrompts(server: McpServer) {
	server.registerPrompt(
		"dynamoi_audit_campaigns",
		{
			argsSchema: {
				artistId: z.string().uuid().optional(),
			},
			description:
				"Audit an artist's campaigns and summarize what is working and what to fix next.",
			title: "Audit Campaigns",
		},
		(args) =>
			asTextPrompt(
				[
					"Audit my campaigns in Dynamoi.",
					args.artistId
						? `Artist ID: ${args.artistId}`
						: "If no artistId is provided, start by listing artists and ask me which one to audit.",
					"",
					"Steps:",
					"1. Use dynamoi_list_campaigns (and dynamoi_get_campaign_analytics for the last 7-14 days) to assess performance.",
					"2. Identify any campaigns that are paused, failed, or stuck in a pre-active state and explain why using dynamoi_get_campaign and dynamoi_get_platform_status.",
					"3. Recommend 3-5 next actions with clear priorities.",
				].join("\n"),
			),
	);

	server.registerPrompt(
		"dynamoi_release_launch_plan",
		{
			argsSchema: {
				artistId: z.string().uuid().optional(),
				contentTitle: z.string().trim().optional(),
				contentType: z.enum(["TRACK", "ALBUM", "PLAYLIST", "VIDEO"]).optional(),
			},
			description:
				"Create a pragmatic release launch plan and propose a Dynamoi campaign setup.",
			title: "Release Launch Plan",
		},
		(args) =>
			asTextPrompt(
				[
					"Help me plan a release launch using Dynamoi.",
					args.artistId
						? `Artist ID: ${args.artistId}`
						: "If no artistId is provided, list artists first.",
					args.contentType ? `Content type: ${args.contentType}` : "",
					args.contentTitle ? `Title: ${args.contentTitle}` : "",
					"",
					"Ask any missing questions first (links, creative, budget, countries, dates).",
					"Then propose the simplest campaign plan that fits today’s supported platforms:",
					"- Smart Campaign (Meta) for Spotify/Apple Music releases",
					"- YouTube campaign for videos",
					"",
					"If we proceed to launch:",
					"- For Smart Campaign: use dynamoi_list_media_assets and then dynamoi_launch_campaign.",
					"- For YouTube: use dynamoi_launch_campaign with youtubeVideoId.",
				]
					.filter(Boolean)
					.join("\n"),
			),
	);

	server.registerPrompt(
		"dynamoi_why_campaign_blocked",
		{
			argsSchema: {
				campaignId: z.string().uuid(),
			},
			description:
				"Diagnose why a campaign is blocked/stuck and recommend the next fix.",
			title: "Why Is My Campaign Blocked?",
		},
		(args) =>
			asTextPrompt(
				[
					"My campaign seems blocked or stuck. Diagnose it and tell me what to do next.",
					`Campaign ID: ${args.campaignId}`,
					"",
					"Steps:",
					"1. Use dynamoi_get_campaign to inspect current status and blockers.",
					"2. Use dynamoi_get_platform_status for the artist to check Meta/Google connection state.",
					"3. If appropriate, suggest safe next actions (pause/resume or budget update) and confirm before executing.",
				].join("\n"),
			),
	);
}
