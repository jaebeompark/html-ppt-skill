# HTML PPT Studio

A skill for authoring professional static HTML presentations. Everything is
plain HTML/CSS/JS with no build step: a deck is a file you open in a browser,
and its look is swapped by changing one stylesheet link.

## Language

### The artifact

**Deck**:
One presentation — a single HTML file (or a self-contained folder) holding an
ordered series of slides.
_Avoid_: presentation file, PPT, slideshow

**Slide**:
One logical page of a deck, marked up as a `.slide` element. Exactly one slide
is active at a time.
_Avoid_: page, card, section

**Chrome**:
The persistent furniture drawn around every slide — deck header, deck footer,
slide number, progress bar. Supplied by the framework, never authored per deck.
_Avoid_: frame, shell, furniture

**Notes**:
Presenter-only prose attached to a slide, hidden from the audience. Never
visible on the slide itself.
_Avoid_: comments, annotations

**Speaker script** (逐字稿):
Notes written as a near-verbatim spoken delivery, 150–300 words per slide.
A speaker script is a kind of notes; not all notes are one.
_Avoid_: transcript, teleprompter text

### The style system

**Token**:
A CSS variable defining one design value — a color, radius, shadow, spacing
step. Authored content references tokens; it never hard-codes a literal value.
_Avoid_: variable, design token, custom property

**Theme**:
A complete set of token overrides that gives a deck one coherent look. Swapping
the theme stylesheet changes the look with no edits to slide markup.
_Avoid_: skin, style, palette

### The building blocks

**Layout**:
A reusable single-slide structure — cover, bullets, KPI grid, timeline. Authors
copy a layout and replace its demo data rather than writing a slide from
scratch.
_Avoid_: slide type, component, block

**Full-deck template**:
A complete multi-slide deck for one scenario (pitch, product launch, weekly
report), shipped as a self-contained folder with its own scoped CSS. The
starting point for a whole deck, where a layout is the starting point for one
slide.
_Avoid_: starter, boilerplate, scaffold

**Animation**:
A CSS entry effect that plays when an element enters the active slide.
_Avoid_: transition, effect

**FX**:
A canvas-rendered ambient effect — particles, starfield, knowledge graph —
that runs for as long as its slide is active. Distinct from an animation:
FX is a running program, an animation is a one-shot entry effect.
_Avoid_: canvas animation, visual effect, background effect

### Runtime behaviour

**Runtime**:
The shared script that makes a static deck behave like a presentation —
keyboard navigation, theme cycling, and every mode below.
_Avoid_: engine, player, framework

**Audience view**:
The deck as projected — the normal, full window a room is looking at.
_Avoid_: main view, primary window

**Presenter mode**:
A second window for the speaker showing the current slide, the next slide, the
speaker script, and a timer, kept in sync with the audience view.
_Avoid_: presenter view, speaker view, 演讲者模式

**Preview mode**:
A stripped rendering of one slide with no chrome, used to embed a true-to-life
slide image inside presenter mode.
_Avoid_: thumbnail mode, iframe mode

**Overview**:
A grid of all slides at once, for jumping to any of them.
_Avoid_: grid view, slide sorter

**Showcase**:
A generated deck whose content is the catalog itself — every theme, every
layout, every animation — used to browse what's available.
_Avoid_: gallery, demo, index
