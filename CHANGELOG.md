# Changelog

This fork started as a Korean-optimised build of
[lewislulu/html-ppt-skill](https://github.com/lewislulu/html-ppt-skill) and has
since separated from it. Entries below the 2026-09-01 release describe the
period when upstream parity still held.

Newest first.

## 2026-09-01 — separated from upstream

### Chinese removed; Korean is the default

Every Chinese string is gone from the skill — roughly 15,000 characters across
110 files: layout demo copy, full-deck content, theme comments, showcase pages
and documentation.

- **Deleted** `presenter-mode-reveal` (the Chinese presenter template, now
  redundant) and `README.zh-CN.md`.
- **Renamed** the three Xiaohongshu-branded templates to `card-news-editorial`,
  `card-news-pastel` and `card-news-post`, and `xiaohongshu-white.css` to
  `clean-white.css`. The 3:4 portrait format is genuinely useful for Korean
  card news and Instagram carousels, so the format was kept and only the
  platform-specific identity dropped.
- **Renamed** `ko-presenter-reveal` to `presenter-reveal` — with Korean as the
  default, the `ko-` prefix no longer distinguishes anything.
- Full-deck count is now **15**, down from 16.
- `Noto Sans SC` and `Noto Serif SC` were removed from every font stack, along
  with the `PingFang SC` fallbacks. This supersedes the 2026-08-24 entries
  below, which said both families would stay.

### The presenter window speaks the deck's language

`runtime.js` gained a `PRESENTER_I18N` table. The presenter window's chrome —
card titles, buttons, hint bar, the end-of-deck and empty-script strings, the
reset-layout confirm — now follows the deck's `<html lang>`. **Korean is the
default**; English is opt-in with `lang="en"`. Only the chrome is translated;
the speaker script comes from the deck.

### Webfonts are vendored — the skill is offline

`assets/fonts.css` no longer imports anything. All 18 faces (Pretendard
400–900, Noto Serif KR, JetBrains Mono, Playfair Display, Space Grotesk, IBM
Plex Mono, Archivo Black) live in `assets/vendor/fonts/` as local
`@font-face` declarations — about 6.6 MB.

The failure this removes: with a CDN import, presenting from a room with no
working wifi meant Hangul silently fell back to a system face mid-talk. The
presenter window, which is `document.write`n into a popup, now links the deck's
own resolved `fonts.css` URL rather than carrying an import of its own.

Chart.js 4.4.3 (201 KB) and highlight.js 11.10.0 with its theme stylesheet
(123 KB) are vendored too, under `assets/vendor/`. The five layouts that use
them — `chart-bar`, `chart-line`, `chart-pie`, `chart-radar` and `code` — now
load them from disk.

**Nothing in the repository fetches anything at presentation time.** A new
`smoke.sh` check 6 fails the build on any external `href`/`src`/`@import` in a
shipped file, so this cannot quietly regress. It replaces the old check 6,
which verified that the CDN URLs were reachable — a question that no longer
exists. The `--net` flag is gone with it.

### Fixed

- **`card-news-post` positioned helpers collapsed.** A blanket
  `.slide > *{position:relative}` rule — added to lift content above the
  gradient wash — outweighed the `position:absolute` on `.page-dot`,
  `.sticker` and `.bottom-bar`, dropping all three back into the column flex
  flow where `align-items:stretch` blew them to the full slide width. Stickers
  rendered as full-width bars and the page badge as a header stripe. The rule
  now excludes the three, which set their own `z-index` and never needed
  `position:relative`.
- **Stale counts in slide demo copy** — several layouts still advertised 31
  layouts and 24 themes.
- **README screenshots** regenerated from the Korean templates. The two hero
  GIFs were recordings of Chinese decks and were removed.

### Documentation

`README.md` was rewritten as a standalone document rather than a stack of fork
banners over the upstream text. `references/presenter-mode.md` was rewritten in
English. Attribution to lewis and aiden-44 is kept, and `LICENSE` is unchanged.

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
