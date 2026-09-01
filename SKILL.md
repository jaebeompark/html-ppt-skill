---
name: html-ppt
description: HTML PPT Studio — author professional static HTML presentations in many styles, layouts, and animations, all driven by templates. Use when the user asks for a presentation, PPT, slides, keynote, deck, slideshow, a reveal-style HTML deck, a card-news image set, or any kind of multi-slide pitch/report/sharing document that should look tasteful and be usable with keyboard navigation. Triggers include keywords like "presentation", "ppt", "slides", "deck", "keynote", "reveal", "slideshow", "talk slides", "pitch deck", "tech sharing", "technical presentation", "카드뉴스", "피피티", "발표자료", "발표 자료 만들어줘", "슬라이드 만들어줘", "발표 대본", "프레젠테이션", "강의자료".
---

# html-ppt — HTML PPT Studio

Author professional HTML presentations as static files. One theme file = one
look. One layout file = one page type. One animation class = one entry effect.
All pages share a token-based design system in `assets/base.css`.

## Install

```bash
npx skills add https://github.com/lewislulu/html-ppt-skill
```

One command, no build. Pure static HTML/CSS/JS, fully offline — fonts,
Chart.js and highlight.js are all vendored in the repo.

## What the skill gives you

- **36 themes** (`assets/themes/*.css`) — minimal-white, editorial-serif, soft-pastel, sharp-mono, arctic-cool, sunset-warm, catppuccin-latte/mocha, dracula, tokyo-night, nord, solarized-light, gruvbox-dark, rose-pine, neo-brutalism, glassmorphism, bauhaus, swiss-grid, terminal-green, clean-white, rainbow-gradient, aurora, blueprint, memphis-pop, cyberpunk-neon, y2k-chrome, retro-tv, japanese-minimal, vaporwave, midcentury, corporate-clean, academic-paper, news-broadcast, pitch-deck-vc, magazine-bold, engineering-whiteprint
- **15 full-deck templates** (`templates/full-decks/<name>/`) — complete multi-slide decks with scoped `.tpl-<name>` CSS. 8 with a strong extracted look (card-news-editorial, graphify-dark-graph, knowledge-arch-blueprint, hermes-cyber-terminal, obsidian-claude-gradient, testing-safety-alert, card-news-pastel, dir-key-nav-minimal), 7 scenario scaffolds (pitch-deck, product-launch, tech-sharing, weekly-report, card-news-post 3:4, course-module, **presenter-reveal** — the presenter-mode template, Korean typography with a speaker script per slide)
- **33 layouts** (`templates/single-page/*.html`) with realistic demo data
- **27 CSS animations** (`assets/animations/animations.css`) via `data-anim`
- **20 canvas FX animations** (`assets/animations/fx/*.js`) via `data-fx` — particle-burst, confetti-cannon, firework, starfield, matrix-rain, knowledge-graph (force-directed), neural-net (pulses), constellation, orbit-ring, galaxy-swirl, word-cascade, letter-explode, chain-react, magnetic-field, data-stream, gradient-blob, sparkle-trail, shockwave, typewriter-multi, counter-explosion
- **Keyboard runtime** (`assets/runtime.js`) — arrows, T (theme), A (anim), F/O, **S (presenter mode: magnetic-card popup with CURRENT / NEXT / SCRIPT / TIMER cards)**, N (notes drawer), R (reset timer in presenter)
- **FX runtime** (`assets/animations/fx-runtime.js`) — auto-inits `[data-fx]` on slide enter, cleans up on leave
- **Showcase decks** for themes / layouts / animations / full-decks gallery
- **Headless Chrome render script** for PNG export

## When to use

Use when the user asks for any kind of slide-based output or wants to turn
text/notes into a presentable deck. Prefer this over building from scratch.

### 🎤 Presenter Mode (speaker view + script)

If the user mentions any of: **발표 / 강의 / 대본 / 발표 대본 / speaker notes / presenter view / teleprompter**, or says things like "팀에 발표하러 갑니다", "기술 공유를 하나 해야 해요", "말이 막힐까 봐 걱정입니다", "대본 딸린 발표자료가 필요해요" — **use the `presenter-reveal` full-deck template** and write a 150–300 character speaker script in each slide's `<aside class="notes">`.

See [references/presenter-mode.md](references/presenter-mode.md) for the full authoring guide including the 3 rules of speaker script writing:
1. **Signals, not a script to read** — bold the key words, put transition sentences in their own paragraph
2. **150–300 characters per slide** — roughly 2–3 minutes of speaking
3. **Spoken register, not written** — in Korean, prefer "그래서" over "따라서", "이 방법" over "해당 방안"

All full-deck templates support the S key presenter mode (it's built into `runtime.js`). **S opens a new popup window with 4 magnetic cards**:
- 🔵 **CURRENT** — pixel-perfect iframe preview of the current slide
- 🟣 **NEXT** — pixel-perfect iframe preview of the next slide
- 🟠 **SPEAKER SCRIPT** — the speaker script in a large font (scrollable)
- 🟢 **TIMER** — elapsed time + slide counter + prev/next/reset buttons

Each card is **draggable by its header** and **resizable by the bottom-right corner handle**. Card positions/sizes persist to `localStorage` per deck. A "Reset layout" button restores the default arrangement.

**Why the previews are pixel-perfect**: each preview is an `<iframe>` that loads the actual deck HTML with a `?preview=N` query param; `runtime.js` detects this and renders only slide N with no chrome. So the preview uses the **same CSS, theme, fonts, and viewport as the audience view** — colors and layout are guaranteed identical.

**Smooth navigation**: on slide change, the presenter window sends `postMessage({type:'preview-goto', idx:N})` to each iframe. The iframe just toggles `.is-active` between slides — **no reload, no flicker**. The two windows also stay in sync via `BroadcastChannel`.

Only `presenter-reveal` is designed from the ground up around the feature, with a worked example script on every slide.

Keyboard in presenter window: `← → / ↑ ↓` navigate (syncs audience) · `R` reset timer · `Esc` close popup.
Keyboard in audience window: `S` open presenter · `T` cycle theme · `← → / ↑ ↓` navigate (syncs presenter) · `F` fullscreen · `O` overview.

## Before you author anything — ALWAYS ask or recommend

**Do not start writing slides until you understand three things.** Either ask
the user directly, or — if they already handed you rich content — propose a
tasteful default and confirm.

1. **Content & audience.** What's the deck about, how many slides, who's
   watching (engineers / execs / students / VCs / a social audience)?
2. **Style / theme.** Which of the 36 themes fits? If unsure, recommend 2-3
   candidates based on tone:
   - Business / investor pitch → `pitch-deck-vc`, `corporate-clean`, `swiss-grid`
   - Tech sharing / engineering → `tokyo-night`, `dracula`, `catppuccin-mocha`,
     `terminal-green`, `blueprint`
   - Card news / social → `clean-white`, `soft-pastel`, `rainbow-gradient`,
     `magazine-bold`
   - Academic / report → `academic-paper`, `editorial-serif`, `minimal-white`
   - Edgy / cyber / launch → `cyberpunk-neon`, `vaporwave`, `y2k-chrome`,
     `neo-brutalism`
3. **Starting point.** One of the 15 full-deck templates, or scratch? Point
   to the closest `templates/full-decks/<name>/` and ask if it fits. If the
   user's content suggests something obvious (e.g. "제품 출시 발표를 해야 해요" →
   `product-launch`), propose it confidently instead of asking blindly.

A good opening message looks like:

> 발표자료 만들어 드리겠습니다. 세 가지만 먼저 확인할게요.
> 1. 대략 어떤 내용이고, 몇 장이고, 청중은 누구인가요?
> 2. 스타일은요? 세 가지를 추천드립니다 — `tokyo-night`(기술 공유에 무난하게 잘 어울림), `clean-white`(카드뉴스 톤), `corporate-clean`(공식 보고).
> 3. 기존 `tech-sharing` 풀덱 템플릿을 바탕에 깔까요?

Only after those are clear, scaffold the deck and start writing.

## Quick start

1. **Scaffold a new deck.** From the repo root:
   ```bash
   ./scripts/new-deck.sh my-talk
   open examples/my-talk/index.html
   ```
2. **Pick a theme.** Open the deck and press `T` to cycle. Or hard-code it:
   ```html
   <link rel="stylesheet" id="theme-link" href="../assets/themes/aurora.css">
   ```
   Catalog in [references/themes.md](references/themes.md).
3. **Pick layouts.** Copy `<section class="slide">...</section>` blocks out of
   files in `templates/single-page/` into your deck. Replace the demo data.
   Catalog in [references/layouts.md](references/layouts.md).
4. **Add animations.** Put `data-anim="fade-up"` (or `class="anim-fade-up"`) on
   any element. On `<ul>`/grids, use `anim-stagger-list` for sequenced reveals.
   For canvas FX, use `<div data-fx="knowledge-graph">...</div>` and include
   `<script src="../assets/animations/fx-runtime.js"></script>`.
   Catalog in [references/animations.md](references/animations.md).
5. **Use a full-deck template.** Copy `templates/full-decks/<name>/` into
   `examples/my-talk/` as a starting point. Each folder is self-contained with
   scoped CSS. Catalog in [references/full-decks.md](references/full-decks.md)
   and gallery at `templates/full-decks-index.html`.
6. **Render to PNG.**
   ```bash
   ./scripts/render.sh templates/theme-showcase.html       # one shot
   ./scripts/render.sh examples/my-talk/index.html 12      # 12 slides
   ```

## Routing work: plan → author → verify

A deck build has three phases with different shapes. Match the work to the runner.

| phase | shape | runner |
|---|---|---|
| **plan** | one holistic judgment — audience → theme, outline, a layout per page | the main thread, medium effort |
| **author** | N independent slides, once the outline is fixed | subagents, 2–3 slides each, `model: "sonnet"` |
| **verify** | mechanical and checkable | `./scripts/smoke.sh --render`, then read the PNGs |

**Plan in one head.** Theme, arc and per-page layout all constrain each other,
so the outline is a single decision. Split it across agents and the deck reads
like three people wrote it. Keep this phase whole, in the main thread.

**Author in parallel.** Once the outline names a layout and the content for each
slide, the slides are independent — copy the layout, replace the data, write the
notes. Dispatch the batches **in one message** so they run concurrently, and give
each subagent the four inputs in
[references/agent-routing.md](references/agent-routing.md): layout path, theme
name, the slide's actual content, and the house rules. A subagent missing the
theme writes literal colours; one missing the content invents numbers.

**Verify with the script.** `./scripts/smoke.sh` catches the failures that still
look like success — a deck that rendered half its slides, markup closed in the
wrong order, a theme that lost its Korean face. Then open the PNGs: the script
cannot see a title that wrapped badly or a chart nobody can read.

**Run this skill at medium effort.** Building a deck is selection, not
open-ended problem solving: the theme comes from an audience table, the layout
for each page from the layout catalogue, the animation from a per-slide-type
default. Higher settings spend their budget re-deriving choices the catalogue has
already made, and the deck lands in the same place. Set the level with `/model`
before a build. The one place to spend more is content you are reasoning about
from scratch — a technical argument, an unfamiliar dataset — and that is writing,
not deck assembly.

Model is the separate knob: authoring and verifying carry a cheaper `model` on
each dispatch, since replacing demo data in a copied layout needs no more.

## Authoring rules (important)

- **Always start from a template.** Don't author slides from scratch — copy the
  closest layout from `templates/single-page/` first, then replace content.
- **Use tokens, not literal colors.** Every color, radius, shadow should come
  from CSS variables defined in `assets/base.css` and overridden by a theme.
  Good: `color: var(--text-1)`. Bad: `color: #111`.
- **Don't invent new layout files.** Prefer composing existing ones. Only add
  a new `templates/single-page/*.html` if none of the existing layouts fit.
- **Respect chrome slots.** `.deck-header`, `.deck-footer`, `.slide-number`
  and the progress bar are provided by `assets/base.css` + `runtime.js`.
- **Keyboard-first.** Always include `<script src="../assets/runtime.js"></script>`
  so the deck supports ← → / ↑ ↓ / T / A / F / S / O / hash deep-links.
- **One `.slide` per logical page.** `runtime.js` makes `.slide.is-active`
  visible; all others are hidden.
- **Supply notes.** Wrap speaker notes in `<aside class="notes">…</aside>` inside
  each slide. Press S to open the overlay.
- **NEVER put presenter-only text on the slide itself.** Descriptive text like
  "이 페이지는 …를 보여 줍니다" or "발표자: 여기서 …를 덧붙이세요" or small explanatory captions
  aimed at the presenter MUST go inside `<aside class="notes">`, NOT as visible
  `<p>` / `<span>` elements on the slide. The `.notes` class is `display:none`
  by default — it only appears in the S overlay. Slides should contain ONLY
  audience-facing content (titles, bullet points, data, charts, images).

## Writing guide

See [references/authoring-guide.md](references/authoring-guide.md) for a
step-by-step walkthrough: file structure, naming, how to transform an outline
into a deck, how to choose layouts and themes per audience, how to do a
Chinese + English deck, and how to export.

## Catalogs (load when needed)

- [references/themes.md](references/themes.md) — all 36 themes with when-to-use.
- [references/layouts.md](references/layouts.md) — all 33 layout types.
- [references/animations.md](references/animations.md) — 27 CSS + 20 canvas FX animations.
- [references/full-decks.md](references/full-decks.md) — all 15 full-deck templates.
- [references/presenter-mode.md](references/presenter-mode.md) — **presenter mode and how to write the speaker script (read this before any talk deck)**.
- [references/authoring-guide.md](references/authoring-guide.md) — full workflow.
- [references/agent-routing.md](references/agent-routing.md) — dispatching authoring subagents: the four inputs, batching, assembly.

## File structure

```
html-ppt/
├── SKILL.md                 (this file)
├── references/              (detailed catalogs, load as needed)
├── assets/
│   ├── base.css             (tokens + primitives — do not edit per deck)
│   ├── fonts.css            (webfont imports)
│   ├── runtime.js           (keyboard + presenter + overview + theme cycle)
│   ├── themes/*.css         (36 token overrides, one per theme)
│   └── animations/
│       ├── animations.css   (27 named CSS entry animations)
│       ├── fx-runtime.js    (auto-init [data-fx] on slide enter)
│       └── fx/*.js          (20 canvas FX modules: particles/graph/fireworks…)
├── templates/
│   ├── deck.html                  (minimal 6-slide starter)
│   ├── theme-showcase.html        (36 slides, iframe-isolated per theme)
│   ├── layout-showcase.html       (iframe tour of all 33 layouts)
│   ├── animation-showcase.html    (20 FX + 27 CSS animation slides)
│   ├── full-decks-index.html      (gallery of all 15 full-deck templates)
│   ├── full-decks/<name>/         (16 scoped multi-slide deck templates)
│   └── single-page/*.html         (33 layout files with demo data)
├── scripts/
│   ├── new-deck.sh                (scaffold a deck from deck.html)
│   ├── render.sh                  (headless Chrome → PNG)
│   └── smoke.sh                   (markup, counts, fonts, render — run before shipping)
└── examples/demo-deck/            (complete working deck)
```

## Editing a deck by hand

Not every change is worth a prompt. `./scripts/edit.sh <deck>` serves the deck
locally and opens it with in-place text editing: `E` toggles edit mode, `＋`/`×`
add and remove list or grid items, pasting drops an image into the slot under
the caret, and `⌘S` writes it back to the file.

The editor is injected at serve time when the URL carries `?edit=1` — **no deck
file links it**, so do not add a `<script>` for it when authoring. Saving
splices the changed text into the original file rather than serialising the
DOM, so the diff stays to the lines that actually changed.

Font size and free placement are intentionally not editable: both are layout
decisions, and making them per-slide would desync a deck from its own tokens.

## Rendering to PNG

`scripts/render.sh` wraps headless Chrome at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. For multi-slide
capture, runtime.js exposes `#/N` deep-links, and render.sh iterates 1..N.

```bash
./scripts/render.sh templates/single-page/kpi-grid.html        # single page
./scripts/render.sh examples/demo-deck/index.html 8 out-dir    # 8 slides, custom dir
```

## Keyboard cheat sheet

```
←  →  ↑  ↓  Space  PgUp  PgDn  Home  End    navigate
E                                       edit mode (only under scripts/edit.sh)
F                                       fullscreen
S                                       open presenter window (magnetic cards: current/next/script/timer)
N                                       quick notes drawer (bottom overlay)
R                                       reset timer (in presenter window)
?preview=N                              URL param — force preview-only mode (single slide, no chrome)
O                                       slide overview grid
T                                       cycle themes (reads data-themes attr)
A                                       cycle demo animation on current slide
#/N in URL                              deep-link to slide N
Esc                                     close all overlays
```

## License & author

MIT. Copyright (c) 2026 lewis &lt;sudolewis@gmail.com&gt;.
