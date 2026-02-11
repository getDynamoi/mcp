# MCP Publish-Gate Test Runbook (Agent-Friendly)

Goal: run a repeatable, low-touch local verification that the hosted-style MCP server works end-to-end in sandbox, including OAuth, Streamable HTTP, RBAC, and a clean-room Gemini CLI check.

This is written so an agent can execute it without needing to read the full spec.

## Preconditions

- Local main app can run with `SANDBOX_MODE=true`.
- Supabase OAuth Server (beta) enabled for the dev project.
- Supabase JWT signing uses an asymmetric key (ES256 or RS256) so JWKS verification works.
- Dynamic OAuth app registration enabled (DCR).
- You have a sandbox test user (not production) you can sign into during the first OAuth approval.

Important: after the first approval, the tests should not require any more user clicks.

## 1) Start Local App (Fixed Port)

Run the Dynamoi main app on port 3000 so all tooling defaults work and we avoid “wrong worktree on 3000” flakiness.

- Start: `SANDBOX_MODE=true PORT=3000 bun dev --filter dynamoi-main`
- Confirm: visiting `http://localhost:3000` loads the correct branch/app.

## 2) Deterministic E2E (Protocol + Auth)

This is the most important gate. It validates Streamable HTTP (SSE) behavior plus auth.

- Run:
  - `bun scripts/mcp/e2e.ts --no-open --refresh-cache ~/mcp-cleanroom/.dynamoi_mcp_refresh.json`

Expected:
- First run prints an authorization URL to stderr. You may need one consent click.
- The script ends with `OK`.

If it fails:
- Re-run once (transient).
- If it still fails, check that port 3000 is the correct worktree and that the OAuth server is still enabled.

## 3) RBAC Sanity

Create a viewer-only user and an editor user for a single artist.

For each user, run the E2E flow and then:
- Viewer: attempt one write tool (pause/resume/update budget) and confirm it returns an error envelope with kind `business` (or `validation`), not a 500.
- Editor: confirm write tools succeed and return `status: "success"` (or documented partial success).

## 4) Connected Apps Revocation

In the main app, open Connected Apps and revoke the grant for the test client.

Expected:
- Grant disappears after revoke.
- Access token from the previously-authorized client should stop working after revocation (401).

## 5) Clean-Room Gemini CLI Smoke

Goal: prove an external assistant can connect and call at least one tool without having access to the repo or local files.

- Run:
  - `bun scripts/mcp/gemini-cleanroom-smoke.ts`

Expected:
- Prints `OK`.

Notes:
- The smoke test intentionally limits `includeTools` to one tool (`dynamoi_list_artists`) because Gemini is sensitive to schema payload size.

## 6) Minimal “Real Workflow” Smoke (No Deploy Pipeline)

As an editor user:
- List artists
- List campaigns for an artist
- Fetch campaign analytics
- (Optional) Launch a campaign in sandbox and confirm idempotency:
  - Calling launch twice with the same `clientRequestId` returns the same campaign.

## Pass/Fail Criteria

Publish is “go” only if:
- Deterministic E2E ends with `OK` from a clean state.
- Viewer RBAC blocks writes cleanly (no 500s).
- Connected Apps revocation works.
- Gemini clean-room smoke prints `OK`.

