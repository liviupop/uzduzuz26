---
name: list-notes
type: data-fetch
description: Retrieve the full machine-readable index of every published note on uzinaduzina.org.
url: https://uzinaduzina.org/content/_index.json
---

# list-notes

Fetch the complete index of editorial notes published at `uzinaduzina.org`. Returns one JSON entry per note with the metadata an agent needs to decide which notes to read, in which order, and how to display them.

## Endpoint

```
GET https://uzinaduzina.org/content/_index.json
Accept: application/json
```

No authentication. No rate limit beyond Cloudflare's default. The response is regenerated whenever `python3 regen.py` runs at build time.

## Response shape

```jsonc
[
  {
    "slug": "project-democraicy",        // unique id; also the URL slug for the note
    "type": "project",                    // project | person | partner | principle | curiosity | org
    "title": "democraicy: algorithms with civic conscience",
    "kicker": "concept document · 2020 · unfunded",
    "accent": "indigo",                   // visual: indigo | ochre | green
    "subtitle": "",
    "summary": "An early concept document on algorithms with civic conscience...",
    "excerpt": "A project concept written in November 2020.",  // first sentence of body
    "year": "2020",
    "role": "lead",                       // for projects: lead | partner | beneficiary
    "order": 7,                            // sort key (lower = earlier in indexes)
    "pills": ["2020", "concept", "unfunded"]
  },
  // ... one entry per note (currently ~40 entries total)
]
```

## How to use

1. **Filter by type** to find a specific category. `type === "project"` returns the 18 projects, `type === "principle"` returns the 9 fundamental pages, etc.
2. **Sort by `order` then `slug`** to match the on-site display order.
3. **Read each note** by either:
   - Fetching its markdown source: `https://uzinaduzina.org/content/<slug>.md` (see `fetch-note-markdown` skill).
   - Linking a human reader to it: `https://uzinaduzina.org/?n=<slug>` (see `browse-notes` skill).

## Example: list every project note's title and budget summary

```javascript
const idx = await fetch("https://uzinaduzina.org/content/_index.json").then(r => r.json());
const projects = idx
  .filter(n => n.type === "project")
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
for (const p of projects) {
  console.log(`${p.title} — ${p.summary}`);
}
```

## Related

- `fetch-note-markdown` — pull the body of a specific note in its original markdown.
- `browse-notes` — link a human reader at a stack of notes.
