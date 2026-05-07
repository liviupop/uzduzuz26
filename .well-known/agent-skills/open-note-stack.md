---
name: open-note-stack
type: webmcp-tool
description: Open one or more notes in the user-visible stacked-notes UI. WebMCP tool exposed only to in-browser agents.
url: https://uzinaduzina.org/
---

# open-note-stack

A WebMCP tool registered by `app.js` via `navigator.modelContext.provideContext()`. Available to AI agents that are running inside a browser tab pointed at `uzinaduzina.org`. The tool mutates the user-visible UI: it pushes a stack of notes onto the page so the human reader sees them.

## Tool signature

```jsonc
{
  "name": "open_note_stack",
  "description": "Open one or more notes in the user-visible stacked-notes UI. Useful when guiding a human reader to a particular page.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slugs": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 1,
        "maxItems": 6,
        "description": "Ordered slugs to push onto the stack, left-to-right. Last one becomes the active column."
      }
    },
    "required": ["slugs"],
    "additionalProperties": false
  }
}
```

## Behaviour

- Validates each slug against `^[\w-]+$`. Invalid slugs are silently dropped.
- Truncates the array to a maximum of six entries.
- Replaces the current stack: any previously open columns are closed.
- The last slug in the array becomes the active (focused) column.
- Triggers a re-render with the same animation as a manual user click.

## Return value

```json
{
  "opened": ["projects", "project-goana-dupa-meteor"],
  "activeIndex": 1
}
```

Or, on error:

```json
{ "error": "no valid slugs" }
```

## When to use

- An agent is running inside the user's browser (via WebMCP) and wants to direct attention to a specific note in response to a conversational query.
- Example: user asks "show me the most recent astronomy work"; agent calls `open_note_stack({ slugs: ["projects", "project-goana-dupa-meteor"] })` to render the projects index alongside the focused note.

## Companion tools

The same `app.js` block exposes two read-only tools alongside this one:

- `list_notes` — returns the contents of `_index.json`. See the `list-notes` skill for an HTTP-equivalent.
- `fetch_note_markdown` — returns the markdown body of a single note. See the `fetch-note-markdown` skill for an HTTP-equivalent.

If an agent is **not** running inside the browser (for example, a server-side agent working from cURL), the tools above degrade to their HTTP equivalents at `https://uzinaduzina.org/content/_index.json` and `https://uzinaduzina.org/content/<slug>.md`.

## Specification

WebMCP draft: https://webmachinelearning.github.io/webmcp/

## Related

- `browse-notes` — same intent, but as a URL the user clicks rather than a tool the agent calls.
- `list-notes`, `fetch-note-markdown` — read-only data access.
