# Dynamoi MCP

Music promotion tools for AI assistants.

Dynamoi lets ChatGPT, Claude, Gemini, and other MCP clients work with an artist's
real promotion workspace: Smart Links, artist hubs, campaign readiness, platform
connections, YouTube growth, Meta campaigns, billing status, and launch workflows.

The normal way to use it is the hosted remote MCP server:

```txt
https://dynamoi.com/mcp
```

This npm package is the public contract behind that server: tool schemas, resource
metadata, transport helpers, and TypeScript types for the hosted implementation.

## What It Does

| Area | Assistant can help with |
| --- | --- |
| Free Smart Links | Create Spotify release links, import artist catalogs, return public URLs, inspect analytics, update themes, and publish or unpublish links. |
| Artist workspace | List artists, search records, summarize account state, and explain the best next action for a brand-new or returning user. |
| Campaign planning | Check launch readiness, country availability, billing state, platform connections, and media assets before anything is created. |
| Managed campaigns | Launch, pause, resume, and update Dynamoi campaign workflows after clear user confirmation. |
| YouTube growth | Start YouTube channel linking and inspect campaign/account readiness for creator growth workflows. |
| OpenAI connectors | Expose `search` and `fetch` for ChatGPT Deep Research style retrieval. |

## Connect

Use Dynamoi from the ChatGPT app directory, or add the remote server URL to any MCP
client that supports Streamable HTTP remote servers.

```json
{
  "mcpServers": {
    "dynamoi": {
      "url": "https://dynamoi.com/mcp"
    }
  }
}
```

Authentication is handled through Dynamoi OAuth. Users sign in with their Dynamoi
account, and the assistant only receives the scopes needed for the tools it calls.

## Why Artists Use It

Most music tools stop at a dashboard. Dynamoi is built for the moment after the
dashboard exists, when an artist asks:

- "Make me a link for this release."
- "What is blocking my campaign?"
- "Which countries can I launch in?"
- "Connect my YouTube channel."
- "Get my Smart Link ready, then help me promote it."

The assistant can move through those steps with the user instead of sending them
back and forth between tabs.

## Tool Surface

The public server includes tools for:

- account overview and routing
- artist and campaign search
- artist analytics
- campaign lists, details, readiness, deployment status, and updates
- billing and platform status checks
- Meta and YouTube connection starts
- media asset selection
- managed campaign launch workflows
- Smart Link creation, listing, details, analytics, settings, and publishing
- OpenAI `search` and `fetch`

The server also publishes prompts and resources that teach assistants how to answer
Dynamoi-specific questions without over-calling tools or creating paid workflows
when the user only asked for a free Smart Link.

## Package Usage

Most users do not need to install this package. Install it when you are working on
the Dynamoi MCP server implementation, testing the public contract, or consuming
the exported schemas and types.

```bash
npm install @dynamoi/mcp
```

```ts
import {
  buildProtectedResourceMetadata,
  createDynamoiMcpServer,
  handleMcpHttpRequest,
} from "@dynamoi/mcp";
```

The server factory expects an adapter that connects the public MCP contract to
Dynamoi's private application services:

```ts
const server = createDynamoiMcpServer({
  adapter,
  websiteUrl: "https://dynamoi.com",
});
```

`handleMcpHttpRequest` provides Streamable HTTP request handling with session
binding so an MCP session cannot drift across authenticated users.

## Safety Model

- Read tools are annotated as read-only.
- Mutating tools describe the external action they may take.
- Launch and campaign-update workflows require explicit user intent.
- Direct paid checkout is not exposed through the ChatGPT-visible tool surface.
- Smart Link creation is separate from managed advertising launch.

## Links

- Website: <https://dynamoi.com>
- Hosted MCP endpoint: <https://dynamoi.com/mcp>
- Package: <https://www.npmjs.com/package/@dynamoi/mcp>
- Repository: <https://github.com/getDynamoi/mcp>
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
