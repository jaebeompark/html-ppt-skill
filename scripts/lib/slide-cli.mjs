/* html-ppt :: slide-cli.mjs — the node half of scripts/slide.sh.
 *
 * Kept separate from slide-splice.js so the splice logic stays a pure module
 * the tests can drive without going near argv, stdin or the filesystem.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { findSlides, readSlide, replaceSlide, otherSlides } = require('./slide-splice.js');

const [, , cmd, deck, which, from] = process.argv;
const src = fs.readFileSync(deck, 'utf8');

function die(msg) { process.stderr.write('error: ' + msg + '\n'); process.exit(1); }

if (cmd === 'list') {
  const slides = findSlides(src);
  for (const s of slides) {
    const lines = src.slice(0, s.start).split('\n').length;
    process.stdout.write(
      String(s.index).padStart(3) + '  ' +
      String(s.end - s.start).padStart(6) + ' bytes  line ' + String(lines).padStart(4) + '  ' +
      (s.title || '(untitled)') + '\n');
  }
  process.stderr.write('\n' + slides.length + ' slides\n');

} else if (cmd === 'get') {
  try { process.stdout.write(readSlide(src, which) + '\n'); }
  catch (e) { die(e.message); }

} else if (cmd === 'set') {
  let replacement;
  try {
    replacement = from === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(from, 'utf8');
  } catch (e) { die('cannot read the replacement: ' + e.message); }

  const before = findSlides(src);
  let target, out;
  try {
    const { locate } = require('./slide-splice.js');
    target = locate(before, which);
    out = replaceSlide(src, which, replacement);
  } catch (e) { die(e.message); }

  /* The splice cannot touch other slides — but say so out loud rather than
   * asking anyone to take it on trust. This is the whole point of the tool. */
  const wasOthers = otherSlides(src, target.index);
  const nowOthers = otherSlides(out, target.index);
  const after = findSlides(out);

  if (after.length !== before.length) {
    die('the replacement changed the slide count (' + before.length + ' -> ' + after.length + ')');
  }
  const moved = wasOthers.filter((t, i) => t !== nowOthers[i]).length;
  if (moved) die(moved + ' other slide(s) would change — refusing to write');

  fs.writeFileSync(deck, out);
  process.stderr.write(
    'slide ' + target.index + (target.title ? ' (' + target.title + ')' : '') + ' replaced\n' +
    '  ' + (before[target.index - 1].end - before[target.index - 1].start) + ' bytes -> ' +
    (after[target.index - 1].end - after[target.index - 1].start) + ' bytes\n' +
    '  ' + (before.length - 1) + ' other slides byte-identical\n');

} else {
  die("unknown command '" + cmd + "'");
}
