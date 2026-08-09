# Dynamoi MCP 🎧

> Let any MCP-capable AI agent help artists and labels get releases ready to promote.

[![npm version](https://img.shields.io/npm/v/@dynamoi/mcp?label=npm)](https://www.npmjs.com/package/@dynamoi/mcp)
[![license](https://img.shields.io/npm/l/@dynamoi/mcp)](./LICENSE)
[![hosted MCP](https://img.shields.io/badge/hosted%20MCP-dynamoi.com%2Fmcp-7c3aed)](https://dynamoi.com/mcp)
[![artists](https://img.shields.io/badge/built%20for-artists%20%2B%20labels-10b981)](https://dynamoi.com)

Musicians, managers, and labels already have enough to chase down: Spotify
links, artist pages, campaign setup, ad account connections, billing checks,
analytics, and launch notes.

**Dynamoi MCP lets an AI agent help with that work directly.** A connected agent
can create a free Smart Link, pull artist and campaign context, check what is
blocking a launch, start YouTube or Meta connection flows, and keep the next
promotion step clear.

It works with any MCP host that supports remote Streamable HTTP and OAuth:
ChatGPT, Claude, Gemini, local agent runtimes, internal label tools, or custom
automation.

```txt
https://dynamoi.com/mcp
```

## ✨ The Short Version

| When someone asks... | The agent can help with... |
| --- | --- |
| 🎧 "Make a link for this release." | Create a free Smart Link from Spotify and return the public URL. |
| 🚦 "Why is this campaign not ready?" | Check the missing setup: billing, platform connections, countries, assets, and launch state. |
| 📈 "What do we have live right now?" | Search artists, Smart Links, campaigns, analytics, and account status. |
| 📺 "Connect our YouTube channel." | Start the correct connection flow from the conversation. |
| 🚀 "Can we promote this?" | Keep the free-link workflow separate from managed advertising, then point to the next safe step. |

## 🎤 Who It Is For

**Artists and managers** use Dynamoi MCP to make links, check campaign setup,
and see what needs attention before a release gets promoted.

**Record labels and teams** can wire Dynamoi into internal agent workflows for
campaign checks, artist lookup, reporting, and release operations.

**Developers** can install this package when they need the public MCP contract,
schemas, OAuth metadata, transport helpers, or TypeScript types behind the hosted
Dynamoi server.

## 🔗 Smart Links First

Free Smart Links are the easiest place for an agent to help:

- Turn a Spotify release into a public landing page.
- Import an artist catalog into an artist hub.
- Return the shareable URL immediately.
- Check link status, analytics, theme/settings, and publish state.
- Update or publish a link when the user clearly asks.

That gives artists something useful right away, and it gives promotion teams a
clean next step when the release is ready to push.

## 🚦 Promotion Readiness

Before a campaign can move, a lot of small things have to be true. Dynamoi MCP
helps agents answer the practical questions:

| Question | What Dynamoi can check |
| --- | --- |
| "Is this artist ready?" | Account access, artist records, platform status, and missing setup. |
| "Can this campaign launch?" | Readiness, billing state, supported countries, media assets, and deployment status. |
| "What needs attention?" | Active campaigns, Smart Links, analytics, and next actions. |
| "Are we connected?" | YouTube and Meta connection state, plus connection-start flows where available. |

## 🧠 Built For Any MCP Agent

This is a general MCP server, not a single-chat-product integration. Use the
hosted endpoint from any MCP-capable client that supports remote Streamable HTTP:

```json
{
  "mcpServers": {
    "dynamoi": {
      "url": "https://dynamoi.com/mcp"
    }
  }
}
```

Authentication runs through Dynamoi OAuth. Users sign in with their Dynamoi
account, and the connected agent receives only the scopes needed for the tools it
calls.

## 🧰 Package Usage

Most artists and labels do **not** need to install anything. They should connect
the hosted MCP server.

Install `@dynamoi/mcp` when you are building against the public Dynamoi MCP
contract:

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

`handleMcpHttpRequest` provides stateless Streamable HTTP request handling for
serverless deployments. Authentication and authorization remain the host
application's responsibility on every request.

### What Ships In This Package

| Included | Purpose |
| --- | --- |
| Tool schemas | The public MCP contract exposed by Dynamoi. |
| Prompts and resources | Guidance for Dynamoi-specific agent workflows. |
| Protected-resource metadata | OAuth discovery metadata for compatible clients. |
| HTTP transport helpers | Stateless Streamable HTTP handling for serverless hosts. |
| TypeScript types | Integration-safe contracts for hosted server code. |

## 🛡️ Safety Model

Dynamoi MCP is built for real artist and label workflows, so the server keeps
clear boundaries around what an agent can do.

| Safety layer | What it protects |
| --- | --- |
| 🔐 OAuth scopes | Agents only get the account access the user grants. |
| 👀 Read-only hints | Read tools are marked as read-only. |
| ✍️ Mutation descriptions | Write tools describe the external action they may take. |
| ✅ User intent gates | Launch and campaign-update workflows require clear user intent. |
| 💳 Paid-flow separation | Direct paid checkout is not exposed to connected agents. |
| 🔗 Smart Link boundary | Free Smart Link creation stays separate from managed advertising launch. |

## 💬 Good First Prompts

Try these from any connected MCP agent:

> 🎧 Create a Smart Link for this Spotify release.

> 🚦 What is blocking this campaign from launching?

> 📈 Show me the active campaigns that need attention.

> 📺 Help me connect my YouTube channel.

> 🚀 Get this release ready to promote.

## 🔗 Links

| Resource | URL |
| --- | --- |
| Website | <https://dynamoi.com> |
| Hosted MCP endpoint | <https://dynamoi.com/mcp> |
| npm package | <https://www.npmjs.com/package/@dynamoi/mcp> |
| Repository | <https://github.com/getDynamoi/mcp> |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) |
