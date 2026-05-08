#!/usr/bin/env python3
"""Regenerate content/_index.json from every .md file in content/.

Workflow for adding a new note to the site:

  1. Drop a .md file into content/ with the right slug, e.g.
     content/project-my-new-thing.md or content/team-jane-doe.md.
  2. Run this script:    python3 regen.py
  3. Refresh the browser. The new note appears in the relevant index
     page (projects, team, manifesto, partners, curiosities).

The script parses the YAML-style front matter at the top of each .md
file and emits a JSON list. The site loads this index at boot and the
`auto-list` block renders each index page from it.

Conventions read from front matter:
  title:    display title (required for a useful index entry)
  type:     project | person | partner | principle | curiosity | …
            inferred from the filename prefix if absent (project-*, team-*,
            partner-*, manifesto-*, curiosity-*).
  kicker:   small label shown above the title in the note view
  accent:   indigo | ochre | green
  subtitle: optional one-liner shown in the note view
  summary:  optional one-liner shown in the index row (overrides subtitle
            in the index when both are present)
  year:     optional year, used as a fallback display value
  role:     optional (project notes): lead | partner | beneficiary
  order:    optional integer; lower = earlier in the index. Defaults to 99.
  pills:    list of label strings (kept verbatim)
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONTENT = HERE / "content"
OUT = CONTENT / "_index.json"

PREFIX_TO_TYPE = {
    "project-": "project",
    "team-": "person",
    "partner-": "partner",
    "manifesto-": "principle",
    "curiosity-": "curiosity",
}


def unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and (
        (value[0] == '"' and value[-1] == '"')
        or (value[0] == "'" and value[-1] == "'")
    ):
        return value[1:-1]
    return value


def parse_front_matter(text: str) -> dict:
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", text, re.DOTALL)
    if not m:
        return {}
    fm: dict = {}
    current_key: str | None = None
    for raw in m.group(1).splitlines():
        if not raw.strip():
            continue
        # Indented continuation = list item under current_key.
        if re.match(r"^\s+", raw) and current_key is not None:
            value = raw.strip()
            if value.startswith("-"):
                value = value[1:].strip()
            fm.setdefault(current_key, []).append(unquote(value))
            continue
        km = re.match(r"^([\w-]+):\s*(.*)$", raw)
        if not km:
            continue
        key, val = km.group(1), km.group(2).strip()
        if not val:
            current_key = key
            fm[key] = []
        elif val.startswith("[") and val.endswith("]"):
            inner = val[1:-1]
            parts = [unquote(x.strip()) for x in inner.split(",") if x.strip()]
            fm[key] = parts
            current_key = None
        else:
            fm[key] = unquote(val)
            current_key = None
    return fm


def infer_type(slug: str, fm: dict) -> str:
    t = fm.get("type", "")
    if t:
        # Normalise common variants to the names used by auto-list filters.
        return {
            "organization-note": "org",
            "manifesto": "principle",
        }.get(t, t)
    for prefix, typ in PREFIX_TO_TYPE.items():
        if slug.startswith(prefix):
            return typ
    return "note"


def coerce_int(value, default=99) -> int:
    try:
        return int(str(value))
    except (TypeError, ValueError):
        return default


# Strip a few common Markdown decorations so an extracted excerpt reads as
# clean prose in an index row. We keep this deliberately small; anything
# fancier (HTML, code blocks, footnotes) is left alone.
_INLINE_LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")
_INLINE_BOLD = re.compile(r"\*\*([^*]+)\*\*")
_INLINE_ITAL = re.compile(r"(^|[^*])\*([^*\n]+)\*(?!\*)")
_INLINE_CODE = re.compile(r"`([^`]+)`")


def strip_inline(text: str) -> str:
    text = _INLINE_LINK.sub(r"\1", text)
    text = _INLINE_BOLD.sub(r"\1", text)
    text = _INLINE_ITAL.sub(r"\1\2", text)
    text = _INLINE_CODE.sub(r"\1", text)
    return text


def first_paragraph(body: str) -> str:
    """Return the first body paragraph as a single line of clean prose.

    Skips leading blank lines, headings, blockquotes, lists, raw HTML, table
    rows, image-only paragraphs, and horizontal rules — i.e. anything that
    isn't ordinary prose. Stops at the next blank line. Inline emphasis,
    bold, code, and link decorations are stripped.
    """
    skip = re.compile(
        r"^(\s*$|#{1,4}\s|>|-{3,}\s*$|[-*]\s|\d+\.\s|!\[|\||<\s*[a-zA-Z])"
    )
    lines = body.splitlines()
    i = 0
    # Skip leading skippable lines.
    while i < len(lines) and skip.match(lines[i]):
        i += 1
    if i >= len(lines):
        return ""
    buf = []
    while i < len(lines) and lines[i].strip() and not skip.match(lines[i]):
        buf.append(lines[i].strip())
        i += 1
    return strip_inline(" ".join(buf)).strip()


# Match up to and including the first sentence-ending punctuation followed
# by whitespace or end-of-string. Used to keep index taglines compact.
_SENTENCE_END = re.compile(r"^(.+?[.!?])(?=\s|$)", re.DOTALL)


def first_sentence(text: str) -> str:
    text = text.strip()
    if not text:
        return ""
    m = _SENTENCE_END.match(text)
    return (m.group(1) if m else text).strip()


def build_entry(md: Path) -> dict:
    slug = md.stem
    text = md.read_text(encoding="utf-8")
    fm = parse_front_matter(text)
    # Body is everything after the front-matter block (or the whole file if
    # there is no front matter). first_paragraph then extracts the lede.
    m = re.match(r"^---\r?\n.*?\r?\n---\r?\n(.*)$", text, re.DOTALL)
    body = m.group(1) if m else text
    paragraph = first_paragraph(body)
    return {
        "slug": slug,
        "type": infer_type(slug, fm),
        "title": fm.get("title", slug),
        "kicker": fm.get("kicker", ""),
        "accent": fm.get("accent", "indigo"),
        "subtitle": fm.get("subtitle", ""),
        "summary": fm.get("summary", ""),
        # `excerpt` is the first sentence of the first paragraph — short
        # enough to use as a compact index tagline.
        "excerpt": first_sentence(paragraph),
        "year": fm.get("year", ""),
        "role": fm.get("role", ""),
        "order": coerce_int(fm.get("order", 99)),
        "pills": fm.get("pills") if isinstance(fm.get("pills"), list) else [],
        "images": fm.get("images") if isinstance(fm.get("images"), list) else [],
    }


def main() -> int:
    if not CONTENT.is_dir():
        print(f"error: {CONTENT} does not exist", file=sys.stderr)
        return 1
    notes = []
    for md in sorted(CONTENT.glob("*.md")):
        if md.name.startswith("_"):
            continue
        notes.append(build_entry(md))
    notes.sort(key=lambda n: (n["type"], n["order"], n["slug"]))
    OUT.write_text(json.dumps(notes, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    by_type: dict[str, int] = {}
    for n in notes:
        by_type[n["type"]] = by_type.get(n["type"], 0) + 1
    summary = ", ".join(f"{c} {t}" for t, c in sorted(by_type.items()))
    print(f"wrote {len(notes)} notes ({summary}) → {OUT.relative_to(HERE)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
