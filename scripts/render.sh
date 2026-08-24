#!/usr/bin/env bash
# html-ppt :: render.sh — headless Chrome screenshot(s)
#
# Usage:
#   render.sh <html-file>                     # one PNG, slide 1
#   render.sh <html-file> <N>                 # N PNGs, slides 1..N, via #/k
#   render.sh <html-file> all                 # autodetect .slide count
#   render.sh <html-file> <N> <out-dir>       # custom output dir (any N; created if missing)
#
# Exits non-zero if any slide failed to render.
#
# Requires: Google Chrome at /Applications/Google Chrome.app (macOS).

set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$CHROME" ]]; then
  echo "error: Chrome not found at $CHROME" >&2
  exit 1
fi

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "usage: render.sh <html> [N|all] [out-dir]" >&2
  exit 1
fi
if [[ ! -f "$FILE" ]]; then
  echo "error: $FILE not found" >&2
  exit 1
fi

COUNT="${2:-1}"
OUT="${3:-}"

FAILED=0
ABS="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"
STEM="$(basename "${FILE%.*}")"

if [[ "$COUNT" == "all" ]]; then
  COUNT="$(grep -c 'class="slide"' "$FILE" || true)"
  [[ -z "$COUNT" || "$COUNT" -lt 1 ]] && COUNT=1
fi

# $3 is always an output DIRECTORY, for any slide count. It is created if missing.
if [[ -z "$OUT" ]]; then
  if [[ "$COUNT" -gt 1 ]]; then
    OUT="$(dirname "$FILE")/${STEM}-png"
  else
    OUT="$(dirname "$FILE")"
  fi
fi
mkdir -p "$OUT"

render_one() {
  local url="$1" target="$2"
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --no-sandbox \
    --virtual-time-budget=4000 \
    --window-size=1920,1080 \
    --screenshot="$target" \
    "$url" >/dev/null 2>&1
  # Chrome exits 0 even when it writes nothing, so confirm the file landed.
  if [[ ! -f "$target" || ! -s "$target" ]]; then
    echo "  ✖ $target (Chrome produced no image)" >&2
    FAILED=$((FAILED + 1))
    return 1
  fi
  echo "  ✔ $target"
}

if [[ "$COUNT" == "1" ]]; then
  render_one "file://$ABS" "$OUT/${STEM}.png" || true
else
  for i in $(seq 1 "$COUNT"); do
    render_one "file://$ABS#/$i" "$OUT/${STEM}_$(printf '%02d' "$i").png" || true
  done
fi

if [[ "$FAILED" -gt 0 ]]; then
  echo "done: rendered $((COUNT - FAILED))/$COUNT slide(s) from $FILE — $FAILED failed" >&2
  exit 1
fi
echo "done: rendered $COUNT slide(s) from $FILE"
