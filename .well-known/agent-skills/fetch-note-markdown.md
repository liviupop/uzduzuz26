---
name: fetch-note-markdown
type: data-fetch
description: Retrieve the original Markdown source of any single note on uzinaduzina.org by slug.
url: https://uzinaduzina.org/content/<slug>.md
---

# fetch-note-markdown

Fetch the original Markdown source of any editorial note. The site deliberately serves Markdown alongside the rendered HTML, so AI agents and crawlers can consume the source without having to parse out of the SPA shell.

## Endpoint

```
GET https://uzinaduzina.org/content/<slug>.md
Accept: text/markdown
```

`<slug>` is the note id (no `.md` extension — that is added in the URL). Get the list of available slugs from the `list-notes` skill, or browse the directory listing at `https://uzinaduzina.org/content/`.

The response is the raw `.md` file with YAML-style front matter intact at the top, then the Markdown body.

## Response shape

```markdown
---
title: "democraicy: algorithms with civic conscience"
slug: democraicy
type: project
kicker: "concept document · 2020 · unfunded"
accent: indigo
pills:
  - 2020
  - concept
  - unfunded
role: "lead"
order: 7
summary: "An early concept document on algorithms with civic conscience. Never funded; still readable."
---

A project concept written in November 2020. Never funded as such, but it became the seed of a line of thinking we have continued in every workshop we have run on technology since.

## what it was

In the autumn of 2020, when mass-market AI was still a distant promise...
```

## Front-matter conventions

The front matter is a strict subset of YAML; an agent can parse it line-by-line:

| Field | Type | Notes |
|---|---|---|
| `title` | string | display title |
| `slug` | string | matches the filename, also the URL slug |
| `type` | string | `project` / `person` / `partner` / `principle` / `curiosity` / `org` |
| `kicker` | string | small label shown above the title |
| `accent` | string | `indigo` / `ochre` / `green` |
| `subtitle` | string | optional one-liner below the title |
| `summary` | string | tagline shown in the index |
| `pills` | array of strings | tag chips; `\|on` suffix marks the highlighted variant |
| `role` | string | for projects: `lead` / `partner` / `beneficiary` |
| `order` | integer | display order in indexes |

## Body conventions

Standard GitHub-flavoured Markdown plus:

- **First paragraph after `# H1`** is rendered as the lede (italic, accented left rule).
- **Internal links** are resolved against the slug namespace. `[CCIF](partner-ccif)` and `[CCIF](/partners/ccif)` both resolve to the same note.
- **Raw HTML lines** (e.g. `<iframe>`) pass through verbatim.
- **Tables**, blockquotes, ordered/unordered lists, code spans all render normally.

## Examples

```bash
# Fetch a project note
curl https://uzinaduzina.org/content/project-goana-dupa-meteor.md

# Fetch a manifesto principle
curl https://uzinaduzina.org/content/manifesto-living-heritage.md

# Fetch the who-we-are page
curl https://uzinaduzina.org/content/who-we-are.md
```

## Caveats

- The home page, manifesto outer page, and contact page are **not** served as `.md` — they live in `notes.js` because they have richer structure (cards, constellation, etc.). For those, use the `browse-notes` skill or read `llms.txt` for a flattened summary.
- Several notes contain `<iframe>` references to interactive diagrams under `/assets/diagrams/`. The iframes are part of the Markdown source.

## Related

- `list-notes` — get the index of every available slug.
- `browse-notes` — point a human reader at a rendered stack instead of the raw markdown.
