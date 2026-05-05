import {
	LaunchCampaignOutputEnvelopeSchema,
	ListMediaAssetsOutputEnvelopeSchema,
} from "./output-schemas";
import {
	DynamoiLaunchCampaignInputSchema,
	DynamoiListMediaAssetsInputSchema,
} from "./tools";

export const PHASE_3_TOOL_DEFINITIONS = [
	{
		description:
			"Use this when the user wants to choose from uploaded images or videos that can be reused in a campaign launch. Do not use this when the user only wants campaign status or analytics. Use format=json when you need asset IDs for a follow-up launch. Request includeUrls only when the assistant must display or inspect public-safe asset URLs.",
		destructiveHint: false,
		name: "dynamoi_list_media_assets",
		openWorldHint: false,
		outputSchema: ListMediaAssetsOutputEnvelopeSchema,
		readOnlyHint: true,
		schema: DynamoiListMediaAssetsInputSchema,
		title: "List Media Assets",
	},
	{
		description:
			"Use this when the user explicitly wants to create a new Smart Campaign or YouTube Campaign and start the launch workflow with provided details. Ads are not necessarily live until the returned delivery state is ACTIVE. For review or demo Smart Campaign launches that already specify the artist, content title, budget, countries, and reusable media assets, you may omit spotifyUrl and endDate because Dynamoi can infer reviewer-safe defaults. Do not invent placeholder spotifyUrl or endDate values for those review/demo launches; omit them and let Dynamoi infer them. After a successful launch, answer from the returned campaign details directly instead of chaining more tools unless the user explicitly asked for more. Do not use this for recommendations or previews; this creates a real campaign workflow or demo-safe simulated campaign.",
		destructiveHint: false,
		idempotentHint: true,
		name: "dynamoi_launch_campaign",
		openWorldHint: true,
		outputSchema: LaunchCampaignOutputEnvelopeSchema,
		readOnlyHint: false,
		schema: DynamoiLaunchCampaignInputSchema,
		title: "Start Campaign Launch Workflow",
	},
] as const;
