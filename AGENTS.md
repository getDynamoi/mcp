# MCP Package Agent Rules

Public standalone package `@dynamoi/mcp` (boundaries statically guarded by AST-grep).

- Releases update `package.json`, `CHANGELOG.md`, `server.json`, and `src/version.ts` together without version regression.
- Verify changes with `bun --cwd packages/mcp build` and `bun --cwd packages/mcp typecheck`.

