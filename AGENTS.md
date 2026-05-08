# MCP Package Agent Rules

This folder is the public npm package `@dynamoi/mcp`. Keep this file scoped to agent policy; package positioning and submission copy belong in package metadata, `CHANGELOG.md`, `server.json`, or the MCP brain notes.

- Keep public package code framework-agnostic. Dashboard adapters and private domain logic live in `apps/dashboard/app/lib/domains/mcp` and `apps/dashboard/app/mcp`.
- Do not add ChatGPT-visible checkout tools, activation-price promises, raw ad-spend data, or internal margin language here. Use the current MCP spec and business-context guardrails before changing tool descriptions, resources, prompts, or submission copy.
- For package releases, update `package.json`, `CHANGELOG.md`, `server.json`, and Changesets together when applicable. The package version must not regress.
- Run the package checks before reporting code changes complete: `bun --cwd packages/mcp build` and `bun --cwd packages/mcp typecheck`.
- For published package release notes, use Changesets plus the package changelog policy in `.changeset/AGENTS.md`.
