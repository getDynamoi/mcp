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
	/**
	 * Account commercial currency (ISO 4217, uppercase). Present only for
	 * non-USD accounts; absent means USD.
	 */
	currency?: string;
	isPromoArtist: boolean;
	/**
	 * Amounts that have no source in the account currency yet. They are
	 * reported as null rather than relabeled from another currency.
	 */
	moneyUnavailable?: {
		currency: string;
		fields: Array<"creditBalance" | "promoLimits.remainingBudget">;
		reason: "no_source_in_account_currency";
	};
	promoLimits?: {
		campaignsUsed: number;
		campaignsAllowed: number;
		/** Null only when listed in `moneyUnavailable.fields`. */
		remainingBudget: MoneyDisplay | null;
	};
	warnings?: string[];
	actionRequired?: string[];
};

export type GetBillingSummaryData = {
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
	purpose: "advertising" | "distribution_identity";
	onboardingAttemptId: string;
	authorizationUrl: string;
	expiresAt: string;
	completionCheck:
		| {
				pollTools: string[];
				onboardingFlow: "youtube";
				connectedFlag: "platforms.youtube.connected";
				readyValue: true;
		  }
		| {
				pollTools: string[];
				requirementKey: "youtube_identity";
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
	purpose: "advertising" | "distribution_identity";
	onboardingAttemptId: string | null;
	status:
		| "authorization_url"
		| "already_connected"
		| "billing_check_unavailable"
		| "billing_required";
	authorizationUrl: string | null;
	expiresAt: string | null;
	completionCheck:
		| {
				pollTools: string[];
				onboardingFlow: "meta";
				connectedFlag: "platforms.meta.connected";
				statusField: "platforms.meta.status";
				readyStatuses: Array<
					"oauth_complete" | "partnership_pending" | "partnership_active"
				>;
		  }
		| {
				pollTools: string[];
				requirementKey: "meta_identity";
				readyValue: true;
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
	endDate?: string | undefined;
	warnings?: string[] | undefined;
	actionRequired?: string[] | undefined;
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
