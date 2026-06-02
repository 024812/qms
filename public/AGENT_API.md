# QMS Agent API

This document is intended for AI agents such as OpenClaw that need to query or update QMS data through a restricted API surface.

Base URL:

```text
https://qms.414080.xyz
```

OpenAPI document:

```text
https://qms.414080.xyz/api/agent/openapi.json
```

Tool endpoint:

```text
POST https://qms.414080.xyz/api/agent/tools
```

## Authentication

Use a user-created API key as a Bearer token:

```http
Authorization: Bearer qms_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

Users create and revoke API keys in QMS under:

```text
Settings -> Agent API Keys
```

API keys inherit the same subsystem permissions as the user who created them:

- Admin users can access all agent tools.
- Users subscribed to `quilts` can access quilt and usage tools.
- Users subscribed to `cards` can access card tools.
- Revoked keys stop working immediately.

## Request Shape

All calls use the same endpoint and select a whitelisted tool by name:

```json
{
  "tool": "quilts.search",
  "input": {
    "limit": 10
  }
}
```

Write tools must include either `dryRun: true` or both `confirm: true` and an `idempotencyKey`:

```json
{
  "tool": "quilts.update",
  "input": {
    "id": "quilt-id",
    "location": "Master Bedroom"
  },
  "confirm": true,
  "idempotencyKey": "agent-run-20260602-0001"
}
```

Use `dryRun: true` before writes when possible:

```json
{
  "tool": "cards.create",
  "input": {
    "playerName": "Example Player",
    "sport": "BASKETBALL",
    "year": 2024,
    "brand": "Example Brand"
  },
  "dryRun": true
}
```

## Tools

Read tools:

- `quilts.search`
- `quilts.get`
- `usage.search`
- `cards.search`
- `cards.get`
- `settings.read`

Write tools:

- `quilts.create`
- `quilts.update`
- `quilts.changeStatus`
- `usage.create`
- `usage.end`
- `cards.create`
- `cards.update`

## Examples

Search quilts:

```bash
curl https://qms.414080.xyz/api/agent/tools \
  -H "Authorization: Bearer $QMS_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool":"quilts.search","input":{"limit":10,"status":"STORAGE"}}'
```

Get one card:

```bash
curl https://qms.414080.xyz/api/agent/tools \
  -H "Authorization: Bearer $QMS_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool":"cards.get","input":{"id":"card-id"}}'
```

Preview a quilt status change:

```bash
curl https://qms.414080.xyz/api/agent/tools \
  -H "Authorization: Bearer $QMS_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool":"quilts.changeStatus","input":{"quiltId":"quilt-id","status":"IN_USE"},"dryRun":true}'
```

Execute a quilt status change:

```bash
curl https://qms.414080.xyz/api/agent/tools \
  -H "Authorization: Bearer $QMS_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool":"quilts.changeStatus","input":{"quiltId":"quilt-id","status":"IN_USE"},"confirm":true,"idempotencyKey":"agent-run-20260602-0002"}'
```

## Agent Instructions

Before using this API:

1. Fetch `/api/agent/openapi.json` and use it as the contract.
2. Use read tools before write tools.
3. For every write, explain the intended change to the user first.
4. Prefer `dryRun: true` before executing writes.
5. Never store or reveal API keys in conversation logs or generated documents.
6. Treat missing permissions as a user configuration issue, not as a reason to bypass this API.
