#!/usr/bin/env bash
# html-ppt :: slide.sh — read or replace ONE slide, provably leaving the rest alone.
#
# Regenerating a single slide by rewriting the whole deck is slow (900 lines
# read and written to change 40) and unverifiable — "I only touched slide 8" is
# a claim. This makes it a guarantee: a slide is a contiguous byte range, so a
# replacement splices at that range and the other slides cannot move.
#
# Usage:
#   slide.sh list <deck>                     every slide, numbered, with its title
#   slide.sh get  <deck> <n|title>           print that slide's source
#   slide.sh set  <deck> <n|title> <file>    replace it with the contents of <file>
#   slide.sh set  <deck> <n|title> -         ... or from stdin
#
#   <deck> may be the .html file or the directory holding index.html.
#
# `set` prints what changed and confirms every other slide is byte-identical.
# It refuses if the replacement is not exactly one <section class="slide">.

set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
CMD="${1:-}"
TARGET="${2:-}"

if [[ -z "$CMD" || -z "$TARGET" ]]; then
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi

if [[ -d "$TARGET" ]]; then DECK="$TARGET/index.html"; else DECK="$TARGET"; fi
if [[ ! -f "$DECK" ]]; then echo "error: $DECK not found" >&2; exit 1; fi

case "$CMD" in
  list) node "$HERE/scripts/lib/slide-cli.mjs" list "$DECK" ;;
  get)
    [[ -n "${3:-}" ]] || { echo "error: which slide? e.g. slide.sh get $TARGET 8" >&2; exit 1; }
    node "$HERE/scripts/lib/slide-cli.mjs" get "$DECK" "$3"
    ;;
  set)
    [[ -n "${3:-}" && -n "${4:-}" ]] || {
      echo "error: usage: slide.sh set <deck> <n|title> <file|->" >&2; exit 1; }
    node "$HERE/scripts/lib/slide-cli.mjs" set "$DECK" "$3" "$4"
    ;;
  *) echo "error: unknown command '$CMD' — expected list, get or set" >&2; exit 1 ;;
esac
