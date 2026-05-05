import type * as z from "zod/v4";
import { AnyOutputEnvelopeSchema } from "./output-schemas";

type OnboardingToolSchemas = {
	metaConnection: z.ZodType;
	subscriptionCheckout: z.ZodType;
	youtubeChannelLink: z.ZodType;
};

export function createPhaseOnboardingToolDefinitions(
	schemas: OnboardingToolSchemas,
) {
	return [
		{
			description:
				"Use this when the user is ready to activate Dynamoi managed advertising billing for one artist. This creates or reuses a secure Stripe Checkout URL that the user can open from chat. Checkout returns to a Dynamoi page that tells the user to come back to the AI assistant; after that, poll dynamoi_get_billing with the returned onboardingAttemptId to confirm the subscription became active. Do not use this for billing status checks; use dynamoi_get_billing.",
			destructiveHint: false,
			idempotentHint: true,
			name: "dynamoi_start_subscription_checkout",
			openWorldHint: true,
			outputSchema: AnyOutputEnvelopeSchema,
			readOnlyHint: false,
			schema: schemas.subscriptionCheckout,
			title: "Start Subscription Checkout",
		},
		{
			description:
				"Use this when the user is ready to link a YouTube channel to one Dynamoi artist from chat. This returns a Google OAuth URL bound to the signed-in user and artist. Google returns to a Dynamoi page that tells the user to come back to the AI assistant; after that, poll dynamoi_get_platform_status with the returned onboardingAttemptId and onboardingFlow=youtube until platforms.youtube.connected is true.",
			destructiveHint: false,
			idempotentHint: true,
			name: "dynamoi_start_youtube_channel_link",
			openWorldHint: true,
			outputSchema: AnyOutputEnvelopeSchema,
			readOnlyHint: false,
			schema: schemas.youtubeChannelLink,
			title: "Start YouTube Channel Link",
		},
		{
			description:
				"Use this when the user is ready to connect Meta for Spotify Smart Campaigns from chat. This returns a signed Meta OAuth URL and may send the user through a Page/Instagram selection step before the chat-first return page. After the user returns, poll dynamoi_get_platform_status with the returned onboardingAttemptId and onboardingFlow=meta until platforms.meta.status is oauth_complete, partnership_pending, or partnership_active.",
			destructiveHint: false,
			idempotentHint: true,
			name: "dynamoi_start_meta_connection",
			openWorldHint: true,
			outputSchema: AnyOutputEnvelopeSchema,
			readOnlyHint: false,
			schema: schemas.metaConnection,
			title: "Start Meta Connection",
		},
	] as const;
}
