#!/usr/bin/env bash
# html-ppt :: edit.sh — open a deck with in-browser text editing.
#
# Usage:
#   edit.sh examples/my-talk                 # a deck directory
#   edit.sh examples/my-talk/index.html      # or the file itself
#   edit.sh examples/my-talk 8200            # pin the port
#
# Presenting needs none of this — open the .html and it is the static deck it
# always was. This is only for the afternoon you spend fixing wording.
#
#   E    toggle edit mode        ⌘S / Ctrl-S   save
#   ＋   add a list/grid item    ×             remove one
#   Esc  leave edit mode         paste         drop an image into the slot
#
# Ctrl-C stops the server.

set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-}"
PORT="${2:-8123}"

if [[ -z "$TARGET" ]]; then
  echo "usage: edit.sh <deck-dir|deck.html> [port]" >&2
  exit 1
fi

# accept a directory or the file; normalise to a repo-relative .html path
if [[ -d "$TARGET" ]]; then
  DECK="$TARGET/index.html"
else
  DECK="$TARGET"
fi
if [[ ! -f "$DECK" ]]; then
  echo "error: $DECK not found" >&2
  exit 1
fi

ABS="$(cd "$(dirname "$DECK")" && pwd)/$(basename "$DECK")"
case "$ABS" in
  "$HERE"/*) REL="${ABS#$HERE/}" ;;
  *) echo "error: $DECK is outside the skill directory" >&2; exit 1 ;;
esac

# a port already in use would silently serve someone else's files
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "error: port $PORT is already in use — pass a different one:" >&2
  echo "  ./scripts/edit.sh $TARGET $((PORT + 1))" >&2
  exit 1
fi

URL="http://127.0.0.1:$PORT/$REL?edit=1"
echo "editing $REL"
echo "  $URL"
echo ""
echo "  E  edit mode    ⌘S  save    Esc  leave    paste  image"
echo ""

python3 "$HERE/scripts/edit-server.py" "$PORT" &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT INT TERM
sleep 0.6
command -v open >/dev/null 2>&1 && open "$URL" || echo "open $URL in your browser"
wait $SERVER
