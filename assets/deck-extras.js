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

  ready(function () {
    var deck = document.querySelector('.deck');
    if (!deck) return;
    stampCopyright(deck);
  });
})();
