# Agent routing

How to split a deck build across subagents, and what each one must be handed.
The phase table lives in [SKILL.md](../SKILL.md#routing-work-plan--author--verify);
this file is the dispatch detail you need once you are actually delegating.

## What an authoring subagent must receive

A subagent has none of your context. Four things decide whether its slide
renders correctly, and every one of them is a real failure when omitted:

1. **The layout file path** — `templates/single-page/<name>.html`. It copies
   from that file, so it must open it rather than invent markup.
2. **The theme name** — so it writes `var(--accent)` knowing what the palette
   is, and never reaches for a literal colour.
3. **The slide's content** — the actual words, data and numbers. A subagent
   asked to "write a slide about performance" invents figures.
4. **The scoped-CSS rule** — if the layout carries a `<style>` block, that block
   comes along with the markup. Half the layouts do; the list is in
   [layouts.md](./layouts.md#layouts-with-scoped-css).

## Dispatch template

```
Author slide N of a deck using templates/single-page/<layout>.html.

Theme: <theme>. Colours come from CSS variables — var(--accent), var(--text-1) —
never literals.

Content:
<the actual copy, data and numbers for this slide>

Steps:
1. Read templates/single-page/<layout>.html.
2. Copy its <section class="slide">…</section> block. If the file has a <style>
   block, return that too — it defines classes base.css does not.
3. Replace the demo data with the content above, keeping the class structure.
4. Set data-title="<short title>" for the overview grid.
5. Add <aside class="notes">…</aside> with 150–300 words of spoken-register
   speaker script.

Return the section markup, and the <style> block if there was one. Return
nothing else.
```

## Batching

One subagent per 2–3 slides. One per slide spends more on dispatch than the
slide costs; more than three and the agent starts reusing one layout across
them because that is cheaper than reading three files.

Dispatch every batch **in a single message** so they run concurrently — the
whole reason to split authoring out is wall-clock, and sequential dispatches
throw it away.

## Assembling what comes back

Concatenate the returned sections in outline order into the scaffold from
`./scripts/new-deck.sh <name>`, then:

- **Deduplicate the `<style>` blocks.** Two slides from the same layout return
  the same CSS twice.
- **Renumber `data-current` / `data-total`** across every `.slide-number`.
  Subagents number their own slide and cannot know the total.
- **Run `./scripts/smoke.sh`.** It catches the assembly mistakes — unbalanced
  markup from a truncated paste, a slide count that disagrees with the markup.

## When a subagent comes back wrong

Re-dispatch that one slide with the missing input named, rather than repairing
its markup by hand. A slide that came back with literal colours was dispatched
without a theme; one with invented numbers was dispatched without content. The
fix is in the prompt, and hand-repair hides which of the four inputs was
missing — so the next batch makes the same mistake.
