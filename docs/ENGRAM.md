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

---
description: Memoria automática Engram — Octopus carga contexto al iniciar y guarda al terminar
alwaysApply: true
---

# Memoria automática Engram (Octopus / wallet.ia)

Este repo tiene el servidor MCP **engram** (`.cursor/mcp.json`). Debes usar sus herramientas **sin que el usuario lo pida** en cada tarea de código real.

## Al empezar una tarea sustantiva (después de entender el pedido)

1. Si es la primera acción útil del hilo o no hay sesión clara: **`mem_session_start`**.
2. **`mem_context`** para el proyecto **`wallet.ia`** (o el nombre de proyecto que aplique).
3. Si el tema es concreto: **`mem_search`** con una consulta corta en inglés o español (según cómo suelen guardarse las memorias aquí).

## Antes de dar por cerrada la tarea o tras cambios con impacto

1. **`mem_save`** con:
   - **title**: prefijo `wallet.ia:` + resumen breve.
   - **type**: coherente con el trabajo (p. ej., decisión, bugfix, feature, nota).
   - Cuerpo con líneas: `What:` / `Why:` / `Where:` / `Learned:` (rutas o módulos tocados).

2. Al cerrar sesión de trabajo o el hilo de forma definitiva: **`mem_session_summary`** y luego **`mem_session_end`**.

## Excepciones (no hace falta guardar)

- Cambios triviales (typo, formato) sin efecto en comportamiento ni decisiones.

## Prohibido

- Confiar solo en el historial del chat para decisiones que deban repetirse en otra sesión.

Usa siempre las herramientas MCP de Engram; no sustituyas por explicaciones largas en el chat lo que debe persistir en memoria.
