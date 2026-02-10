# Contributing

Thanks for taking the time to contribute!

This repository is primarily intended as the public MCP contract for Dynamoi. The hosted server implementation lives inside Dynamoi's main app, but changes to tool contracts, schemas, and types can be proposed here.

## Development

Requirements:
- Bun (see `.github/workflows/validate.yml` for the pinned version)

Common commands:
- Install: `bun install`
- Build: `bun run build`

## Release Process

We use Semantic Versioning and Keep a Changelog.

- Update `CHANGELOG.md` under `[Unreleased]`
- Create a Changeset: `bun run changeset`
- Apply version bumps (maintainers): `bun run changeset:version`
- Publish (maintainers / CI): `bun run changeset:publish`

