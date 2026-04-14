# Engram Memory Integration (Octopus + Cursor)

This project is configured to use `engram` as persistent memory for coding agents.

## 1) Install Engram

Install the binary on Windows, then verify:

```powershell
engram version
```

Reference repository and official setup docs:
- https://github.com/Gentleman-Programming/engram

## 2) MCP Configuration

This repository includes `.cursor/mcp.json` with:

- Server name: `engram`
- Command: `engram mcp`

After installing the binary, restart Cursor so the MCP server is loaded.

## 2b) Automático en Cursor (Octopus)

The rule `.cursor/rules/engram-automatic-memory.mdc` is set to **always apply**: the agent must call Engram MCP tools at task start (context/search) and before finishing (save). Restart Cursor after changing rules.

## 3) Recommended workflow for Octopus

When you finish relevant work (feature, bugfix, architecture decision), save memory:

```powershell
engram save "wallet.ia: auth flow fixed" "What: ... Why: ... Where: ... Learned: ..."
```

Before starting a new task, retrieve context:

```powershell
engram context wallet.ia
engram search "keyword about feature or bug"
```

## 4) NPM shortcuts

Project scripts:

- `npm run memory:context` -> `engram context wallet.ia`
- `npm run memory:search -- "query"` -> `engram search "query"`
- `npm run memory:stats` -> `engram stats`
- `npm run memory:tui` -> `engram tui`

## 5) Team convention (suggested)

For each memory entry, keep this structure:

- `What`: what changed
- `Why`: reason for the change
- `Where`: files/modules touched
- `Learned`: caveat, pitfall, or principle for future tasks

This makes retrieval quality much better over time.

