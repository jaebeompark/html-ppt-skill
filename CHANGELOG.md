# Changelog

Changes in this Korean-optimized fork, relative to upstream
[lewislulu/html-ppt-skill](https://github.com/lewislulu/html-ppt-skill).
Everything upstream provides still works; only the entries below differ.

Newest first.

## 2026-08-24

### Pretendard is now the default sans

`Inter` and `Noto Sans KR` were both dropped in favour of a single
[Pretendard](https://github.com/orioncactus/pretendard) family (v1.3.9, OFL).
Pretendard covers Latin and Korean in one face, and its Latin is derived from
Inter — the face this system already used — so mixed Korean/English lines no
longer shift letter-spacing or baseline mid-sentence.

- Served from jsDelivr as a dynamic subset, so a deck downloads only the
  Hangul ranges it actually uses. This adds a second font host alongside
  Google Fonts.
- Applied to `assets/base.css` and 34 themes.
- The 14 full-deck templates hardcoded `Inter` with no Korean face at all, so
  Korean text in them fell back to a system font. They now inherit Pretendard's
  Korean coverage — **Korean works in the full-deck templates for the first
  time.**

Deliberately unchanged:

- **`Noto Serif KR` / `Noto Serif SC` stay.** Pretendard ships no serif, so the
  serif themes (`academic-paper`, `editorial-serif`, and the serif display
  stacks) keep Noto Serif.
- **`Noto Sans SC` stays.** Pretendard has no Simplified Chinese coverage.
- **Mono themes** (`blueprint`, `terminal-green`) keep a Korean face as the
  fallback inside their monospace stack, so Korean prose on terminal and code
  slides still renders. Latin and code remain JetBrains Mono.

### Fixes

- **Deck chrome no longer overlaps slide content.** Eight full-deck templates
  used `.slide > * { position:relative }` to lift content above the background
  overlay, which also caught `.deck-header` / `.deck-footer` and overrode the
  `position:absolute` they get from `base.css`. The footer joined normal flow
  and its `bottom:24px` pushed it *upward*, colliding with the content above.
  Visible on `tech-sharing` and `pitch-deck`; the other six were fixed
  pre-emptively.
- **`deck.html` big-number slide.** The `220px` wrapper `<div>` was self-closed
  before its counter spans, leaving them and the following `<h3>` outside it
  and producing two stray `</div>` tags. Browsers recovered silently, so the
  sizing had never applied to the number it was written for.
- **`scripts/render.sh` output handling.** The usage block documents
  `render.sh <html> <N> <out-dir>`, but for `N=1` the third argument was used
  as an output *file* path — passing a directory made Chrome write nothing
  while the script still printed a success tick. `$3` is now always a
  directory for any `N` and is created if missing, each screenshot is verified
  to have landed, and a failure reports `✖` and exits non-zero.
- **Stale counts in docs and slide copy.** `SKILL.md` advertised 14 full-deck
  templates and 30 layouts (actually 15 and 31); `deck.html` and the demo deck
  still read "24 themes · 30 layouts · 25 animations".

### Docs

- Added `CONTEXT.md` — a glossary of the project's vocabulary (deck, slide,
  chrome, notes, speaker script, token, theme, layout, full-deck template,
  animation vs FX, and the runtime modes).
- Standardised speaker notes on `<aside class="notes">`. The element was split
  evenly between `<div>` and `<aside>`, and `SKILL.md` prescribed each in a
  different section. All selectors match on the class, so behaviour is
  unchanged.
- Added `AGENTS.md` and `docs/agents/` — issue tracker, triage labels, and
  domain-doc conventions for agent-assisted work on this repo.

## 2026-08-02

- **Korean font support across all 36 themes.** Serif themes render Korean in
  a serif face rather than falling back to sans.
- **Korean trigger keywords** ("피피티", "발표자료", "카드뉴스", and others), so
  the skill activates on Korean requests.
- **Fixed big-number overlap on serif themes.**
- **Added a Korean test deck** (`examples/ko-test/`) for checking Hangul
  rendering after install.
