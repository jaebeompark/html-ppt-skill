/* html-ppt :: editor-patch.js — turn edits into a minimal source rewrite.
 *
 * The save path does NOT serialise the live DOM. By the time you press save,
 * runtime.js has added .is-active classes, built 24 hidden overview clones and
 * let Chart.js paint into canvases; serialising all that would write a file
 * nothing could diff and nothing could re-open cleanly.
 *
 * Instead the editor sends a list of {before, after, nth} patches and this
 * splices them into the original file text. Everything the user did not touch
 * stays byte-for-byte identical, so `git diff` after fixing a typo shows one
 * changed line.
 *
 * Every failure mode here throws. This function rewrites a file the user has
 * been working in, so refusing to write is always better than writing
 * something plausible-looking and wrong.
 *
 * Loaded as a plain <script> in the browser (window.EditorPatch) and required
 * from tests in Node. No build step either way.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EditorPatch = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Byte offset of the nth occurrence of `needle`, or -1. indexOf-in-a-loop
   * rather than a regex: the fragments are arbitrary HTML and escaping them
   * for a regex is a bug waiting to happen. */
  function nthIndexOf(haystack, needle, nth) {
    var i = -1;
    for (var seen = 0; seen <= nth; seen++) {
      i = haystack.indexOf(needle, i + 1);
      if (i === -1) return -1;
    }
    return i;
  }

  function countOccurrences(haystack, needle) {
    if (!needle) return 0;
    var n = 0, i = haystack.indexOf(needle);
    while (i !== -1) { n++; i = haystack.indexOf(needle, i + 1); }
    return n;
  }

  /* source: the deck file exactly as it is on disk.
   * patches: [{before, after, nth}] — `before` is the element's original
   *          innerHTML, `nth` disambiguates when that string repeats.
   * Returns the new file text. Throws rather than guessing. */
  function applyPatches(source, patches) {
    if (typeof source !== 'string') throw new TypeError('source must be a string');
    if (!patches || !patches.length) return source;

    /* Resolve every offset against the ORIGINAL text first. Resolving as we go
     * would use offsets from a string earlier patches had already resized. */
    var resolved = patches.map(function (p, idx) {
      var nth = p.nth || 0;
      var at = nthIndexOf(source, p.before, nth);
      if (at === -1) {
        var total = countOccurrences(source, p.before);
        if (total === 0) {
          throw new Error(
            'patch ' + idx + ': fragment not found in source — ' + preview(p.before));
        }
        throw new Error(
          'patch ' + idx + ': asked for occurrence ' + nth + ' but the source has ' +
          total + ' — ' + preview(p.before));
      }
      return { at: at, end: at + p.before.length, after: p.after, idx: idx };
    });

    /* Two patches covering the same bytes means the editor mis-identified an
     * element. Applying both would interleave two rewrites into one range. */
    var byPos = resolved.slice().sort(function (a, b) { return a.at - b.at; });
    for (var i = 1; i < byPos.length; i++) {
      if (byPos[i].at < byPos[i - 1].end) {
        throw new Error(
          'patches ' + byPos[i - 1].idx + ' and ' + byPos[i].idx + ' overlap in the source');
      }
    }

    /* Splice back-to-front so each write leaves earlier offsets valid. */
    var out = source;
    for (var j = byPos.length - 1; j >= 0; j--) {
      var r = byPos[j];
      out = out.slice(0, r.at) + r.after + out.slice(r.end);
    }
    return out;
  }

  /* ---------------------------------------------------------------------
   * locateDecoded — find, in the raw file text, the bytes that DECODE to a
   * given string.
   *
   * The DOM hands the editor "…" and "✓"; the file on disk says &ldquo; and
   * &#10003;. indexOf on the raw text misses every element written with an
   * entity — in the lecture deck that was 6 of 321, including real sentences.
   * Skipping them would mean an element you can type into that silently does
   * not save, which is worse than one you cannot type into.
   *
   * So: decode the source once, keeping a map from each decoded character back
   * to the offset it came from, search in decoded space, and return RAW
   * offsets. The caller slices the original bytes out of those offsets, which
   * keeps applyPatches operating on the file exactly as written.
   * ------------------------------------------------------------------- */

  var ENTITY = /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g;

  /* Named entities that actually turn up in decks. Everything numeric is
   * handled arithmetically, so this list only has to cover the names. */
  var NAMED = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
    ldquo: '\u201c', rdquo: '\u201d', lsquo: '\u2018', rsquo: '\u2019',
    hellip: '\u2026', mdash: '\u2014', ndash: '\u2013', middot: '\u00b7',
    times: '\u00d7', rarr: '\u2192', larr: '\u2190', harr: '\u2194',
    check: '\u2713', copy: '\u00a9', reg: '\u00ae', deg: '\u00b0',
  };

  function decodeEntity(whole, body) {
    if (body.charAt(0) === '#') {
      var code = body.charAt(1) === 'x' || body.charAt(1) === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      if (isNaN(code)) return null;
      try { return String.fromCodePoint(code); } catch (e) { return null; }
    }
    return Object.prototype.hasOwnProperty.call(NAMED, body) ? NAMED[body] : null;
  }

  /* Build the decoded text plus decodedIndex -> rawIndex, and the raw length
   * each decoded character consumed (1 for a literal, 7 for &ldquo;). */
  function decodeWithMap(source) {
    var decoded = '', map = [], widths = [];
    var last = 0, m;
    ENTITY.lastIndex = 0;
    while ((m = ENTITY.exec(source)) !== null) {
      for (var i = last; i < m.index; i++) { decoded += source[i]; map.push(i); widths.push(1); }
      var ch = decodeEntity(m[0], m[1]);
      if (ch === null) {
        // not an entity we know: keep the raw characters as themselves
        for (var j = m.index; j < m.index + m[0].length; j++) {
          decoded += source[j]; map.push(j); widths.push(1);
        }
      } else {
        // a decoded char may be a surrogate pair; every unit maps to the entity
        for (var k = 0; k < ch.length; k++) {
          decoded += ch[k];
          map.push(m.index);
          widths.push(k === ch.length - 1 ? m[0].length : 0);
        }
      }
      last = m.index + m[0].length;
    }
    for (var t = last; t < source.length; t++) { decoded += source[t]; map.push(t); widths.push(1); }
    return { decoded: decoded, map: map, widths: widths };
  }

  var _cache = null;
  function decodedFor(source) {
    if (!_cache || _cache.source !== source) {
      _cache = decodeWithMap(source);
      _cache.source = source;
    }
    return _cache;
  }

  /* Returns {start, end} as offsets into `source`, or null. */
  function locateDecoded(source, needle, nth) {
    if (!needle) return null;
    var d = decodedFor(source);
    var at = nthIndexOf(d.decoded, needle, nth || 0);
    if (at === -1) return null;
    var lastUnit = at + needle.length - 1;
    var start = d.map[at];
    var end = d.map[lastUnit] + d.widths[lastUnit];
    return { start: start, end: end };
  }

  function preview(s) {
    s = String(s).replace(/\s+/g, ' ').trim();
    return s.length > 60 ? '"' + s.slice(0, 60) + '…"' : '"' + s + '"';
  }

  return {
    applyPatches: applyPatches,
    locateDecoded: locateDecoded,
    nthIndexOf: nthIndexOf,
    countOccurrences: countOccurrences,
  };
});
