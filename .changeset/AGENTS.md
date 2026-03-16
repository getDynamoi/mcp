# Changesets

We use Changesets to manage version bumps and release notes for published packages.

Common commands:
- Create a changeset: `bunx changeset`
- Apply changesets (bump versions): `bunx changeset version`
- Publish to npm (in CI): `bunx changeset publish`

Note: We maintain package changelogs manually using Keep a Changelog (`packages/mcp/CHANGELOG.md`), so Changesets changelog generation is disabled in `.changeset/config.json`.
