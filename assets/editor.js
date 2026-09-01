/* html-ppt :: editor.js — edit a deck's text in the browser, save to the file.
 *
 * Injected by scripts/edit-server.py when the URL carries ?edit=1. No deck on
 * disk references this file, so a deck opened any other way is untouched.
 *
 *   E        toggle edit mode
 *   ⌘S       save          (Save button, top right)
 *   Esc      leave edit mode
 *   +        add an item to a list, grid or table
 *   ×        remove one
 *   paste    an image from the clipboard lands in the slot under the caret
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * Font sizes and free placement are not editable. If a heading is the wrong
 * size that is a layout decision, not a per-slide one; changing it here would
 * desync that slide from the other 23 and hollow out the token system. Images
 * land in a layout slot and are sized by the layout — no drag handles.
 *
 * HOW SAVING WORKS
 * It does not serialise the live DOM. By save time runtime.js has stamped
 * .is-active, built hidden overview clones and let Chart.js paint canvases.
 * Instead the editor keeps the file's original text, records {before, after}
 * for each element it touched, and splices those into that text
 * (editor-patch.js). Untouched bytes stay untouched, so a typo fix is a
 * one-line diff.
 */
(function () {
  'use strict';

  var ENDPOINT = '/__edit';

  /* UI language, keyed on the deck's <html lang> exactly as runtime.js keys
   * the presenter window (PRESENTER_I18N). Korean is the default; English is
   * opt-in with lang="en". */
  var I18N = {
    ko: {
      save: '저장', close: '나가기',
      ready: function (n) { return n + '곳 편집 가능'; },
      saving: '저장 중…', uploading: '이미지 저장 중…',
      saved: function (n) { return n + '곳 저장됨'; },
      nochange: '바뀐 내용이 없습니다',
      added: function (src) { return '이미지 추가됨 · ' + src; },
      imgFail: function (m) { return '이미지 실패: ' + m; },
      cantSave: function (m) { return '저장 불가: ' + m; },
      saveFail: function (m) { return '저장 실패: ' + m; },
      unsaveable: '이 요소는 저장할 수 없어 편집이 반영되지 않습니다',
      changedOnDisk: '파일이 편집 중에 바뀌었습니다 · 새로고침 후 다시 시도하세요',
      wrongFolder: function (n) { return n + ' 이(가) 없는 폴더입니다 · 덱이 들어 있는 폴더를 고르세요'; },
      pick: '폴더 선택', opening: '폴더 여는 중…',
      pickPrompt: '저장하려면 덱이 있는 폴더 접근을 허용해 주세요 →',
      noMode: function (m) {
        return '편집 모드를 켤 수 없습니다: ' + m +
               '\n\nscripts/edit.sh 로 연 덱에서만 편집할 수 있습니다.';
      },
    },
    en: {
      save: 'Save', close: 'Close',
      ready: function (n) { return n + ' editable'; },
      saving: 'saving…', uploading: 'uploading image…',
      saved: function (n) { return 'saved ' + n + ' edit' + (n === 1 ? '' : 's'); },
      nochange: 'nothing changed',
      added: function (src) { return 'image added · ' + src; },
      imgFail: function (m) { return 'image failed: ' + m; },
      cantSave: function (m) { return 'cannot save: ' + m; },
      saveFail: function (m) { return 'save failed: ' + m; },
      unsaveable: 'this element cannot be saved, so the edit will not stick',
      changedOnDisk: 'the file changed while you were editing · reload and try again',
      wrongFolder: function (n) { return 'that folder has no ' + n + ' · pick the folder the deck is in'; },
      pick: 'Choose folder', opening: 'opening folder…',
      pickPrompt: 'grant access to the deck\u2019s folder to save \u2192',
      noMode: function (m) {
        return 'Cannot start edit mode: ' + m +
               '\n\nEditing only works on a deck opened with scripts/edit.sh.';
      },
    },
  };
  var T = /^en/i.test(document.documentElement.lang || '') ? I18N.en : I18N.ko;
  var deckPath = location.pathname.replace(/^\/+/, '');
  var deckName = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');

  /* ----------------------------------------------------------- backends
   * Two ways to reach the file, picked by how the deck was opened.
   *
   *   http(s)  — served by scripts/edit.sh, which has /save and /image.
   *   file://  — no server, so the File System Access API. Chrome allows it
   *              from file:// (file: is a secure context there) as long as the
   *              picker opens from a user gesture; pressing E is one. fetch()
   *              of a sibling file IS blocked at file://, which is why the
   *              source is read through the handle rather than fetched.
   *
   * Both expose the same three calls, so nothing below here knows which is in
   * play — including the patch logic, which never changes between them. */

  var EXT = {
    'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif',
    'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/avif': '.avif',
  };

  function ServerBackend() { this.stamp = null; }
  ServerBackend.prototype.load = function () {
    var self = this;
    return fetch(ENDPOINT + '/source?path=' + encodeURIComponent(deckPath))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.error) throw new Error(j.error);
        self.stamp = j.mtime;
        return j.text;
      });
  };
  ServerBackend.prototype.save = function (text) {
    var self = this;
    return fetch(ENDPOINT + '/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: deckPath, mtime: this.stamp, text: text }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.error) throw new Error(j.error);
      self.stamp = j.mtime;
    });
  };
  ServerBackend.prototype.saveImage = function (file) {
    return fetch(ENDPOINT + '/image?path=' + encodeURIComponent(deckPath), {
      method: 'POST', headers: { 'Content-Type': file.type }, body: file,
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.error) throw new Error(j.error);
      return j.src;
    });
  };

  function FileBackend() { this.dir = null; this.file = null; }
  /* True until the folder has been granted. enter() uses this to put a button
   * in front of the picker instead of calling it from a stale gesture: E has
   * to travel through two dynamic script loads to get here, and Chrome's
   * transient activation may well have lapsed by then. A click cannot lapse. */
  FileBackend.prototype.needsPick = function () { return !this.dir; };
  /* Asked once per page load; the handle is kept so toggling E off and on
   * does not reopen the picker. */
  FileBackend.prototype.pick = function () {
    var self = this;
    if (this.dir) return Promise.resolve();
    return window.showDirectoryPicker({ mode: 'readwrite' }).then(function (dir) {
      return dir.getFileHandle(deckName).then(function (fh) {
        self.dir = dir; self.file = fh;
      }, function () { throw new Error(T.wrongFolder(deckName)); });
    });
  };
  FileBackend.prototype.load = function () {
    var self = this;
    return this.pick()
      .then(function () { return self.file.getFile(); })
      .then(function (f) { return f.text(); });
  };
  FileBackend.prototype.save = function (text) {
    var self = this;
    // the server's mtime check has no equivalent here, so compare the bytes
    return this.file.getFile().then(function (f) { return f.text(); })
      .then(function (onDisk) {
        if (onDisk !== state.source) throw new Error(T.changedOnDisk);
        return self.file.createWritable();
      })
      .then(function (w) { return w.write(text).then(function () { return w.close(); }); });
  };
  FileBackend.prototype.saveImage = function (file) {
    var self = this, ext = EXT[file.type];
    if (!ext) return Promise.reject(new Error('unsupported image type: ' + file.type));
    return this.dir.getDirectoryHandle('img', { create: true }).then(function (imgDir) {
      return nextFreeName(imgDir, ext).then(function (name) {
        return imgDir.getFileHandle(name, { create: true })
          .then(function (fh) { return fh.createWritable(); })
          .then(function (w) { return w.write(file).then(function () { return w.close(); }); })
          .then(function () { return 'img/' + name; });
      });
    });
  };

  /* paste-001.png, paste-002.png … the same names the server picks, so a deck
   * edited both ways does not end up with two numbering schemes. */
  function nextFreeName(dir, ext, n) {
    n = n || 1;
    var name = 'paste-' + String(n).padStart(3, '0') + ext;
    return dir.getFileHandle(name).then(
      function () { return nextFreeName(dir, ext, n + 1); },
      function () { return name; });
  }

  var backend = location.protocol === 'file:' ? new FileBackend() : new ServerBackend();

  var state = {
    on: false,
    source: null,      // the deck file exactly as it is on disk
    dirty: new Set(),  // patch roots the user has touched
    origin: new Map(), // element -> its innerHTML in the pristine file
    nth: new Map(),    // element -> which occurrence of that string it is
  };

  /* ------------------------------------------------------------ utilities */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function slides() {
    return Array.prototype.slice.call(document.querySelectorAll('.deck > .slide'));
  }

  /* Child-index chain from the slide root. Runtime-added nodes are appended,
   * so a path computed on the pristine tree still resolves on the live one. */
  function pathOf(node, root) {
    var out = [];
    while (node && node !== root) {
      out.unshift(Array.prototype.indexOf.call(node.parentNode.children, node));
      node = node.parentNode;
    }
    return out;
  }

  function resolvePath(root, path) {
    var n = root;
    for (var i = 0; i < path.length; i++) {
      if (!n || !n.children[path[i]]) return null;
      n = n.children[path[i]];
    }
    return n;
  }

  /* Elements that carry text of their own. An element whose text lives only in
   * child elements is a container, not something to type into — and if both
   * were editable the nested one would be unreachable. */
  var SKIP = 'aside.notes, script, style, canvas, svg, .slide-number, ' +
             '.deck-copyright, .progress-bar, .overview, .notes-overlay, [data-ed-btn]';

  function hasOwnText(node) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var c = node.childNodes[i];
      if (c.nodeType === 3 && c.nodeValue.trim()) return true;
    }
    return false;
  }

  function editableIn(slide) {
    var out = [];
    var all = slide.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var n = all[i];
      if (n.closest(SKIP)) continue;
      if (!hasOwnText(n)) continue;
      // an ancestor already claimed this text
      if (out.some(function (p) { return p.contains(n); })) continue;
      out.push(n);
    }
    return out;
  }

  /* Containers whose children are all the same shape — a bullet list, a card
   * grid, a table body. Those are the places "one more" is meaningful. */
  function contentChildren(node) {
    // the editor's own +/x buttons are chrome, not content: counting them
    // would make an already-decorated container look non-homogeneous on the
    // next index() pass, silently dropping it — and with it any item the user
    // adds after the first save
    return Array.prototype.filter.call(node.children, function (c) {
      return !c.hasAttribute('data-ed-btn');
    });
  }

  function isHomogeneous(node) {
    var kids = contentChildren(node);
    if (kids.length < 2) return false;
    var tag = kids[0].tagName, cls = kids[0].className;
    for (var i = 1; i < kids.length; i++) {
      if (kids[i].tagName !== tag || kids[i].className !== cls) return false;
    }
    return !node.closest(SKIP);
  }

  /* -------------------------------------------------------------- patching */

  /* Occurrences of `raw` that start before offset `at`. applyPatches counts in
   * raw bytes, so the nth we hand it has to be counted the same way. */
  function rawNthBefore(source, raw, at) {
    var n = 0, i = source.indexOf(raw);
    while (i !== -1 && i < at) { n++; i = source.indexOf(raw, i + 1); }
    return n;
  }

  /* Pair every live editable with the bytes it came from in the file.
   *
   * The DOM gives decoded text ("…", "✓"); the file may spell those &ldquo;
   * and &#10003;. locateDecoded bridges that, and we then store the RAW slice
   * so the eventual splice happens on the file exactly as written.
   *
   * An element that cannot be paired is left alone — decorate() only makes
   * indexed elements editable, so "you can type into it" and "it will save"
   * stay the same set. An editable box that silently discards your edit is a
   * worse bug than one you cannot click into. */
  function index(pristine) {
    var liveSlides = slides();
    var srcSlides = pristine.querySelectorAll('.deck > .slide');
    var seen = Object.create(null); // decoded innerHTML -> occurrences consumed

    for (var s = 0; s < liveSlides.length && s < srcSlides.length; s++) {
      var live = liveSlides[s], src = srcSlides[s];
      var cands = editableIn(live).concat(
        Array.prototype.filter.call(live.querySelectorAll('*'), isHomogeneous));
      for (var i = 0; i < cands.length; i++) {
        var node = cands[i];
        if (state.origin.has(node)) continue;
        var twin = resolvePath(src, pathOf(node, live));
        if (!twin) continue;
        var html = twin.innerHTML;
        if (!html) continue;
        var n = seen[html] || 0;
        var hit = window.EditorPatch.locateDecoded(state.source, html, n);
        if (!hit) continue;
        var raw = state.source.slice(hit.start, hit.end);
        state.origin.set(node, raw);
        state.nth.set(node, rawNthBefore(state.source, raw, hit.start));
        seen[html] = n + 1;
      }
    }
  }

  function patches() {
    var out = [];
    state.dirty.forEach(function (node) {
      var before = state.origin.get(node);
      if (before == null) return;
      var after = clean(node).innerHTML;
      if (after === before) return;
      out.push({ before: before, after: after, nth: state.nth.get(node) });
    });
    return out;
  }

  /* A copy with the editor's own attributes stripped — none of contenteditable,
   * the +/× buttons or the dirty marker belongs in the saved file. */
  function clean(node) {
    var c = node.cloneNode(true);
    var junk = c.querySelectorAll('[data-ed-btn]');
    for (var i = junk.length - 1; i >= 0; i--) junk[i].remove();
    var marked = c.querySelectorAll('[contenteditable],[data-ed-dirty]');
    for (var j = 0; j < marked.length; j++) {
      marked[j].removeAttribute('contenteditable');
      marked[j].removeAttribute('data-ed-dirty');
      marked[j].removeAttribute('spellcheck');
    }
    return c;
  }

  function markDirty(node) {
    // patch at the nearest indexed ancestor, so a structural change is saved
    // as one rewrite of the container rather than N unrelated text edits
    var n = node;
    while (n && !state.origin.has(n)) n = n.parentElement;
    if (n) {
      state.dirty.add(n);
      bar.classList.add('is-dirty');
      return true;
    }
    /* Nothing above this node is indexed, so the edit has nowhere to be
     * written. The gates in decorate() are supposed to make this unreachable;
     * if it happens anyway, say so rather than let the user keep typing into
     * something that will be thrown away. */
    say(T.unsaveable, 'bad');
    return false;
  }

  /* ------------------------------------------------------------------ chrome */

  var bar, status;

  function buildBar(askForFolder) {
    if (bar) bar.remove();
    bar = el('div', 'ed-bar');
    status = el('span', 'ed-status', '');
    bar.appendChild(status);
    if (askForFolder) {
      var pick = el('button', 'ed-save', T.pick);
      // THIS click is the user gesture showDirectoryPicker needs
      pick.onclick = function () {
        say(T.opening);
        backend.pick().then(function () { buildBar(false); open_(); },
          function (err) { say(err.message || String(err), 'bad'); });
      };
      bar.appendChild(pick);
    } else {
      var save = el('button', 'ed-save', T.save);
      save.onclick = save_;
      bar.appendChild(save);
    }
    var close = el('button', 'ed-close', T.close);
    close.onclick = function () { toggle(false); };
    bar.appendChild(close);
    document.body.appendChild(bar);
    state.on = true;
  }

  function say(msg, kind) {
    status.textContent = msg || '';
    status.className = 'ed-status' + (kind ? ' is-' + kind : '');
  }

  /* --------------------------------------------------------------- editing */

  function decorate() {
    slides().forEach(function (slide) {
      editableIn(slide).forEach(function (n) {
        // only what we can save — see index()
        if (!state.origin.has(n)) return;
        n.setAttribute('contenteditable', 'true');
        n.setAttribute('spellcheck', 'false');
      });
      Array.prototype.forEach.call(slide.querySelectorAll('*'), function (n) {
        if (!isHomogeneous(n) || n.querySelector('[data-ed-btn="add"]')) return;
        // same gate as the text above: a container we could not pair back to
        // the file cannot be saved, so it must not offer a + to click
        if (!state.origin.has(n)) return;
        var add = el('button', 'ed-add', '＋');
        add.setAttribute('data-ed-btn', 'add');
        add.contentEditable = 'false';
        add.onclick = function (e) { e.preventDefault(); addItem(n); };
        n.appendChild(add);
        Array.prototype.forEach.call(n.children, function (kid) {
          if (kid.hasAttribute('data-ed-btn')) return;
          addRemove(kid);
        });
      });
    });
  }

  function addRemove(kid) {
    if (kid.querySelector(':scope > [data-ed-btn="del"]')) return;
    var del = el('button', 'ed-del', '×');
    del.setAttribute('data-ed-btn', 'del');
    del.contentEditable = 'false';
    del.onclick = function (e) {
      e.preventDefault();
      var parent = kid.parentElement;
      kid.remove();
      markDirty(parent);
    };
    kid.appendChild(del);
  }

  /* Clone the last item and blank its text. Cloning rather than building an
   * empty <li> means the new item keeps whatever classes the layout needs —
   * the user never has to know what those are. */
  function addItem(container) {
    var kids = contentChildren(container);
    if (!kids.length) return;
    var copy = kids[kids.length - 1].cloneNode(true);
    Array.prototype.forEach.call(copy.querySelectorAll('[data-ed-btn]'), function (b) { b.remove(); });
    blank(copy);
    container.insertBefore(copy, container.querySelector('[data-ed-btn="add"]'));
    copy.querySelectorAll('[contenteditable="true"]').forEach(function (n) {
      n.setAttribute('contenteditable', 'true');
    });
    if (copy.getAttribute('contenteditable') !== 'true' && hasOwnText(copy)) {
      copy.setAttribute('contenteditable', 'true');
    }
    addRemove(copy);
    markDirty(container);
    var first = copy.getAttribute('contenteditable') === 'true'
      ? copy : copy.querySelector('[contenteditable="true"]');
    if (first) { first.focus(); }
  }

  function blank(node) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var c = node.childNodes[i];
      if (c.nodeType === 3 && c.nodeValue.trim()) c.nodeValue = '';
      else if (c.nodeType === 1) blank(c);
    }
  }

  /* ---------------------------------------------------------- image paste */

  function onPaste(e) {
    if (!state.on) return;
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind !== 'file' || items[i].type.indexOf('image/') !== 0) continue;
      e.preventDefault();
      upload(items[i].getAsFile(), e.target);
      return;
    }
  }

  function upload(file, target) {
    say(T.uploading);
    backend.saveImage(file).then(function (src) {
      var img = el('img');
      img.src = src;
      img.alt = '';
      // inline, not a class: the saved deck must not depend on editor CSS
      img.setAttribute('style', 'max-width:100%;height:auto;display:block;margin:10px 0');
      var host = target.closest('[contenteditable]') || target;
      host.appendChild(img);
      markDirty(host);
      say(T.added(src), 'ok');
    }).catch(function (err) { say(T.imgFail(err.message), 'bad'); });
  }

  /* ------------------------------------------------------------------ save */

  function save_() {
    var list;
    try { list = patches(); }
    catch (err) { return say(T.cantSave(err.message), 'bad'); }
    if (!list.length) return say(T.nochange);

    var text;
    try { text = window.EditorPatch.applyPatches(state.source, list); }
    catch (err) { return say(T.cantSave(err.message), 'bad'); }

    say(T.saving);
    backend.save(text).then(function () {
      state.source = text;
      state.dirty.clear();
      state.origin.clear();
      state.nth.clear();
      index(new DOMParser().parseFromString(text, 'text/html'));
      decorate();
      bar.classList.remove('is-dirty');
      say(T.saved(list.length), 'ok');
    }).catch(function (err) { say(T.saveFail(err.message), 'bad'); });
  }

  /* ---------------------------------------------------------------- toggle */

  function toggle(on) {
    if (on === state.on) return;
    if (on) return enter();
    document.body.classList.remove('ed-on');
    document.querySelectorAll('[contenteditable="true"]').forEach(function (n) {
      n.removeAttribute('contenteditable'); n.removeAttribute('spellcheck');
    });
    document.querySelectorAll('[data-ed-btn]').forEach(function (n) { n.remove(); });
    if (bar) bar.remove();
    bar = null;
    state.on = false;
  }

  function enter() {
    /* file:// with no folder yet — ask for it behind an explicit click. */
    if (backend.needsPick && backend.needsPick()) {
      buildBar(true);
      say(T.pickPrompt);
      return;
    }
    open_();
  }

  function open_() {
    backend.load()
      .then(function (text) {
        state.source = text;
        state.origin.clear(); state.nth.clear(); state.dirty.clear();
        index(new DOMParser().parseFromString(text, 'text/html'));
        document.body.classList.add('ed-on');
        if (!bar) buildBar(false);
        decorate();
        state.on = true;
        say(T.ready(state.origin.size));
      })
      .catch(function (err) {
        alert(T.noMode(err.message));
      });
  }

  /* ------------------------------------------------------------------ wire */

  document.addEventListener('input', function (e) {
    if (state.on && e.target.isContentEditable) markDirty(e.target);
  });

  /* Closing the tab on unsaved edits would throw away exactly the work this
   * feature exists to make cheap. The browser shows its own generic prompt;
   * returnValue is what makes it appear at all. */
  window.addEventListener('beforeunload', function (e) {
    if (!state.on || !state.dirty.size) return;
    e.preventDefault();
    e.returnValue = '';
  });
  document.addEventListener('paste', onPaste, true);

  document.addEventListener('keydown', function (e) {
    var typing = e.target.isContentEditable ||
                 /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      if (state.on) { e.preventDefault(); save_(); }
      return;
    }
    if (typing) {
      // runtime.js turns arrow keys into page changes; while typing they are
      // just cursor movement, so keep them away from it
      e.stopPropagation();
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    if (e.key === 'e' || e.key === 'E') { e.preventDefault(); toggle(!state.on); }
    else if (e.key === 'Escape' && state.on) toggle(false);
  }, true);

  var css = document.createElement('style');
  css.textContent = [
    '.ed-bar{position:fixed;top:14px;right:16px;z-index:99999;display:flex;align-items:center;gap:10px;',
    '  padding:8px 10px 8px 16px;border-radius:12px;background:rgba(18,20,26,.94);color:#e6edf3;',
    '  box-shadow:0 8px 28px rgba(0,0,0,.35);font:14px/1.4 Pretendard,-apple-system,sans-serif}',
    '.ed-bar.is-dirty{outline:2px solid #f0883e}',
    '.ed-status{font-size:12px;color:#9aa4b2;min-width:9em;text-align:right}',
    '.ed-status.is-ok{color:#3fb950}.ed-status.is-bad{color:#f85149}',
    '.ed-bar button{font:600 13px/1 inherit;padding:9px 14px;border-radius:8px;border:0;cursor:pointer}',
    '.ed-save{background:#2f81f7;color:#fff}.ed-close{background:rgba(255,255,255,.12);color:#e6edf3}',
    'body.ed-on [contenteditable]{outline:1px dashed rgba(47,129,247,.45);outline-offset:3px;border-radius:3px}',
    'body.ed-on [contenteditable]:focus{outline:2px solid #2f81f7;background:rgba(47,129,247,.06)}',
    '.ed-add{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;',
    '  margin:6px;border-radius:50%;border:1px dashed rgba(47,129,247,.6);background:transparent;',
    '  color:#2f81f7;cursor:pointer;font-size:14px;line-height:1;vertical-align:middle}',
    '.ed-add:hover{background:rgba(47,129,247,.12)}',
    /* inline, not absolutely positioned: giving arbitrary layout children a
       position:relative to anchor against would break the several layouts that
       already position their own descendants. opacity keeps the slot reserved,
       so nothing shifts when it appears. */
    '.ed-del{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;',
    '  margin-left:6px;border-radius:50%;border:0;background:#f85149;color:#fff;cursor:pointer;',
    '  font-size:11px;line-height:1;vertical-align:middle;opacity:0;transition:opacity .12s}',
    'body.ed-on *:hover > .ed-del{opacity:1}',
  ].join('\n');
  document.head.appendChild(css);

  /* runtime.js loads this file on demand and then calls toggle(true). Exposing
   * the handle is also how runtime.js knows to stop handling keys itself. */
  window.__htmlPptEditor = { toggle: toggle, isOn: function () { return state.on; } };

  /* ?edit=1 opens straight into edit mode; otherwise E does. */
  if (/(^|&)edit=1(&|$)/.test(location.search.slice(1))) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(enter, 60); });
    } else setTimeout(enter, 60);
  }
})();
