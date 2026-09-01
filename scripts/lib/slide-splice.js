/* html-ppt :: slide-splice.js — read or replace one slide, byte-exactly.
 *
 * Regenerating a single slide used to mean reading a 900-line deck, rewriting
 * it whole, and hoping only the intended slide moved. Two problems with that:
 * it is slow, and it is unverifiable — "I only changed slide 8" is a claim, not
 * a guarantee.
 *
 * This makes it a guarantee. A slide is a contiguous byte range in the file, so
 * replacing one splices at that range and everything outside it is untouched
 * BY CONSTRUCTION, not by care. scripts/slide.sh prints the before/after slide
 * count and confirms the other slides are byte-identical, so the guarantee is
 * also visible.
 *
 * Boundaries are found by scanning tag depth rather than by regex: a slide may
 * contain its own <section> (arch-diagram does), and a regex for </section>
 * would cut the slide short at the inner one.
 */
'use strict';

var OPEN = /<section\b[^>]*\bclass="[^"]*\bslide\b[^"]*"[^>]*>/g;
var ANY_SECTION = /<section\b[^>]*>|<\/section\s*>/g;

/* [{ index, title, start, end }] — start/end are byte offsets into source,
 * end being just past the slide's own </section>. */
function findSlides(source) {
  var out = [];
  OPEN.lastIndex = 0;
  var m;
  while ((m = OPEN.exec(source)) !== null) {
    var start = m.index;
    var end = closeOf(source, start);
    if (end === -1) {
      throw new Error('slide starting at offset ' + start + ' is never closed');
    }
    out.push({
      index: out.length + 1,
      title: titleOf(m[0]),
      start: start,
      end: end,
    });
    // continue past this slide, so a nested <section class="slide"> — which
    // would be malformed anyway — cannot produce overlapping ranges
    OPEN.lastIndex = end;
  }
  return out;
}

/* Walk section opens and closes from `start`, returning the offset just past
 * the close that brings depth back to zero. */
function closeOf(source, start) {
  ANY_SECTION.lastIndex = start;
  var depth = 0, m;
  while ((m = ANY_SECTION.exec(source)) !== null) {
    depth += m[0].charAt(1) === '/' ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return -1;
}

function titleOf(openTag) {
  var m = /\bdata-title="([^"]*)"/.exec(openTag);
  return m ? m[1] : null;
}

/* which: a 1-based slide number, or a data-title string. */
function locate(slides, which) {
  if (typeof which === 'number' || /^\d+$/.test(which)) {
    var n = Number(which);
    if (!(n >= 1 && n <= slides.length)) {
      throw new Error('slide ' + n + ' is out of range — the deck has ' + slides.length);
    }
    return slides[n - 1];
  }
  var hits = slides.filter(function (s) { return s.title === which; });
  if (!hits.length) throw new Error('no slide is titled "' + which + '"');
  if (hits.length > 1) {
    throw new Error('more than one slide is titled "' + which + '" — use its number instead');
  }
  return hits[0];
}

function readSlide(source, which) {
  var s = locate(findSlides(source), which);
  return source.slice(s.start, s.end);
}

/* Returns the new file text. Throws rather than write something surprising. */
function replaceSlide(source, which, replacement) {
  var slides = findSlides(source);
  var target = locate(slides, which);

  /* The replacement has to be one slide and nothing else. Two would silently
   * change the deck's length; zero would delete a slide the caller meant to
   * rewrite; stray text outside the section would land between slides where no
   * layout expects it. */
  var inner = findSlides(replacement);
  if (inner.length !== 1) {
    throw new Error('the replacement must be exactly one <section class="slide">…</section>, found ' + inner.length);
  }
  if (replacement.slice(0, inner[0].start).trim() || replacement.slice(inner[0].end).trim()) {
    throw new Error('the replacement must be exactly one slide — there is text outside the <section>');
  }

  return source.slice(0, target.start) + replacement.trim() + source.slice(target.end);
}

/* Every slide except `skip`, as raw strings — what the caller compares before
 * and after to show that nothing else moved. */
function otherSlides(source, skip) {
  return findSlides(source)
    .filter(function (s) { return s.index !== skip; })
    .map(function (s) { return source.slice(s.start, s.end); });
}

module.exports = { findSlides: findSlides, readSlide: readSlide,
                   replaceSlide: replaceSlide, otherSlides: otherSlides, locate: locate };
