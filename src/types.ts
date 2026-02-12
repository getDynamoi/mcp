export type ResultEnvelope<T> =
	| { status: "success"; data: T }
	| { status: "partial_success"; data: T; message: string }
	| {
			status: "error";
			message: string;
			kind?: "validation" | "business" | "platform" | "unknown";
	  };

export type MoneyDisplay = {
	formatted: string;
	amountUsd: number;
};

export type AccessRole = "admin" | "editor" | "viewer";
export type ArtistTier = "none" | "starter" | "plus";
export type BillingStatus =
	| "ACTIVE"
	| "SUSPENDED"
	| "INACTIVE"
	| "NEVER_SUBSCRIBED";

export type CampaignType = "SMART_CAMPAIGN" | "YOUTUBE";
export type CampaignDisplayStatus =
	| "AWAITING_SMART_LINK"
	| "CONTENT_VALIDATION"
	| "DEPLOYING"
	| "READY_FOR_REVIEW"
	| "ACTIVE"
	| "PAUSED"
	| "SUBSCRIPTION_PAUSED"
	| "ARCHIVED"
	| "FAILED"
	| "ENDED";

export type ListArtistsData = {
	artists: Array<{
		id: string;
		name: string;
		organizationName?: string;
		tier: ArtistTier;
		billingStatus: BillingStatus;
		activeCampaignCount: number;
		role: AccessRole;
	}>;
	nextCursor?: string;
};

export type ListArtistsSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type SearchResultType = "artist" | "campaign" | "smartlink";
export type SearchData = {
	results: Array<{
		type: SearchResultType;
		id: string;
		name: string;
		status?: string;
		artistName?: string;
	}>;
	nextCursor?: string;
};

export type SearchSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type GetCurrentUserData = {
	user: {
		id: string;
		email?: string;
		name?: string;
		isSuperAdmin: boolean;
	};
	organizationCount: number;
	artistCount: number;
	hints: string[];
};

export type GetCurrentUserSummaryData = {
	summary: string;
	organizationCount: number;
	artistCount: number;
};

export type GetArtistData = {
	id: string;
	name: string;
	slug: string;
	tier: ArtistTier;
	billingStatus: BillingStatus;
	connections: {
		spotify: { connected: boolean; artistName?: string };
		meta: { connected: boolean; status?: string };
		youtube: { connected: boolean; channelName?: string };
	};
	onboarding: {
		smartCampaign: {
			isReady: boolean;
			missingRequirements: string[];
			nextAction?: string;
		};
		youtube: {
			isReady: boolean;
			missingRequirements: string[];
			nextAction?: string;
		};
	};
	organization?: { id: string; name: string };
	warnings?: string[];
	actionRequired?: string[];
};

export type GetArtistSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type ListCampaignsJsonData = {
	campaigns: Array<{
		id: string;
		contentTitle: string;
		campaignType: CampaignType;
		status: CampaignDisplayStatus;
		budget: MoneyDisplay;
		budgetType: "DAILY" | "TOTAL";
		platforms: string[];
		createdAt: string;
		endDate?: string;
	}>;
	nextCursor?: string;
};

export type ListCampaignsSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type GetCampaignData = {
	id: string;
	contentTitle: string;
	contentType: "TRACK" | "ALBUM" | "PLAYLIST" | "VIDEO";
	campaignType: CampaignType;
	status: CampaignDisplayStatus;
	budget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	locationTargets:
		| { mode: "GLOBAL" }
		| { mode: "COUNTRIES"; countries: Array<{ code: string; name: string }> };
	platforms: Array<{
		name: "META" | "GOOGLE";
		status: string;
		budgetAllocation: MoneyDisplay;
	}>;
	createdAt: string;
	updatedAt: string;
	endDate?: string;
	artistId: string;
	artistName: string;
	smartLinkUrl?: string;
	blockedReason?: string;
	nextAction?: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetCampaignSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetCampaignAnalyticsJsonData = {
	campaignId: string;
	contentTitle: string;
	status: CampaignDisplayStatus;
	dateRange: { start: string; end: string };
	totals: {
		impressions: number;
		clicks: number;
		spend: MoneyDisplay;
		cpc: MoneyDisplay | null;
		cpm: MoneyDisplay | null;
		ctr: number | null;
	};
	byPlatform?: Array<{
		platform: "META" | "GOOGLE";
		impressions: number;
		clicks: number;
		spend: MoneyDisplay;
		daily?: Array<{
			date: string;
			impressions: number;
			clicks: number;
			spend: MoneyDisplay;
		}>;
	}>;
	daily?: Array<{
		date: string;
		impressions: number;
		clicks: number;
		spend: MoneyDisplay;
	}>;
	warnings?: string[];
};

export type GetCampaignAnalyticsSummaryData = {
	summary: string;
	warnings?: string[];
};

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
};

export type UpdateBudgetData = {
	id: string;
	contentTitle: string;
	previousBudget: MoneyDisplay;
	newBudget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	endDate?: string;
};

export type MediaAssetSummary = {
	id: string;
	url: string;
	fileType: string;
	fileName?: string;
	width?: number;
	height?: number;
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
	id: string;
	contentTitle: string;
	campaignType: CampaignType;
	status: CampaignDisplayStatus;
	budget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	platforms: string[];
	nextSteps: string[];
};
