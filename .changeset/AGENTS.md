# Changesets

We use Changesets to manage version bumps and release notes for published packages.

Common commands:
- Create a changeset: `bun --cwd packages/mcp changeset`
- Apply changesets (bump versions): `bun --cwd packages/mcp changeset:version`
- Publish to npm (in CI): `bun --cwd packages/mcp changeset:publish`

Current caveat: `@changesets/cli` resolves the workspace from the repo root in
this monorepo, and the repo root does not have a `.changeset` directory. Until a
root-level Changesets workflow exists, manual package publishes should keep
`package.json`, `server.json`, `src/version.ts`, and `CHANGELOG.md` synced
directly. We still maintain package changelogs manually using Keep a Changelog
(`packages/mcp/CHANGELOG.md`), so Changesets changelog generation is disabled in
`.changeset/config.json`.
