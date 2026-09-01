# Themes catalog

Every theme is a short CSS file in `assets/themes/` that overrides tokens
defined in `assets/base.css`. Switch themes by changing the `href` of
`<link id="theme-link">` or by pressing **T** if the deck has a
`data-themes="a,b,c"` attribute on `<body>` or `<html>`.

All themes define the same variables: `--bg`, `--bg-soft`, `--surface`,
`--surface-2`, `--border`, `--text-1/2/3`, `--accent`, `--accent-2/3`,
`--good`, `--warn`, `--bad`, `--grad`, `--grad-soft`, `--radius*`, `--shadow*`,
`--font-sans`, `--font-display`.

## Light & calm

| name | description | when to use |
|---|---|---|
| `minimal-white` | Minimal white, restrained. Pretendard, strong type hierarchy, almost no shadow. | Internal reports, one-on-one technical review, serious topics that should not fight the content |
| `editorial-serif` | Magazine Playfair serif on a cream ground. | Brand stories, text-heavy long-form talks |
| `soft-pastel` | Soft three-colour macaron gradient. | Product launches, consumer-facing, lighter topics |
| `clean-white` | Clean white with a warm red accent and serif headings. | Card news, lifestyle and aesthetics content |
| `solarized-light` | The classic low-glare palette. | Long workshops, teaching |
| `catppuccin-latte` | Catppuccin, light. | Developer-facing, geek-friendly tech sharing |

## Bold & statement

| name | description | when to use |
|---|---|---|
| `sharp-mono` | Pure black and white, Archivo Black, hard shadows. | Manifestos, maximum visual impact |
| `neo-brutalism` | Thick outlines, hard shadows, bright yellow accent. | Startup pitches, a bolder register |
| `bauhaus` | Geometry with red, yellow and blue primaries. | Design talks, art history, product aesthetics |
| `swiss-grid` | Swiss grid, Helvetica feel, a 12-column underlay. | Serious typography, the design industry |
| `memphis-pop` | Memphis pop background dots with oversized headlines. | Young, trend-driven, brand collaborations |

## Cool & dark

| name | description | when to use |
|---|---|---|
| `catppuccin-mocha` | Catppuccin, dark. | Internal developer sharing, long viewing sessions |
| `dracula` | The classic Dracula purple-magenta. | Code-dense technical sharing |
| `tokyo-night` | Tokyo Night blues. | Cooler technical sharing, infrastructure |
| `nord` | Nordic cool blue and white. | Infrastructure, cloud products |
| `gruvbox-dark` | Warm retro dark. | Terminal / vim / *nix communities |
| `rose-pine` | Rosé Pine, a soft dark. | Where design meets development, aesthetics-led engineering |
| `arctic-cool` | Blue, teal and slate, in a light key. | Business analysis, finance, calm and rational |

## Warm & vibrant

| name | description | when to use |
|---|---|---|
| `sunset-warm` | Orange, coral and amber gradient. | Lifestyle, awards, upbeat mood |

## Effect-heavy

| name | description | when to use |
|---|---|---|
| `glassmorphism` | Frosted glass over multi-colour light blooms. | Apple-style launches, feature showcases |
| `aurora` | Aurora gradient with blur and saturate. | Covers, CTAs, closing slides |
| `rainbow-gradient` | White ground with a flowing rainbow gradient accent. | Celebratory, festive, congratulation slides |
| `blueprint` | Engineering blueprint with a grid underlay and montage type. | System architecture, engineering blueprints |
| `terminal-green` | Green-screen terminal, monospace, glowing text. | CLI, black-hat, retro punk |

## v2 additions

### Light & professional

| name | description | when to use |
|---|---|---|
| `corporate-clean` | Pure white with a navy accent, Pretendard, conservative borders. | Board reports, B2B sales, finance and insurance |
| `pitch-deck-vc` | YC-style white with a blue-purple gradient accent and generous whitespace. | Fundraising, seed rounds, VC meetings |
| `academic-paper` | Paper white, serif body, black ink, blue links. | Academic talks, research sharing, conference papers |
| `japanese-minimal` | Ivory with a vermilion accent, very generous whitespace, Noto Serif. | Brand repositioning, craft stories, quieter narratives |
| `engineering-whiteprint` | White with graph-paper grid, navy ink lines, monospace. | System design, API documentation, architecture white papers |

### Bold & editorial

| name | description | when to use |
|---|---|---|
| `magazine-bold` | Cream ground with oversized Playfair serif and an orange spot colour. | Columns, cover stories, brand monthlies |
| `news-broadcast` | White with a red vertical bar, uppercase Oswald, hard shadows. | Breaking news, launch announcements, data broadcasts |
| `midcentury` | Cream with mustard, teal and burnt orange, sharp geometry. | Design history, home aesthetics, retro brands |
| `retro-tv` | Warm cream with CRT scanlines and an amber accent. | Nostalgia, 80s and 90s themes |

### Effect-heavy / dramatic

| name | description | when to use |
|---|---|---|
| `cyberpunk-neon` | Pure black with neon pink, cyan and yellow, glow, JetBrains Mono. | Hacker culture, underground, cyber talks |
| `vaporwave` | Deep purple with pink-cyan-blue gradients and diffuse blooms. | Music, trend art, A E S T H E T I C |
| `y2k-chrome` | Silver chrome gradient, rainbow accent, big radii, Space Grotesk. | Y2K nostalgia, fashion brands, Gen-Z |

## How to apply

```html
<link rel="stylesheet" id="theme-link" href="../assets/themes/aurora.css">
```

Or enable `T`-cycling by listing themes on the body:

```html
<body data-themes="minimal-white,aurora,catppuccin-mocha" data-theme-base="../assets/themes/">
```

## How to extend

Copy an existing theme, rename it, and override only the variables you want to
change. Keep each theme under ~200 lines. Prefer adjusting tokens to adding
new selectors.
