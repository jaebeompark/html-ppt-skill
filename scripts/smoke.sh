#!/usr/bin/env bash
# html-ppt :: smoke.sh — catch the failures that still look like success
#
# Every check here exists because a real bug shipped past a green-looking run:
# decks that rendered half their slides, a code layout that highlighted
# nothing, a <div> closed before its contents, doc counts drifting off the
# filesystem. All of them printed no error.
#
# Usage:
#   smoke.sh              # offline checks, ~1s
#   smoke.sh --net        # + CDN reachability
#   smoke.sh --render     # + render every deck via headless Chrome (slow)
#   smoke.sh --all        # everything
#
# Exits non-zero if any check fails.

set -uo pipefail
cd "$(dirname "$0")/.."

NET=0; RENDER=0
for a in "$@"; do
  case "$a" in
    --net) NET=1 ;;
    --render) RENDER=1 ;;
    --all) NET=1; RENDER=1 ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

FAIL=0
pass(){ printf '  \033[32m✔\033[0m %s\n' "$1"; }
fail(){ printf '  \033[31m✖\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
head_(){ printf '\n\033[1m%s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- 1. markup
head_ "1. HTML tag balance"
python3 - <<'PY' && pass "every deck and layout parses balanced" || fail "unbalanced markup (see above)"
from html.parser import HTMLParser
import io, glob, sys
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
bad=[]
for f in sorted(glob.glob('templates/**/*.html',recursive=True)
               +glob.glob('examples/**/*.html',recursive=True)
               +glob.glob('docs/**/*.html',recursive=True)):
    stack=[];probs=[]
    class P(HTMLParser):
        def handle_starttag(s,t,a):
            if t not in VOID: stack.append(t)
        def handle_endtag(s,t):
            if t in VOID: return
            if stack and stack[-1]==t: stack.pop()
            elif t in stack:
                # closing an outer tag while inner ones are still open: every
                # tag skipped past is an unclosed tag, so report it rather than
                # letting the recovery swallow it
                skipped=[]
                while stack:
                    x=stack.pop()
                    if x==t: break
                    skipped.append(x)
                probs.append('</%s> closed while %s still open'%(t,skipped))
            else: probs.append('stray </%s>'%t)
    try: P(convert_charrefs=True).feed(io.open(f,encoding='utf-8').read())
    except Exception as e: probs.append('parse error: %s'%e)
    if stack or probs:
        bad.append('    %s  unclosed=%s %s'%(f,stack,probs))
if bad:
    print('\n'.join(bad)); sys.exit(1)
PY

# ------------------------------------------------------------- 2. inventory
head_ "2. Documented counts match the filesystem"
python3 - <<'PY' && pass "counts in SKILL.md and READMEs match" || fail "stale counts (see above)"
import glob, io, re, sys
actual = {
  'themes'     : len(glob.glob('assets/themes/*.css')),
  'layouts'    : len(glob.glob('templates/single-page/*.html')),
  'full-decks' : len(glob.glob('templates/full-decks/*/')),
  'fx'         : len([f for f in glob.glob('assets/animations/fx/*.js')
                      if not f.split('/')[-1].startswith('_')]),
}
# unit words as they appear across the English, Korean and Chinese docs
PAT = {
  'themes'    : r'(\d+)\s*(?:themes|개 테마|套主题)',
  'layouts'   : r'(\d+)\s*(?:layouts|layout types|page layouts|种可复用单页|种单页布局|种布局|种版式|개 레이아웃)',
  'full-decks': r'(\d+)\s*(?:full-deck templates|套完整 deck 模板|个完整 deck|个 scoped 多页 deck 模板|deck gallery)',
  'fx'        : r'(\d+)\s*(?:canvas FX|个 Canvas FX|Canvas FX)',
}
docs = ['SKILL.md','README.md','README.zh-CN.md'] + sorted(glob.glob('references/*.md'))
bad=[]
for f in docs:
    s = io.open(f,encoding='utf-8').read()
    for key,pat in PAT.items():
        for m in re.finditer(pat,s):
            n=int(m.group(1))
            if n != actual[key]:
                line = s[:m.start()].count('\n')+1
                bad.append('    %s:%d  says %d %s, filesystem has %d'
                           %(f,line,n,key,actual[key]))
if bad:
    print('\n'.join(bad)); sys.exit(1)
PY

# --------------------------------------------------------------- 3. layouts
head_ "3. Layout catalogue matches the layout files"
python3 - <<'PY' && pass "no layout carries its own CSS; every class it uses is defined" || fail "layout CSS drift (see above)"
import glob, io, re, sys
bad=[]

# 3a. Layout CSS belongs in assets/layouts.css. A <style> block back inside a
#     layout file means copying the <section> silently loses those rules again.
for f in sorted(glob.glob('templates/single-page/*.html')):
    if re.search(r'<style>', io.open(f,encoding='utf-8').read()):
        bad.append('    %s carries a <style> block — move it to assets/layouts.css'%f)
if not io.open('assets/base.css',encoding='utf-8').read().count("@import url('layouts.css')"):
    bad.append('    assets/base.css no longer imports layouts.css')

# 3b. every class a layout uses must be defined by base/layouts/animations/themes
known=set()
for f in (['assets/base.css','assets/layouts.css','assets/animations/animations.css']
          + glob.glob('assets/themes/*.css')):
    known |= set(re.findall(r'\.([a-z][a-z0-9-]*)', io.open(f,encoding='utf-8').read()))
ALLOW = {'language-javascript','language-css','language-bash','language-json','hljs','g1'}
for f in sorted(glob.glob('templates/single-page/*.html')):
    used=set()
    for m in re.findall(r'class="([^"]+)"', io.open(f,encoding='utf-8').read()):
        used |= set(m.split())
    unknown = sorted(c for c in used if c not in known and c not in ALLOW)
    if unknown:
        bad.append('    %s uses undefined classes: %s'%(f,unknown))

if bad:
    print('\n'.join(bad)); sys.exit(1)
PY

# ----------------------------------------------------------------- 4. fonts
head_ "4. Every theme can render Korean"
python3 - <<'PY' && pass "all 36 themes resolve to a Korean-capable family" || fail "a theme would fall back to a system font (see above)"
import glob, io, re, sys
KOREAN = ('Pretendard','Noto Sans KR','Noto Serif KR')
bad=[]
for f in sorted(glob.glob('assets/themes/*.css')):
    m = re.search(r'--font-sans\s*:\s*([^;]+)', io.open(f,encoding='utf-8').read())
    if not m:
        bad.append('    %s declares no --font-sans'%f); continue
    if not any(k in m.group(1) for k in KOREAN):
        bad.append('    %s --font-sans has no Korean face: %s'%(f,m.group(1).strip()))
if bad:
    print('\n'.join(bad)); sys.exit(1)
PY

# ------------------------------------------------------------ 5. slide count
head_ "5. Slide detection agrees with the markup"
python3 - <<'PY' && pass "render.sh's 'all' pattern counts every deck correctly" || fail "slide-count detection would truncate a deck (see above)"
import glob, io, re, sys
bad=[]
for f in sorted(glob.glob('examples/*/index.html')
               +['templates/deck.html']
               +glob.glob('templates/full-decks/*/index.html')):
    s = io.open(f,encoding='utf-8').read()
    truth   = len(re.findall(r'<section[^>]*class="slide[ "]', s))
    detected= len(re.findall(r'class="slide[ "]', s))   # render.sh's pattern
    if truth == 0:
        bad.append('    %s has no slides'%f)
    elif truth != detected:
        bad.append('    %s: markup has %d slides, render.sh would find %d'%(f,truth,detected))
if bad:
    print('\n'.join(bad)); sys.exit(1)
PY

# -------------------------------------------------------------------- 6. net
if [[ "$NET" == "1" ]]; then
  head_ "6. External assets reachable"
  URLS="$(mktemp)"
  python3 - "$URLS" <<'PY'
import glob, io, re, sys
srcs = (glob.glob('assets/**/*', recursive=True)
        + glob.glob('templates/**/*.html', recursive=True)
        + glob.glob('examples/**/*.html', recursive=True))
out = set()
for f in srcs:
    try: s = io.open(f, encoding='utf-8').read()
    except Exception: continue
    # drop code blocks: a URL printed as slide copy is not a dependency
    s = re.sub(r'<pre.*?</pre>', '', s, flags=re.S)
    for line in s.splitlines():
        if re.search(r'href=|src=|@import', line):
            out |= set(re.findall(
                r'https://(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com)[^"\' )]+', line))
io.open(sys.argv[1], 'w').write('\n'.join(sorted(out)))
PY
  n=0; bads=0
  while IFS= read -r u; do
    [[ -z "$u" ]] && continue
    n=$((n+1))
    code=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 20 "$u" || echo 000)
    [[ "$code" == "200" ]] || { echo "    $code  $u"; bads=$((bads+1)); }
  done < "$URLS"
  rm -f "$URLS"
  [[ "$bads" == "0" ]] && pass "$n CDN URLs return 200" || fail "$bads of $n CDN URLs unreachable"
fi

# ----------------------------------------------------------------- 7. render
if [[ "$RENDER" == "1" ]]; then
  head_ "7. Every deck renders every slide"
  TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
  bads=0; n=0
  for f in examples/*/index.html templates/deck.html templates/full-decks/*/index.html; do
    name="$(basename "$(dirname "$f")")"; [[ "$name" == "templates" ]] && name="deck"
    want=$(grep -c '<section[^>]*class="slide[ "]' "$f")
    ./scripts/render.sh "$f" all "$TMP/$name" >/dev/null 2>&1
    got=$(ls "$TMP/$name"/*.png 2>/dev/null | wc -l | tr -d ' ')
    blank=$(find "$TMP/$name" -name '*.png' -size -6k 2>/dev/null | wc -l | tr -d ' ')
    n=$((n+1))
    if [[ "$got" != "$want" ]]; then
      echo "    $name: expected $want PNGs, got $got"; bads=$((bads+1))
    elif [[ "$blank" != "0" ]]; then
      echo "    $name: $blank blank PNG(s)"; bads=$((bads+1))
    fi
  done
  [[ "$bads" == "0" ]] && pass "$n decks rendered every slide, none blank" || fail "$bads of $n decks rendered wrong"
fi

# -------------------------------------------------------- 8. deck-extras
head_ "8. deck-extras.js initialises"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$CHROME_BIN" ]]; then
  fail "Chrome not found at $CHROME_BIN — cannot verify deck-extras.js"
else
  FIXDIR="$(mktemp -d)"
  REPO="$(pwd)"
  cat > "$FIXDIR/fixture.html" <<HTML
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="file://$REPO/assets/base.css"></head><body>
<div class="deck" data-copyright="SENTINEL-NOTICE">
  <section class="slide is-active"><h1>one</h1></section>
  <section class="slide"><h1>two</h1></section>
</div>
<script src="file://$REPO/assets/deck-extras.js"></script>
</body></html>
HTML
  DOM="$("$CHROME_BIN" --headless=new --disable-gpu --no-sandbox \
        --virtual-time-budget=2000 --dump-dom "file://$FIXDIR/fixture.html" 2>/dev/null)"
  rm -rf "$FIXDIR"

  got=$(grep -c 'class="deck-copyright"' <<<"$DOM" || true)
  [[ "$got" == "2" ]] \
    && pass "data-copyright stamps every slide (2/2)" \
    || fail "deck-copyright landed on $got of 2 slides"

  grep -q 'class="deck-copyright">SENTINEL-NOTICE<' <<<"$DOM" \
    && pass "the notice text is the attribute's value" \
    || fail "stamped element does not carry the attribute text"

  grep -q '\.deck-copyright' assets/layouts.css \
    && pass ".deck-copyright is styled in layouts.css" \
    || fail ".deck-copyright has no CSS"

  # base.css hides .deck-footer when printing. The notice must NOT be hidden
  # with it — a handout without its copyright line is the bug this guards.
  python3 - <<'PY' && pass "print CSS keeps .deck-copyright visible" || fail "print CSS would hide the notice"
import io, re, sys
s = io.open('assets/base.css', encoding='utf-8').read()
m = re.search(r'@media print\{(.*?)\n\}', s, re.S)
if not m:
    print('    assets/base.css has no @media print block'); sys.exit(1)
if 'deck-copyright' in m.group(1):
    print('    assets/base.css @media print hides .deck-copyright'); sys.exit(1)
PY
fi

# ---------------------------------------------------------------- summary
if [[ "$FAIL" == "0" ]]; then
  printf '\n\033[32mall checks passed\033[0m\n'
  exit 0
fi
printf '\n\033[31m%d check(s) failed\033[0m\n' "$FAIL"
exit 1
