import type {
	ArtistTier,
	BillingStatus,
	CampaignDisplayStatus,
	CampaignType,
	MoneyDisplay,
} from "./types";

export type GetBillingData = {
	tier: ArtistTier;
	billingStatus: BillingStatus;
	creditBalance: MoneyDisplay | null;
	recentUsage?: {
		period: string;
		totalSpend: MoneyDisplay;
		campaignCount: number;
	};
	isPromoArtist: boolean;
	promoLimits?: {
		campaignsUsed: number;
		campaignsAllowed: number;
		remainingBudget: MoneyDisplay;
	};
	warnings?: string[];
	actionRequired?: string[];
};

export type GetBillingSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type StartSubscriptionCheckoutData = {
	artistId: string;
	artistName: string;
	onboardingAttemptId: string;
	status:
		| "checkout_url"
		| "already_active"
		| "connections_required"
		| "setup_required"
		| "tenant_managed"
		| "activated";
	checkoutUrl: string | null;
	checkoutSource?: "checkout_created" | "checkout_reused" | "portal";
	subscriptionId?: string;
	setupReason?: string;
	completionCheck: {
		pollTools: string[];
		onboardingFlow: "billing";
		expectedBillingStatus: "ACTIVE";
	};
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetPlatformStatusData = {
	platforms: {
		spotify: { connected: boolean; artistName?: string; artistUrl?: string };
		meta: {
			connected: boolean;
			status:
				| "not_connected"
				| "oauth_complete"
				| "selection_pending"
				| "partnership_pending"
				| "partnership_active";
			pageName?: string;
			tokenExpiresAt?: string;
			isTokenExpired?: boolean;
		};
		youtube: { connected: boolean; channelName?: string; channelUrl?: string };
	};
	onboardingComplete: boolean;
	missingForSmartCampaign: string[];
	missingForYouTube: string[];
	warnings?: string[];
	actionRequired?: string[];
};

export type GetPlatformStatusSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type StartYoutubeChannelLinkData = {
	artistId: string;
	artistName: string;
	onboardingAttemptId: string;
	authorizationUrl: string;
	expiresAt: string;
	completionCheck: {
		pollTools: string[];
		onboardingFlow: "youtube";
		connectedFlag: "platforms.youtube.connected";
		readyValue: true;
	};
	nextActions: string[];
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type StartMetaConnectionData = {
	artistId: string;
	artistName: string;
	onboardingAttemptId: string | null;
	status: "authorization_url" | "already_connected";
	authorizationUrl: string | null;
	expiresAt: string | null;
	completionCheck: {
		pollTools: string[];
		onboardingFlow: "meta";
		connectedFlag: "platforms.meta.connected";
		statusField: "platforms.meta.status";
		readyStatuses: Array<
			"oauth_complete" | "partnership_pending" | "partnership_active"
		>;
	};
	nextActions: string[];
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type PauseResumePlatformResult = {
	platform: "META" | "GOOGLE";
	success: boolean;
	message?: string;
};

export type PauseResumeCampaignData = {
	id: string;
	contentTitle: string;
	newStatus: "PAUSED" | "ACTIVE";
	platformResults: PauseResumePlatformResult[];
	warnings?: string[];
	actionRequired?: string[];
};

export type UpdateBudgetData = {
	id: string;
	contentTitle: string;
	previousBudget: MoneyDisplay;
	newBudget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	endDate?: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type UpdateCampaignData = PauseResumeCampaignData | UpdateBudgetData;

export type MediaAssetSummary = {
	id: string;
	url?: string;
	urlExpiresAt?: string;
	fileType: string;
	fileName?: string;
	width?: number;
	height?: number;
	aspectRatio?: string;
	createdAt: string;
};

export type ListMediaAssetsData = {
	assets: MediaAssetSummary[];
	nextCursor?: string;
};

export type ListMediaAssetsSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type LaunchCampaignData = {
	summary: string;
	id: string;
	contentTitle: string;
	campaignType: CampaignType;
	status: CampaignDisplayStatus;
	budget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	platforms: string[];
	deliveryState: "ACTIVE" | "PENDING_REVIEW" | "CONTENT_VALIDATION";
	isLive: boolean;
	nextSteps: string[];
	warnings?: string[];
};
