import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { applyPatches } = require('../assets/editor-patch.js');

/* The save path rewrites the deck's own source file. Anything it gets wrong is
 * data loss on a file the user has been editing all afternoon, so these tests
 * are about refusing to write rather than about writing cleverly. */

test('replaces a unique fragment and leaves the rest byte-identical', () => {
  const src = '<h1 class="h1">before</h1>\n<p>tail</p>';
  const out = applyPatches(src, [{ before: 'before', after: '이후', nth: 0 }]);
  assert.equal(out, '<h1 class="h1">이후</h1>\n<p>tail</p>');
});

test('an empty patch list returns the source unchanged', () => {
  const src = '<p>a</p>';
  assert.equal(applyPatches(src, []), src);
});

test('nth picks the right occurrence when a fragment repeats', () => {
  const src = '<li>항목</li><li>항목</li><li>항목</li>';
  const out = applyPatches(src, [{ before: '항목', after: '두번째', nth: 1 }]);
  assert.equal(out, '<li>항목</li><li>두번째</li><li>항목</li>');
});

test('several patches apply together without corrupting each others offsets', () => {
  // The second patch sits after the first and its replacement is a different
  // length — applying left-to-right on live offsets would land in the wrong place.
  const src = '<h1>제목</h1><p>본문입니다</p><span>꼬리</span>';
  const out = applyPatches(src, [
    { before: '제목', after: '아주 긴 새 제목', nth: 0 },
    { before: '본문입니다', after: '짧게', nth: 0 },
    { before: '꼬리', after: '끝', nth: 0 },
  ]);
  assert.equal(out, '<h1>아주 긴 새 제목</h1><p>짧게</p><span>끝</span>');
});

test('a replacement containing the original text does not re-match', () => {
  const src = '<p>AI</p>';
  const out = applyPatches(src, [{ before: 'AI', after: 'AI 활용', nth: 0 }]);
  assert.equal(out, '<p>AI 활용</p>');
});

test('throws when the fragment is not in the source', () => {
  assert.throws(
    () => applyPatches('<p>a</p>', [{ before: 'nope', after: 'x', nth: 0 }]),
    /not found/i,
  );
});

test('throws when nth exceeds the number of occurrences', () => {
  assert.throws(
    () => applyPatches('<li>a</li><li>a</li>', [{ before: 'a', after: 'b', nth: 5 }]),
    /occurrence/i,
  );
});

test('throws when two patches target overlapping ranges', () => {
  // Both would rewrite the same bytes; applying both silently would corrupt.
  assert.throws(
    () => applyPatches('<p>abcdef</p>', [
      { before: 'abcd', after: 'x', nth: 0 },
      { before: 'cdef', after: 'y', nth: 0 },
    ]),
    /overlap/i,
  );
});

test('preserves surrounding whitespace and newlines exactly', () => {
  const src = '<section>\n    <p>  spaced  </p>\n</section>\n';
  const out = applyPatches(src, [{ before: '  spaced  ', after: '  변경  ', nth: 0 }]);
  assert.equal(out, '<section>\n    <p>  변경  </p>\n</section>\n');
});

test('an unchanged patch (after === before) is a no-op, not an error', () => {
  const src = '<p>같음</p>';
  assert.equal(applyPatches(src, [{ before: '같음', after: '같음', nth: 0 }]), src);
});

/* ------------------------------------------------------------------------
 * locateDecoded — find text in the source when the source spells it with
 * entities. The DOM hands us "…" and "✓"; the file says &ldquo; and &#10003;.
 * A plain indexOf misses those, and the elements silently become unsaveable.
 * ---------------------------------------------------------------------- */

const { locateDecoded } = require('../assets/editor-patch.js');

test('locates plain text with no entities involved', () => {
  const src = '<p>hello there</p>';
  assert.deepEqual(locateDecoded(src, 'hello there', 0), { start: 3, end: 14 });
});

test('locates text the source spells with a named entity', () => {
  const src = '<li>심사역은 <b>&ldquo;모름&rdquo; 항목부터</b> 본다</li>';
  const hit = locateDecoded(src, '“모름” 항목부터', 0);
  assert.equal(src.slice(hit.start, hit.end), '&ldquo;모름&rdquo; 항목부터');
});

test('locates text the source spells with a numeric entity', () => {
  const src = '<h3><span class="b">&#10003;</span> 좋은 점</h3>';
  const hit = locateDecoded(src, '<span class="b">✓</span> 좋은 점', 0);
  assert.equal(src.slice(hit.start, hit.end), '<span class="b">&#10003;</span> 좋은 점');
});

test('handles &amp; without mangling the ampersand', () => {
  const src = '<p>Q&amp;A 시간</p>';
  const hit = locateDecoded(src, 'Q&A 시간', 0);
  assert.equal(src.slice(hit.start, hit.end), 'Q&amp;A 시간');
});

test('nth selects the right occurrence across entity spellings', () => {
  const src = '<li>&ldquo;A&rdquo;</li><li>&ldquo;A&rdquo;</li>';
  const first = locateDecoded(src, '“A”', 0);
  const second = locateDecoded(src, '“A”', 1);
  assert.ok(second.start > first.start);
  assert.equal(src.slice(second.start, second.end), '&ldquo;A&rdquo;');
});

test('returns null when the text is not there at all', () => {
  assert.equal(locateDecoded('<p>a</p>', 'nope', 0), null);
});

test('returns null when nth runs past the last occurrence', () => {
  assert.equal(locateDecoded('<p>a</p><p>a</p>', 'a', 5), null);
});

test('a located range can be fed straight back to applyPatches', () => {
  // the whole point: locate in decoded space, patch in raw bytes
  const src = '<h3><span class="b">&#10003;</span> 좋은 점</h3>';
  const hit = locateDecoded(src, '<span class="b">✓</span> 좋은 점', 0);
  const before = src.slice(hit.start, hit.end);
  const out = applyPatches(src, [{ before, after: '갈아끼움', nth: 0 }]);
  assert.equal(out, '<h3>갈아끼움</h3>');
});
