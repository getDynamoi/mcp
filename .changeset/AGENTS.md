# Changesets

Only `changeset publish` is used. The public repository's `publish` workflow
runs it (`bun run changeset:publish`) on every push to `main`. It publishes
the `package.json` version to npm only when that version is not on npm yet,
and authenticates with npm Trusted Publishing (GitHub OIDC).

Versions are bumped by hand. Keep `package.json`, the `server.json` version,
`src/version.ts` and `CHANGELOG.md` in sync (see `CONTRIBUTING.md`).
Do not add Changeset `.md` files or run `changeset version`: in this monorepo
`@changesets/cli` resolves the workspace from the repo root, which has no
`.changeset` directory. Changelog generation is disabled in `config.json`
because `CHANGELOG.md` is maintained by hand in Keep a Changelog format.
