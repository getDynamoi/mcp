/**
 * Current prospective daily funding consent. A launch or resume funds one
 * first window (the rest of the Pacific day plus the next full Pacific day)
 * in one charge; routine renewals then fund each following Pacific day.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION =
	"managed-ads-prospective-daily-v3";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY =
	"Authorize automatic card funding for this campaign's daily budget, after available credits and campaign funds. Fund the rest of today and all of tomorrow (Pacific time) now, then each following day up to one hour before it starts, until I pause or end the campaign. Unused funds become available after delivery is reconciled.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH =
	"53647786746f962c91f5cad78d8bba531c478109041b2808a4a81efbe380abf1";

/**
 * The previous daily consent. Campaigns that accepted it keep renewing under
 * its exact terms; new launches and resumes require the current version.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_VERSION =
	"managed-ads-prospective-daily-v2";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY =
	"Authorize automatic card funding for this campaign's daily budget, after available credits and campaign funds. Fund the first approximately 24 hours now and each following 24-hour window up to one hour before it starts, until I pause or end the campaign. Unused funds become available after delivery is reconciled.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY_HASH =
	"06bbd517d58f345a767be9aaeb59f4959d11c6db16e7d07cb889f3ce7950f805";

/** Exact (version, hash) pairs whose accepted campaigns may renew daily. */
export function isRenewableProspectiveBudgetFundingConsent(input: {
	copyHash: string;
	copyVersion: string;
}): boolean {
	return (
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY_HASH)
	);
}
