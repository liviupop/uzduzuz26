---
name: browse-notes
type: navigation
description: Navigate the stacked-notes UI of uzinaduzina.org by composing a URL.
url: https://uzinaduzina.org/?n=<slug1>,<slug2>,<slug3>&a=<active-index>
---

# browse-notes

Navigate the public site at `uzinaduzina.org` by constructing a URL. The site is a stacked-notes single-page application: the URL describes the entire visual stack and the currently focused column.

## URL grammar

```
https://uzinaduzina.org/?n=<slug>[,<slug>...]&a=<index>
```

- `n` (required) — comma-separated list of note slugs. Left to right is the visual order on desktop (top to bottom on mobile). Maximum useful length: about six. Example: `n=home,fundamentals,project-democraicy`.
- `a` (optional) — zero-based index of which column is the active (focused) one. Defaults to the rightmost column. Example: `a=1` makes the second column active.

## Slug conventions

| Prefix | What it points at | Example |
|---|---|---|
| `home`, `who-we-are`, `fundamentals`, `projects`, `team`, `partners`, `contact` | structurally rich pages defined in `notes.js` | `n=fundamentals` |
| `project-<slug>` | project notes (18 currently) | `n=project-goana-dupa-meteor` |
| `team-<slug>` | team profiles (7 currently) | `n=team-liviu-pop` |
| `partner-<slug>` | partner profiles | `n=partner-ccif` |
| `manifesto-<slug>` | the nine principles | `n=manifesto-living-heritage` |
| `curiosity-<slug>` | one-off side notes | `n=curiosity-dunbar-alexander-and-the-dozen` |

The full list of available slugs is published at `https://uzinaduzina.org/content/_index.json` (see also the `list-notes` skill).

## Examples

```
?n=home                                            home alone
?n=who-we-are                                      organisation note
?n=fundamentals,manifesto-living-heritage             fundamentals index + one principle alongside
?n=projects,project-democraicy                     projects index + project note
?n=home,fundamentals,project-ai4ngos                  three-column stack
?n=home,who-we-are&a=0                             two columns, with home focused
```

## When to use

When you want to point a human reader at a specific note or a meaningful stack of notes (e.g. an index page next to a specific instance), construct the URL and link to it. The user lands at exactly that view.

## Notes

- Stacks of more than six slugs are rendered correctly but become unwieldy for human reading.
- If a slug is not recognised, the column shows a "not found" placeholder; other columns render normally.
- The URL is the source of truth for state. Browser back/forward, refresh, and direct-link sharing all work.

## Related

- `list-notes` — get the full machine-readable index of available slugs.
- `fetch-note-markdown` — get the original markdown source of any note.
- `open-note-stack` (WebMCP) — open a stack programmatically when an agent is running in a browser viewing the site.
