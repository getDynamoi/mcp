// USD campaign budget minimums published to MCP clients. This package is
// standalone, so it cannot import web-shared; a parity test in
// scripts/validate/__tests__ pins these to MIN_TOTAL_BUDGET_YOUTUBE and the
// managed-ads catalog USD row.
export const USD_BUDGET_MINIMUMS = {
	smartCampaign: { dailyUsd: 10, totalUsd: 50 },
	youtube: { dailyUsd: 10, totalUsd: 75 },
} as const;
