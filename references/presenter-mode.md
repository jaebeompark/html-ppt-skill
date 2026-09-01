# Presenter Mode Guide

How to build a deck with a **speaker script and a presenter window** in this skill.

## When to use presenter mode

Reach for it whenever the request involves any of these:

- The words **발표 / 강의 / 대본 / 발표 대본 / speaker notes / 대사**
- **presenter view**, **presenter mode**, **teleprompter**
- A talk of a stated length — "30분 / 45분 / 1시간 발표"
- "팀에 발표하러 갑니다", "기술 공유를 하나 해야 해요", "IR 피칭을 합니다"
- Anxiety cues: "말이 막힐까 봐", "대본 없이는 불안해서", "프롬프터가 필요해요"

You do **not** need presenter mode when the user just wants a good-looking static
deck they will not narrate — card news, a product brochure, a report to be read
rather than presented.

## Two ways to get it

### ✅ Preferred: start from `presenter-reveal`

```bash
cp -r templates/full-decks/presenter-reveal examples/my-talk
```

That template already has everything wired:

- `S` opens the presenter window
- `T` cycles five themes (tokyo-night / dracula / catppuccin-mocha / nord / corporate-clean)
- arrow keys move between slides
- every slide carries a 150–300 character worked example script
- a key hint sits along the bottom
- Korean typography is handled (`word-break: keep-all`, roomier line-height)

Replace the content and you are done.

### 🔧 Or: add presenter mode to any existing template

**The `S` presenter window lives in `runtime.js`, so every full-deck template
already supports it.** Two things are needed:

1. An `<aside class="notes">` at the end of each slide, holding the script
2. `assets/runtime.js` loaded by the page

```html
<section class="slide">
  <h2>제목</h2>
  <p>내용...</p>
  <aside class="notes">
    <p>여기에 실제로 할 말을 150~300자로 씁니다...</p>
  </aside>
</section>
```

## Three rules for writing the script

This is the heart of the method. Follow all three.

### Rule 1: signals, not a script to read aloud

❌ **Wrong** — this reads like something being recited:
```
안녕하세요, 오늘 발표에 오신 것을 환영합니다. 오늘 저는 저희 팀이 지난 세 달 동안
수행한 업무에 대하여 소개해 드리고자 합니다. 먼저 배경 상황을 살펴보겠습니다.
지난 세 달 동안 저희는 다음과 같은 문제들에 직면하였습니다……
```

✅ **Right** — signals, with the key words bolded:
```html
<p>안녕하세요. 오늘은 저희 팀이 <strong>지난 세 달</strong> 동안 한 일을 공유하겠습니다.</p>
<p>먼저 <em>배경</em>부터요 — 석 달 전 저희에게는 <strong>문제가 셋</strong> 있었습니다.
지연이 길고, 비용이 터지고, 안정성이 낮았습니다.</p>
<p>그럼 하나씩 어떻게 풀었는지 보겠습니다.</p>
```

**The difference:** the key words are bold and each transition is its own
paragraph, so one glance is enough to pick the thread back up.

### Rule 2: 150–300 characters per slide

- **Under 150** — not enough of a cue; you stall halfway through
- **Over 300** — you cannot scan it in time
- **2–3 minutes per slide** is the comfortable rhythm

### Rule 3: spoken register, not written

| ❌ Written | ✅ Spoken |
|---|---|
| 따라서 | 그래서 |
| 해당 방안 | 이 방법 |
| 그러나 | 하지만 / 근데 |
| 최적화를 진행하다 | 최적화하다 |
| ~하고자 합니다 | ~하겠습니다 |
| 상기한 바와 같이 | 앞에서 말씀드린 대로 |

**How to check:** read it out loud when you are done. It should sound like
speech, not like recitation.

## The HTML you need

```html
<!DOCTYPE html>
<html lang="ko" data-themes="tokyo-night,dracula,corporate-clean">
<head>
  <meta charset="utf-8">
  <title>...</title>
  <link rel="stylesheet" href="../../../assets/fonts.css">
  <link rel="stylesheet" href="../../../assets/base.css">
  <link rel="stylesheet" id="theme-link" href="../../../assets/themes/tokyo-night.css">
  <link rel="stylesheet" href="../../../assets/animations/animations.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="deck">

  <section class="slide" data-title="표지">
    <h1>제목</h1>
    <p>부제</p>
    <aside class="notes">
      <p>대본 문단 1 (<strong>핵심어는 굵게</strong>).</p>
      <p>대본 문단 2 (전환 문장은 문단을 나눕니다).</p>
      <p>대본 문단 3 (자연스럽게 다음 장으로 넘어가며 마무리).</p>
    </aside>
  </section>

  <!-- more slides ... -->

</div>
<script src="../../../assets/runtime.js"></script>
</body>
</html>
```

The presenter window's own chrome follows the deck's `<html lang>` — Korean by
default, English with `lang="en"`. Only the chrome is translated; the script
itself is whatever you wrote in `.notes`.

## What the presenter window shows

Pressing `S` opens **a separate presenter window** while the original page stays
as the audience view. The presenter window is **four draggable cards**:

```
 Audience window (original)   Presenter window (magnetic cards)
┌─────────────────┐   ┌─────────────────────┬──────────────────┐
│                 │   │ 🔵 현재             │ 🟣 다음            │
│  the slide,     │   │ ━━━━━━━━━━━━━━━━ │ ━━━━━━━━━━━━━ │
│  full screen    │◄►│                   │  iframe preview   │
│                 │   │  iframe preview   │  (next slide)     │
│                 │   │  (current slide)  ├──────────────────┤
│                 │   │                   │ 🟠 발표 대본        │
│                 │   │                   │ ━━━━━━━━━━━━━ │
│                 │   ├─────────────────────┤  [large type]     │
│                 │   │ 🟢 타이머           │  [scrollable]     │
│                 │   │ ⏱ 12:34   3 / 8 │                   │
│                 │   │ [← 이전][다음 →]   │                   │
└─────────────────┘   └─────────────────────┴──────────────────┘
       ↑ BroadcastChannel keeps both in sync ↑
```

Card interaction:

- **Drag a card header** (the bar with the coloured dot and title) to move it
- **Drag the triangle handle at the bottom-right** to resize it
- **Position and size persist to `localStorage`** and come back next time
- The **배치 초기화** button at the bottom restores the default arrangement

Card contents:

- 🔵 **현재** — a **pixel-perfect** preview of the current slide (an iframe
  loading the same HTML with `?preview=N`, so the colours cannot drift)
- 🟣 **다음** — the next slide, same mechanism
- 🟠 **발표 대본** — the script at 18px, with `<strong>` (orange), `<em>` (blue)
  and `<code>` inline styles honoured
- 🟢 **타이머** — a timer that never loses focus, with prev/next buttons

Both windows sync: press ← → / ↑ ↓ in either one and the other follows
(BroadcastChannel).

Navigation is smooth: the iframe loads once, and later moves are a `postMessage`
that switches the visible slide — no reload, no flicker.

## Keyboard (presenter mode)

| key | action |
|---|---|
| `S` | open the presenter window (the original page stays the audience view) |
| `←` `→` / `↑` `↓` / Space / PgDn | move between slides (from either window) |
| `T` | cycle themes |
| `R` | reset the timer (presenter window) |
| `F` | fullscreen |
| `O` | overview |
| `Esc` | close overlays |

## The two-screen routine

1. Open `index.html`, press `S` — the presenter window appears
2. Drag the **audience window** to the projector or external screen, press `F`
3. Keep the **presenter window** on the screen in front of you
4. Move with ← → / ↑ ↓ in either window; both stay in sync
5. Read the script, the next slide and the timer from the presenter window

> 💡 **Why the previews are pixel-perfect:** each one is an `<iframe>` loading
> the very same deck file with a `?preview=N` parameter. `runtime.js` sees that
> parameter and renders only slide N with no chrome. **The iframe uses the same
> CSS, theme, fonts and viewport as the audience view**, so colour and layout are
> guaranteed to match. The card scales it with CSS `transform: scale()`, so
> 1920×1080 shrinks proportionally without distortion.

> 💡 **Why it does not flicker:** the iframe stays loaded. On a slide change the
> presenter window sends `postMessage({type:'preview-goto', idx:N})` and the
> iframe's runtime.js just toggles the `.is-active` class — no reload, no white
> flash.

## Common mistakes

### ❌ Putting the script where the audience can see it

```html
<!-- Wrong: the audience reads this -->
<p style="font-size:12px;color:gray">
  여기서 xxx 를 말하고, 그다음 yyy 를...
</p>
```

✅ Right:
```html
<aside class="notes">
  <p>여기서 xxx 를 말하고, 그다음 yyy 를...</p>
</aside>
```

`.notes` is `display:none` by default and only appears in the presenter window.

### ❌ Forgetting runtime.js

No `<script src="../../../assets/runtime.js"></script>` means no `S` key, no
presenter window, and no slide navigation at all.

### ❌ Writing the script in written register

It comes out sounding like a machine. **Always read it aloud once.**

### ❌ 50 characters per slide

Not enough of a cue — you forget your line anyway.

### ❌ 500 characters per slide

Your eyes cannot cover it, so it may as well not be there.

## A prompt for generating the script

> "각 슬라이드마다 **150~300자** 분량의 발표 대본을 `<aside class="notes">` 안에 써 주세요.
> 조건:
> 1. **입말**로 씁니다 (따라서 → 그래서, 그러나 → 하지만)
> 2. **핵심어**는 `<strong>` 으로 굵게
> 3. 전환 문장은 문단을 나눕니다 (한 문단에 1~3문장)
> 4. 소리 내 읽었을 때 말하는 것처럼 들려야 합니다
> 5. 끝은 다음 장으로 자연스럽게 이어지게"

## What pairs well

- **Themes:** `tokyo-night` (dark, the default for technical sharing),
  `corporate-clean` (light, for business reporting), `dracula` (dark alternative)
- **Fonts:** Pretendard by default (Latin + Hangul) plus JetBrains Mono — no change needed
- **Animation:** keep it restrained. `fade-up` and `rise-in` read most naturally;
  avoid `glitch-in`, `confetti-burst` and the like
- **Length:** a 30-minute talk is 8–12 slides; 45 minutes is 12–16; an hour is 16–22
