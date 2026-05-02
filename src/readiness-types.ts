import type { CampaignDisplayStatus, CampaignType } from "./types";

export type CountryCatalogSource =
	| "SMART_CAMPAIGN_COUNTRIES"
	| "GOOGLE_ADS_COUNTRIES";

export type AvailableCountry = {
	code: string;
	name: string;
	googleAdsId: number;
	dominantLanguage?: string;
};

export type ListAvailableCountriesData = {
	campaignType: CampaignType;
	source: CountryCatalogSource;
	countries: AvailableCountry[];
	totalCount: number;
	nextCursor?: string;
	notes: string[];
};

export type ListAvailableCountriesSummaryData = {
	summary: string;
	totalCount: number;
	nextCursor?: string;
};

export type ProductReadiness = {
	isReady: boolean;
	missingRequirements: string[];
	nextAction?: string;
	blockers: string[];
	warnings: string[];
};

export type GetOnboardingStatusData = {
	artistId: string;
	artistName: string;
	smartCampaign: ProductReadiness;
	youtube: ProductReadiness;
	overallNextAction?: string;
};

export type GetOnboardingStatusSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetCampaignReadinessData = {
	artistId: string;
	artistName: string;
	campaignType: CampaignType;
	isReady: boolean;
	blockingIssues: string[];
	warnings: string[];
	missingInputs: string[];
	normalizedTargeting:
		| { mode: "GLOBAL" }
		| { mode: "COUNTRIES"; countries: Array<{ code: string; name: string }> };
	recommendedNextAction: string;
};

export type GetCampaignReadinessSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};

export type GetCampaignDeploymentStatusData = {
	campaignId: string;
	artistId: string;
	artistName: string;
	contentTitle: string;
	campaignType: CampaignType;
	status: CampaignDisplayStatus;
	deliveryState: "LIVE" | "PENDING" | "BLOCKED" | "PAUSED" | "ENDED";
	platforms: Array<{
		platform: "META" | "GOOGLE";
		status: string;
		linkedProviderId?: string;
		errorMessage?: string;
	}>;
	blockers: string[];
	warnings: string[];
	nextAction?: string;
};

export type GetCampaignDeploymentStatusSummaryData = {
	summary: string;
	warnings?: string[];
	actionRequired?: string[];
};
