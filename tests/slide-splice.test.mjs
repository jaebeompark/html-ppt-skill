import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { findSlides, replaceSlide } = require('../scripts/lib/slide-splice.js');

/* Regenerating one slide must be incapable of touching the others. These tests
 * are about that guarantee, not about clever slicing. */

const DECK = `<!DOCTYPE html>
<html lang="ko"><body>
<div class="deck">
  <section class="slide" data-title="표지">
    <h1>첫 장</h1>
    <aside class="notes">대본 하나</aside>
  </section>
  <section class="slide center tc" data-title="두 번째">
    <h2>가운데</h2>
  </section>
  <section class="slide" data-title="세 번째">
    <p>끝</p>
  </section>
</div>
<script src="../../assets/runtime.js"></script>
</body></html>
`;

test('finds every slide with its title and byte range', () => {
  const s = findSlides(DECK);
  assert.equal(s.length, 3);
  assert.deepEqual(s.map(x => x.title), ['표지', '두 번째', '세 번째']);
  assert.equal(DECK.slice(s[0].start, s[0].end).startsWith('<section class="slide"'), true);
  assert.equal(DECK.slice(s[0].end - '</section>'.length, s[0].end), '</section>');
});

test('the extracted slice is exactly one slide, notes included', () => {
  const s = findSlides(DECK);
  const one = DECK.slice(s[0].start, s[0].end);
  assert.match(one, /첫 장/);
  assert.match(one, /대본 하나/);
  assert.doesNotMatch(one, /가운데/);
});

test('replacing a slide leaves every other byte identical', () => {
  const before = findSlides(DECK);
  const out = replaceSlide(DECK, 2, '<section class="slide" data-title="새 장">\n    <h2>다시 만듦</h2>\n  </section>');
  const after = findSlides(out);

  assert.equal(after.length, 3);
  assert.match(out, /다시 만듦/);
  assert.doesNotMatch(out, /가운데/);
  // slides either side must be byte-for-byte what they were
  assert.equal(out.slice(after[0].start, after[0].end), DECK.slice(before[0].start, before[0].end));
  assert.equal(out.slice(after[2].start, after[2].end), DECK.slice(before[2].start, before[2].end));
  // and so must everything outside the deck
  assert.equal(out.slice(0, after[0].start), DECK.slice(0, before[0].start));
  assert.equal(out.slice(after[2].end), DECK.slice(before[2].end));
});

test('addresses a slide by its data-title as well as its number', () => {
  const out = replaceSlide(DECK, '두 번째', '<section class="slide" data-title="두 번째">\n    <h2>제목으로 지정</h2>\n  </section>');
  assert.match(out, /제목으로 지정/);
  assert.doesNotMatch(out, /가운데/);
});

test('refuses a replacement that is not exactly one slide', () => {
  assert.throws(() => replaceSlide(DECK, 1, '<div>not a slide</div>'), /exactly one/i);
  assert.throws(
    () => replaceSlide(DECK, 1, '<section class="slide">a</section><section class="slide">b</section>'),
    /exactly one/i);
});

test('refuses an out-of-range slide number rather than guessing', () => {
  assert.throws(() => replaceSlide(DECK, 0, '<section class="slide">x</section>'), /out of range/i);
  assert.throws(() => replaceSlide(DECK, 9, '<section class="slide">x</section>'), /out of range/i);
});

test('refuses a title that matches no slide, or more than one', () => {
  assert.throws(() => replaceSlide(DECK, '없는 제목', '<section class="slide">x</section>'), /no slide/i);
  const dup = DECK.replace('data-title="세 번째"', 'data-title="표지"');
  assert.throws(() => replaceSlide(dup, '표지', '<section class="slide">x</section>'), /more than one/i);
});

test('a slide containing a nested section is still sliced at its own close', () => {
  const nested = `<div class="deck">
  <section class="slide" data-title="a"><section class="inner">x</section><p>tail</p></section>
  <section class="slide" data-title="b"><p>b</p></section>
</div>`;
  const s = findSlides(nested);
  assert.equal(s.length, 2);
  const first = nested.slice(s[0].start, s[0].end);
  // stops at the slide's own close, not the inner <section>'s
  assert.match(first, /<p>tail<\/p><\/section>$/);
  assert.match(first, /<section class="inner">x<\/section>/);
  assert.doesNotMatch(first, /<p>b<\/p>/);
  assert.match(nested.slice(s[1].start, s[1].end), /<p>b<\/p>/);
});
