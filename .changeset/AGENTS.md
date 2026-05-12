# Changesets

We use Changesets to manage version bumps and release notes for published packages.

Common commands:
- Create a changeset: `bun --cwd packages/mcp changeset`
- Apply changesets (bump versions): `bun --cwd packages/mcp changeset:version`
- Publish to npm (in CI): `bun --cwd packages/mcp changeset:publish`

Note: We maintain package changelogs manually using Keep a Changelog (`packages/mcp/CHANGELOG.md`), so Changesets changelog generation is disabled in `.changeset/config.json`.
