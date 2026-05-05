# uzinaduzina · website

A static, stacked-notes website for uzinaduzina (Cluj-Napoca, Romania). HTML, CSS, and JS only. No build step. Drop a `.md` file into `content/` and link to it: it appears.

The site is designed to be readable both by humans and by AI crawlers. The audience priority is unusual: AI crawlers first, European grant evaluators second, partners third, participants fourth, internal team fifth. This shapes everything (no JS required for content, Markdown source served alongside the rendered note, semantic HTML5, llms.txt at the root, pro-AI robots.txt).

## what's here

```
.
├── index.html              the shell: header, sidebar, stack
├── app.js                  the renderer: stack state, URL sync,
│                           markdown loader, constellation viz
├── notes.js                content for the structurally rich pages:
│                           home, who-we-are, manifesto, projects index,
│                           team, partners, contact
├── content/                 ← drop .md files here. one per note.
│   ├── project-*.md        17 project notes
│   ├── team-*.md           team profiles
│   └── partner-*.md        partner profiles
├── assets/
│   ├── tokens.css           CSS custom properties (colours, type, spacing)
│   ├── site.css             component styles (notes, blocks, constellation)
│   ├── data.js              the partner-and-project network data (used by
│   │                        the constellation on the partners page)
│   ├── logo-uzinaduzina.png the wordmark + factory silhouette
│   ├── illustration-*.svg   three line illustrations (press, balcony, radio)
│   └── images/              ← drop project / note images here
├── fonts/                   self-hosted Bitter (regular + italic, variable)
├── llms.txt                 AI crawler index (https://llmstxt.org/)
├── robots.txt               pro-AI; allows GPTBot, ClaudeBot, etc.
└── sitemap.xml              all canonical URLs
```

## run it locally

You need a local server, because the markdown loader uses `fetch()` and modern browsers block `fetch()` from `file://` URLs.

```sh
cd uzduz25
python3 -m http.server 8080
# open http://localhost:8080
```

Any static server works (`python3 -m http.server`, `npx serve`, `caddy file-server`, GitHub Pages, Netlify, etc.). There is nothing to build.

## URLs

The whole site is one HTML page (`index.html`) and the visible content is driven by a `?n=` query parameter holding a comma-separated stack of note slugs. Examples:

```
/                                                   → home alone
/?n=manifesto                                       → manifesto alone
/?n=home,project-ai-and-democracy                   → home + AI & Democracy on top
/?n=projects,project-goana-dupa-meteor,partner-ccif → three columns
```

Click a link inside a note: it pushes a new column to the right.

## adding a new note (the .md way)

The fast loop, end-to-end:

```sh
# 1. drop a file with the right slug
$EDITOR content/project-my-new-thing.md

# 2. regenerate the auto-index
python3 regen.py

# 3. refresh the browser. it appears in the relevant index page.
```

That's it. No manifest to update, no notes.js to edit, no server to restart. The index pages (projects, team, manifesto, partners, curiosities) read from `content/_index.json`, which `regen.py` rebuilds from the front matter of every `.md` in `content/`.

### filename convention

Filename without `.md` is the note id used in `?n=...`. The prefix tells the indexer what type the note is, so it lands in the right index page:

- Project notes:        `content/project-<slug>.md`
- Team profiles:        `content/team-<slug>.md`
- Partner profiles:     `content/partner-<slug>.md`
- Manifesto principles: `content/manifesto-<slug>.md`
- Curiosities:          `content/curiosity-<slug>.md`
- One-offs:             `content/<slug>.md` (won't appear in any index)

You can override the type by setting `type:` in the front matter, but matching the prefix to the type keeps things obvious.

### front matter

```yaml
---
title: "The display title"
slug: project-my-new-thing      # must match filename (no .md)
type: project                   # project | person | partner | principle | curiosity | org
kicker: "project · 2026 · lead" # small label above the title in the note view
accent: indigo                  # indigo | ochre | green — colours the lede rule, headings, and links
role: lead                      # for projects: lead | partner | beneficiary
order: 17                       # lower = earlier in the index. Default 99 (= last, alphabetical)
summary: "One-line tagline shown in the index row."
pills:
  - ongoing|on                  # the |on suffix highlights a pill as "live"
  - 2026
  - Erasmus+ KA220
---
```

| Field      | Purpose                                                    |
|------------|------------------------------------------------------------|
| `title`    | Display title at the top of the column. **Required.**       |
| `slug`     | The note id. Must match the filename without `.md`.         |
| `type`     | `project` `person` `partner` `principle` `curiosity` `org`. |
| `kicker`   | Small label above the title in the note view, also shown as the sub-line in the index. |
| `accent`   | `indigo` (default), `ochre`, or `green`.                   |
| `subtitle` | An optional one-line subtitle under the title (note view). |
| `summary`  | One-line tagline displayed in the index row. Falls back to nothing if missing. |
| `role`     | For project notes: `lead` / `partner` / `beneficiary`. The projects index splits on this. |
| `order`    | Integer. Lower = earlier in the index. Defaults to 99 (= last). |
| `pills`    | Pill labels. Append `\|on` for the highlighted "live" variant. |
| `year`     | Optional. Available for filters but not currently displayed. |

Anything else is ignored.

### body

Plain Markdown. The first paragraph after the title automatically becomes the *lede* (italic, accent-coloured left rule).

```markdown
The first paragraph becomes the lede.

## what it was

Regular paragraphs.

> Blockquotes render as accent-coloured pull quotes.

- Lists work as you'd expect.
- Arrow bullets in the house style.

Internal links: [CCIF Cyprus](partner-ccif), or absolute-style `[CCIF](/partners/ccif)`,
both resolve to the same slug.

External links keep `https://`: [Andy Matuschak's notes](https://notes.andymatuschak.org).

Tables, images, raw `<iframe>` blocks all work; see the existing notes for examples.
```

### why the regen step exists

Browsers cannot list a directory at runtime. To know that `content/project-foo.md` exists, the site needs a static manifest — `content/_index.json`. `regen.py` walks `content/` once and rebuilds it. If you run a build step in CI, hook `python3 regen.py` in.

If you forget to run it, the new note still loads when linked directly (the runtime markdown loader fetches `content/<slug>.md` on demand), but it won't show up in the structural index pages until the index is regenerated.

### supported Markdown

- `## heading` → § heading (level 2). `### heading` (level 3) and `#### heading` (level 4) also work.
- Paragraphs separated by blank lines.
- `> blockquote` (consecutive `>` lines join into one quote).
- `- item` or `* item` for lists; `1. item` for ordered lists.
- `**bold**`, `*italic*`, `` `code` ``.
- `[label](slug)` for an internal link to another note.
- `[label](https://...)` for an external link (opens in a new tab).
- `![alt](path)` for images. See below.
- `---` on its own line for a horizontal rule.

The first paragraph after the title becomes the lede automatically.

## adding images

1. Drop the image file (`.jpg`, `.png`, `.svg`, `.webp`) into `assets/images/`.
2. Reference it in your Markdown:

   ```markdown
   ![Caption text](assets/images/cabinet-prototype-04.jpg)
   ```

3. The renderer wraps the image in a `<figure>` with the alt text used as a caption. Use a real caption that makes sense to a reader; it doubles as alt text for screen readers and AI crawlers.

Notes:
- Paths are relative to `index.html` at the site root, so `assets/images/foo.jpg` works from anywhere.
- For full-bleed inline use, just drop the image on its own line. Multiple images one after another stack vertically.
- Keep file names lowercase and kebab-case (`goana-dupa-meteor-perseids-2025.jpg`); avoid spaces and uppercase.
- Optimise before committing: aim for ≤ 200 KB per image. The site is meant to load on a slow rural connection.

## adding a partner or project to the constellation

The partners page (`?n=partners`) renders an SVG network of all partners and projects. The data lives in `assets/data.js`.

To add a project: append a new object to the `projects` array. The constellation will pick it up at next page load. Required keys: `slug`, `title`, `year`, `start`, `end`, `role` (`lead` / `partner` / `beneficiary`), `funder`, `funderShort`, `budget`, `tracks`, `partners` (array of partner slugs), `country`, `blurb`. The `slug` should match the filename (without the `project-` prefix) of `content/project-<slug>.md`, since double-clicking a node opens that note.

To add a partner: append to the `partners` array with `slug`, `name`, `country`, `projects` (array of project slugs), `note`. Double-clicking a partner node opens `content/partner-<slug>.md`.

## adding a structural page (rare)

Pages that need richer layout than plain Markdown (cards grid, project list, principle table, address block, constellation) live in `notes.js` as JavaScript objects. The available block kinds are:

`md` (rendered Markdown, the default for .md notes), `lede`, `p`, `h2`, `callout`, `callout-cta`, `shout`, `shout-quote`, `tags`, `cards`, `principle`, `numbered`, `timeline`, `project-list`, `tag-strip`, `links`, `signers`, `addresses`, `constellation`.

Add a new entry to `window.NOTES` with `id`, `type`, `kicker`, `title`, `subtitle`, `accent`, and a `body` array of these blocks. See the existing entries (`home`, `manifesto`, `projects`, `partners`) for examples.

## design tokens

All colour, type, and spacing tokens live in `assets/tokens.css` as CSS custom properties (`--bg`, `--ink`, `--accent`, `--font-display`, `--space-5`, ...). Lift these into any new component instead of re-deciding values. The component styles are in `assets/site.css`, organised by section header comments.

The visual rules are deliberately strict. No em-dashes (use `:`, `;`, `,`, `()`, or a new sentence). No emoji. No drop shadows. No carousels, popups, autoplay video, or "trusted by" logo strips. Background is cream `#FAF6F0`, never pure white. Text is dark navy `#1A1F2E`, never pure black. Sentence-case headings always.

## non-negotiable editorial rules

- **Wordmark is always written together: `uzinaduzina`.** Lowercase, never capitalised, never split.
- **No em-dashes (—).** Use `:`, `;`, `,`, `()`, or a new sentence. En-dashes for ranges (`2020–2024`).
- **Sentence case for headings.** Never Title Case, never ALL CAPS.
- **Voice:** reflexive, not didactic. Warm but precise. Concrete, with examples. Provisional; closings are open. Honest about counter-evidence. Pro-European, explicit.

## deploying

The site is fully static. To deploy, copy the entire `uzduz25/` directory to any static host (GitHub Pages, Netlify, Cloudflare Pages, plain S3, a directory under nginx, etc.). The canonical domain in `index.html`, `llms.txt`, `sitemap.xml`, and `robots.txt` is `https://uzinaduzina.org`. Update those four files if you point a different domain at it.
