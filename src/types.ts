export type * from "./flow-types";
export type * from "./readiness-types";

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
		publicUrl?: string;
		resultReason?: string;
	}>;
	nextCursor?: string;
};

export type SearchSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

// OpenAiSearchData / OpenAiFetchData live in server/openai-tools.ts
// (re-exported through the package entrypoint).

export type GetCurrentUserArtistSummary = {
	id: string;
	name: string;
	slug: string | null;
	hasConnectedMeta: boolean;
	hasConnectedSpotify: boolean;
	hasConnectedYoutube: boolean;
	artistHasActiveCampaigns: boolean;
	smartLinkCount: number;
};

export type GetCurrentUserState = {
	hasAnyArtist: boolean;
	hasAnyConnectedMeta: boolean;
	hasAnyConnectedSpotify: boolean;
	hasAnyConnectedYoutube: boolean;
	hasAnySmartLink: boolean;
	hasAnyActiveCampaign: boolean;
	isFirstSession: boolean;
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
	artists: {
		count: number;
		summaries: GetCurrentUserArtistSummary[];
	};
	state: GetCurrentUserState;
	recommendedNextActions: string[];
	hints: string[];
};

export type SmartLinkClaimStatus =
	| "auto_approved"
	| "pending_ops_review"
	| "approved_by_ops"
	| "rejected";
export type SmartLinkPublishState = "published" | "unpublished";
export type SmartLinkTakedownStatus = "none" | "active" | "resolved";
export type SmartLinkOdesliStatus = "pending" | "resolved" | "failed";
export type SmartLinkRenderState =
	| "queued"
	| "rendering"
	| "rendered"
	| "failed";
export type SmartLinkTheme = "classic" | "brutalist" | "aurora" | "cinematic";

export type SmartLinkSummary = {
	id: string;
	artistId: string;
	artistName: string;
	artistHubUrl: string;
	releaseTitle: string;
	releaseType: string;
	releaseSlug: string;
	spotifyUrl: string | null;
	publicUrl: string;
	localizedPublicUrls?: string[];
	isPublic: boolean;
	claimStatus: SmartLinkClaimStatus;
	publishState: SmartLinkPublishState;
	takedownStatus: SmartLinkTakedownStatus;
	odesliStatus: SmartLinkOdesliStatus;
	renderState: SmartLinkRenderState;
	theme: SmartLinkTheme;
	createdAt: string;
	updatedAt: string;
};

export type SmartLinkSettingsData = {
	artistId: string;
	artistName: string;
	isEnabled: boolean;
	defaultTheme: SmartLinkTheme;
	pixels: {
		metaPixelId: string | null;
		tiktokPixelId: string | null;
		googleAdsConversionId: string | null;
	};
	availableThemes: SmartLinkTheme[];
	summary?: string;
};

export type ListSmartLinksData = {
	smartLinks: SmartLinkSummary[];
	nextCursor?: string;
};

export type ListSmartLinksSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type GetSmartLinkData = SmartLinkSummary & {
	customDescription: string | null;
	originalSpotifyUrl: string | null;
	spotifyDiscographyId: string;
	resourceUri: string;
	settingsResourceUri: string;
	nextActions: string[];
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetSmartLinkSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type SmartLinkAnalyticsTotals = {
	anonymousVisits: number;
	streamingServiceClicks: number;
	shareClicks: number;
	promoteCtaClicks: number;
};

export type GetSmartLinkAnalyticsData = {
	playLinkId: string;
	artistId: string;
	releaseTitle: string;
	dateRange: { start: string; end: string };
	totals: SmartLinkAnalyticsTotals;
	daily?: Array<SmartLinkAnalyticsTotals & { date: string }>;
	breakdowns?: {
		serviceClicks?: Record<string, number>;
		countryViews?: Record<string, number>;
		countryClicks?: Record<string, number>;
		referrerViews?: Record<string, number>;
		referrerClicks?: Record<string, number>;
		utmViews?: Record<string, number>;
		utmClicks?: Record<string, number>;
		deviceViews?: Record<string, number>;
		deviceClicks?: Record<string, number>;
		localeViews?: Record<string, number>;
		localeClicks?: Record<string, number>;
		themeViews?: Record<string, number>;
		themeClicks?: Record<string, number>;
	};
	warnings?: string[];
};

export type GetSmartLinkAnalyticsSummaryData = {
	summary: string;
	warnings?: string[];
};

export type CreateSmartLinkFromSpotifyData = GetSmartLinkData & {
	outcome: "created" | "existing";
	workflowRunId: string | null;
	workflowWarning: string | null;
};

export type CreateSmartLinksFromSpotifyArtistData = {
	artistId: string;
	artistName: string;
	artistHubUrl: string;
	spotifyArtistUrl: string;
	artistCreatedFromSpotify?: boolean;
	catalogImportStatus: "started" | "start_failed";
	catalogWorkflowRunId: string | null;
	initialSmartLink: SmartLinkSummary | null;
	initialRenderRunId: string | null;
	currentSmartLinkCount: number;
	newlyAvailableCount: number;
	existingCount: number;
	smartLinks: SmartLinkSummary[];
	summary: string;
	nextActions: string[];
	warnings?: string[];
};

export type UpdateSmartLinkData = GetSmartLinkData & {
	renderRunId: string | null;
	renderWarning: string | null;
};

export type UpdateSmartLinkArtistSettingsData = SmartLinkSettingsData & {
	renderQueuedCount: number;
	renderWarning: string | null;
};

export type PublishSmartLinkData = GetSmartLinkData & {
	workflowRunId: string | null;
	workflowWarning: string | null;
};

export type GetCurrentUserSummaryData = {
	summary: string;
	organizationCount: number;
	artistCount: number;
	recommendedNextActions: string[];
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
	summary: string;
	id: string;
	contentTitle: string;
	contentType: "TRACK" | "ALBUM" | "PLAYLIST" | "VIDEO";
	campaignType: CampaignType;
	status: CampaignDisplayStatus;
	budget: MoneyDisplay;
	budgetType: "DAILY" | "TOTAL";
	locationTargets:
		| { mode: "GLOBAL" }
		| {
				mode: "COUNTRIES";
				countryCount: number;
				countries?: Array<{ code: string; name: string }>;
		  };
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

export type GetArtistAnalyticsJsonData = {
	artistId: string;
	campaignCount: number;
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
	strongestCampaign?: {
		campaignId: string;
		contentTitle: string;
		status: string;
		impressions: number;
		clicks: number;
		spend: MoneyDisplay;
	};
	warnings?: string[];
};

export type GetArtistAnalyticsSummaryData = {
	summary: string;
	campaignCount?: number;
	dateRange?: { start: string; end: string };
	hasDailyBreakdown?: boolean;
	strongestCampaign?: {
		campaignId: string;
		contentTitle: string;
		status: string;
		impressions: number;
		clicks: number;
		spend: MoneyDisplay;
	};
	warnings?: string[];
};
