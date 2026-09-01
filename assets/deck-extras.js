/* html-ppt :: deck-extras.js — interactive slide components.
 *
 * Deliberately separate from runtime.js: nothing here reads or writes slide
 * state, so it stays small enough to hold in one screen. Load it after
 * runtime.js; order does not actually matter, since both only touch the DOM.
 *
 *   .deck[data-copyright="…"]   stamps the notice onto every slide
 *   .copy-btn inside .prompt-card   copies .prompt-body to the clipboard
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* Stamp the deck's copyright notice onto every slide.
   * Written once per slide rather than per-slide markup: a notice you have to
   * remember to paste is a notice that goes missing on slide 27.
   * NOT part of .deck-footer — base.css hides that when printing, and the
   * notice has to survive into the handout. */
  function stampCopyright(deck) {
    var text = deck.getAttribute('data-copyright');
    if (!text) return;
    Array.prototype.forEach.call(deck.querySelectorAll('.slide'), function (slide) {
      if (slide.querySelector('.deck-copyright')) return;
      var el = document.createElement('div');
      el.className = 'deck-copyright';
      el.textContent = text;
      slide.appendChild(el);
    });
  }

  /* Clipboard write with a fallback. navigator.clipboard needs a secure
     context; file:// counts as one in Chrome, so the deck works when opened
     straight off disk. The textarea path covers the browsers where it does not. */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) resolve(); else reject(new Error('copy failed'));
    });
  }

  /* Wire every .copy-btn to the .prompt-body in its own .prompt-card, so a
     slide can carry several prompts. Labels come from markup: the default is
     English, and a deck overrides it with data-copied. */
  function bindCopyButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.copy-btn'), function (btn) {
      var idle = btn.textContent.trim();
      var done = btn.getAttribute('data-copied') || 'Copied';
      var failed = btn.getAttribute('data-copy-failed') || 'Copy failed';
      var timer = null;

      btn.addEventListener('click', function () {
        var card = btn.closest('.prompt-card');
        var body = card && card.querySelector('.prompt-body');
        if (!body) return;

        function settle(label, ok) {
          btn.textContent = label;
          btn.classList.toggle('is-copied', ok);
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.textContent = idle;
            btn.classList.remove('is-copied');
          }, 1500);
        }

        copyText(body.textContent.trim()).then(
          function () { settle(done, true); },
          function () { settle(failed, false); }
        );
      });
    });
  }

  ready(function () {
    var deck = document.querySelector('.deck');
    if (!deck) return;
    stampCopyright(deck);
    bindCopyButtons(deck);
  });
})();
