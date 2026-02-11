# Dynamoi MCP Server — Engineer Notes (Onboarding + Debugging)

This doc is for maintainers. It answers: where does the MCP server live, how does a request flow through the system, how do you add/modify tools safely, and how do you test it end-to-end as an external client.

If you are new: read this first, then use `packages/mcp/docs/spec.md` as the full reference.

## Big Picture

We ship one **hosted MCP endpoint** (`/mcp`) inside the main Next.js app. The public MCP package (`@dynamoi/mcp`) defines the **tool contract** (names, schemas, annotations, output shapes) and provides the Streamable HTTP transport glue.

The Next.js app provides the **implementation** (auth, RBAC, domain calls, money formatting, platform calls).

Key design goals:
- Keep the published tool contract stable and explicit.
- Never leak internal spend/margin details (all money values must be display-safe).
- Make local end-to-end testing deterministic and low-touch.

## Where Things Live

Public contract (published):
- `packages/mcp/`
  - `src/server/tools.ts`: tool names + input schemas + annotations
  - `src/server/create-server.ts`: registers tools/resources/prompts
  - `src/transport/http.ts`: Streamable HTTP transport handler
  - `src/auth/*`: JWT verification + OAuth protected-resource helpers

Private implementation (not published):
- `apps/main/app/mcp/route.ts`: canonical HTTP entrypoint
- `apps/main/app/lib/domains/mcp/adapter.ts`: maps tool calls to tool handlers
- `apps/main/app/lib/domains/mcp/tools/*`: tool handlers (validate, call domain actions, serialize safe outputs)
- `apps/main/app/oauth/consent/page.tsx`: local consent UI used by Supabase OAuth server
- `apps/main/app/.well-known/oauth-protected-resource/route.ts`: RFC 9728 protected resource metadata

## Request Flow (Runtime)

1. Client calls `POST /mcp` (Streamable HTTP JSON-RPC).
2. `apps/main/app/mcp/route.ts` (canonical entrypoint, re-exporting shared handlers):
   - extracts Bearer token
   - verifies JWT (JWKS) and checks `aud` against allowlist (stricter in prod)
   - resolves the Supabase user for the token
   - builds the MCP adapter (`createMcpAdapter({ user, clientId })`)
   - runs `handleMcpHttpRequest(...)` from `@dynamoi/mcp` (sessions are bound to `sub+clientId` via `sessionContextKey`)
3. `@dynamoi/mcp` tool router:
   - validates tool input with Zod schema from `packages/mcp/src/server/tools.ts`
   - invokes the adapter function
4. Tool handler in `apps/main/app/lib/domains/mcp/tools/*`:
   - enforces RBAC (viewer vs editor)
   - calls existing domain logic (campaigns/billing/etc.)
   - serializes outputs to MCP DTOs that are margin-safe
5. Response returns either JSON or SSE (Streamable HTTP).

## Monitoring MCP UX (No Dashboard Needed)

We intentionally rely on structured logs + Sentry so audits stay simple and reproducible.

### Log Surfaces

- Route-level MCP logs: `surface == "main.mcp.http.route"`
- Tool/domain MCP logs: `surface == "main.domains.mcp.server"`

### High-Signal Events

- `MCP_REQUEST_COMPLETED` — every successful MCP request path (includes tool, client, bucket, status, duration)
- `MCP_AUTH_MISSING_BEARER_TOKEN` / `MCP_AUTH_JWT_VERIFY_FAILED` — auth failures
- `MCP_RATE_LIMIT_EXCEEDED` — loop pressure / client overuse
- `MCP_TOOL_CALL_COMPLETED` / `MCP_TOOL_CALL_RETURNED_ERROR` — per-tool UX outcomes
- `MCP_TOOL_*_FAILED` (warn/error) — classified failures from tool execution

### Assistant Attribution

- Use `context.clientId` first (OAuth client ID, strongest signal).
- Use `context.clientHint` second (from `x-dynamoi-client`, fallback to user-agent prefix).

### Where To Query

Use the copy/paste queries in:
- `.claude/skills/querying-data/references/cli-examples.md` → **MCP Server UX Audit (Axiom)**

### Sentry Behavior

- Validation/business failures remain warning-level (not Sentry noise).
- Platform/unknown failures continue through error-level logging and are sent to Sentry with enriched MCP context (client/tool/user/timing).

## Adding Or Modifying A Tool (Safe Checklist)

1. **Define the tool contract**
   - Add/update schema + annotations in `packages/mcp/src/server/tools.ts`.
   - Keep the schema strict enough that the domain layer will accept it.
   - Be explicit about client-facing constraints (budget minimums, required fields, etc.).

2. **Register the tool**
   - Ensure `packages/mcp/src/server/create-server.ts` routes the tool name to an adapter method.

3. **Implement in the adapter**
   - Add a method to the adapter type and map it in `apps/main/app/lib/domains/mcp/adapter.ts`.

4. **Implement the handler**
   - Add/update handler in `apps/main/app/lib/domains/mcp/tools/*`.
   - Use the existing domain actions; do not duplicate business logic.
   - Enforce RBAC at the MCP boundary (clear, client-facing errors).

5. **Validate money + safety**
   - All money values in tool outputs must be display-safe (no internal/raw platform spend).
   - Do not return both "Dynamoi display spend" and "platform spend" in the same response.

6. **Test**
   - Run deterministic E2E (see below).
   - If it changes tool schema shape, re-test Gemini clean-room (Gemini is schema-sensitive).

## Local Testing (Deterministic, Low-Touch)

There are two “layers” of testing:

1. **Deterministic scripts** (recommended first)
   - Best for protocol + auth + tool plumbing.
   - Does not depend on LLM behavior.

2. **Clean-room LLM tests** (Gemini CLI)
   - Proves a real assistant can discover tools and call them correctly.
   - Must run without access to this repo or local files.

### OAuth: Avoid Repeated Manual Approval Clicks

The first local OAuth approval will always require one click. After that, use refresh-token caching so subsequent runs do not depend on a local callback server being alive.

- `scripts/mcp/oauth-token.ts` supports `--refresh-cache <path>` to store `{ clientId, refreshToken }`.
- Recommended cache location: `~/mcp-cleanroom/.dynamoi_mcp_refresh.json`.
- Subsequent runs refresh in the background (no browser, no `:7777` callback needed).

### One-Command “Is It Working?”

- `bun scripts/mcp/e2e.ts --no-open --refresh-cache ~/mcp-cleanroom/.dynamoi_mcp_refresh.json`

This obtains an access token (refreshing if possible) then runs the Streamable HTTP protocol smoke tests.

### Gemini CLI Clean-Room Smoke

- `bun scripts/mcp/gemini-cleanroom-smoke.ts`

What it does:
- runs Gemini from `~/mcp-cleanroom`
- disables Gemini core tools
- injects a short-lived access token only for the session
- restores settings afterward so we do not leave access tokens on disk

Important: Gemini is sensitive to tool schema size and some JSON Schema keywords. Start with a tiny `includeTools` allowlist (the smoke script defaults to just `dynamoi_list_artists`) and expand gradually.

## Common “Gotchas” (Real-World)

### 1) Port Collisions / Wrong Worktree On Port 3000

If a different worktree is bound to the port you think you’re using, OAuth metadata/JWKS fetches can return HTML or 404, and the auth flow will look random.

Fix: run the correct branch on a fixed port in tmux (recommended), then use the deterministic scripts.

### 2) Gemini Schema Compatibility

Gemini’s MCP integration can reject large or “fancy” schemas with upstream `INVALID_ARGUMENT` errors.

Mitigations we use:
- Keep `includeTools` small for Gemini runs.
- The server strips `$schema` from tool schemas.
- When `x-dynamoi-client: gemini-cli` is present, the server sanitizes tool schemas down to a minimal keyword subset.

### 3) Streamable HTTP SSE Framing

If you rewrite SSE responses, do not use regexes that can consume the blank-line frame separator (`\\n\\n`). That will break clients that parse SSE frames.

## What “Ready To Publish” Means (High Bar)

Before publishing `@dynamoi/mcp` publicly:
- deterministic E2E passes
- Gemini clean-room smoke passes
- auth + connected-apps revocation works
- no margin leakage confirmed
- failure modes (rate limit, platform failures) return the right error envelopes

## Versioning + Changelog (Keep a Changelog + SemVer)

We keep the changelog human-curated so it stays readable for product and directory reviewers.

Rules of thumb:
- Add entries to `packages/mcp/CHANGELOG.md` under `[Unreleased]` as you work.
- For any release, move the relevant items from `[Unreleased]` into a new version section and date it.
- Use Changesets only for version bumps:
  - Create a changeset: `bunx changeset`
  - Apply version bumps: `bunx changeset version`

Changelog generation is disabled in Changesets config on purpose (so it does not rewrite our Keep a Changelog format).
