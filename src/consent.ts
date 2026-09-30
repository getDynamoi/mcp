/**
 * Current prospective daily funding consent. A launch or resume funds one
 * first window (the rest of today plus the next full day) in one charge;
 * routine renewals then fund each following day. v5 removes the funding time
 * zone from the v4 copy; its funding and collection terms are identical.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION =
	"managed-ads-prospective-daily-v5";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY =
	"Automatically charge my payment method for this campaign's daily budget, after credits and campaign funds: the rest of today and tomorrow now, then each day ahead, until I pause or end the campaign. Unused funds stay available.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH =
	"14a318c6ef3defc44a13aa4813f0af9d3432db1c2910bada98581e762b35f9e2";

/**
 * The previous daily consent, with the same terms as v5 plus a funding time
 * zone in the copy. Campaigns that accepted it keep renewing under it; new
 * launches and resumes require v5.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_VERSION =
	"managed-ads-prospective-daily-v4";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY =
	"Automatically charge my payment method for this campaign's daily budget, after credits and campaign funds: the rest of today and tomorrow (Pacific time) now, then each day ahead, until I pause or end the campaign. Unused funds stay available.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY_HASH =
	"e40485780d7b025c7a10bde969a25eecdcb0b4ebf1783251440e870fd8e10a60";

/**
 * The Pacific-day consent, with the same terms as v4. Campaigns that
 * accepted it keep renewing under it; new launches and resumes require v5.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_VERSION =
	"managed-ads-prospective-daily-v3";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY =
	"Authorize automatic card funding for this campaign's daily budget, after available credits and campaign funds. Fund the rest of today and all of tomorrow (Pacific time) now, then each following day up to one hour before it starts, until I pause or end the campaign. Unused funds become available after delivery is reconciled.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY_HASH =
	"53647786746f962c91f5cad78d8bba531c478109041b2808a4a81efbe380abf1";

/**
 * The earlier 24-hour-window daily consent. Campaigns that accepted it keep
 * renewing under its exact terms; new launches and resumes require v5.
 */
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_VERSION =
	"managed-ads-prospective-daily-v2";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY =
	"Authorize automatic card funding for this campaign's daily budget, after available credits and campaign funds. Fund the first approximately 24 hours now and each following 24-hour window up to one hour before it starts, until I pause or end the campaign. Unused funds become available after delivery is reconciled.";
export const PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY_HASH =
	"06bbd517d58f345a767be9aaeb59f4959d11c6db16e7d07cb889f3ce7950f805";

/**
 * Whether a client-submitted consent is exactly the current (version, hash)
 * pair. New launches and resumes accept only this pair; earlier versions stay
 * renewable for campaigns that already accepted them, but a client must not
 * be able to name one for a new authorization after showing the current copy.
 */
export function isCurrentProspectiveBudgetFundingConsent(input: {
	copyHash: string;
	copyVersion: string;
}): boolean {
	return (
		input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_VERSION &&
		input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_COPY_HASH
	);
}

/** Exact (version, hash) pairs whose accepted campaigns may renew daily. */
export function isRenewableProspectiveBudgetFundingConsent(input: {
	copyHash: string;
	copyVersion: string;
}): boolean {
	return (
		isCurrentProspectiveBudgetFundingConsent(input) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V4_COPY_HASH) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V3_COPY_HASH) ||
		(input.copyVersion === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_VERSION &&
			input.copyHash === PROSPECTIVE_BUDGET_FUNDING_CONSENT_V2_COPY_HASH)
	);
}
