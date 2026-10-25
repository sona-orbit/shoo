// Language: the root (English) follows the browser language once; a saved choice wins.
// A direct language URL stays where it is. The menu switches and remembers.
(() => {
  const supported = ['en', 'zh-Hant', 'zh-Hans', 'ja', 'ko', 'th'];
  const current = window.SHOO_LOCALE;
  // Folder-style URLs (no .html): page is '', 'privacy/' or 'support/'; root climbs back to the site root
  const page = window.SHOO_PAGE || '';
  const root = window.SHOO_ROOT || '';
  const urlFor = (lang) => (root + (lang === 'en' ? '' : lang + '/') + page) || './';
  let saved, stay;
  try { saved = localStorage.getItem('shoo-language'); stay = sessionStorage.getItem('shoo-stay'); } catch (_) {}

  if (current === 'en' && !stay) {
    const browser = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
    const guess =
      /^zh-(tw|hk|mo|hant)/.test(browser) ? 'zh-Hant' :
      /^zh(?:-|$)/.test(browser) ? 'zh-Hans' :
      /^ja/.test(browser) ? 'ja' : /^ko/.test(browser) ? 'ko' : /^th/.test(browser) ? 'th' : 'en';
    const preferred = supported.includes(saved) ? saved : guess;
    if (preferred !== 'en') { location.replace(urlFor(preferred) + location.hash); return; }
  }

  const selector = document.getElementById('language');
  if (selector) selector.addEventListener('change', () => {
    const next = selector.value;
    if (!supported.includes(next)) return;
    try { localStorage.setItem('shoo-language', next); } catch (_) {}
    // Picking English on purpose: don't bounce back to the browser language.
    if (next === 'en') { try { sessionStorage.setItem('shoo-stay', '1'); } catch (_) {} }
    if (next !== current) location.href = urlFor(next);
  });
})();

// Home page sticker board: every sticker can be picked up and dropped anywhere on the page.
// The offset lives in the CSS `translate` property, so each sticker keeps its own tilt
// (and the little devil keeps bobbing). The "Shoo!" bubble travels with the devil.
(() => {
  const board = document.querySelector('.sticker-board');
  if (!board) return;
  const bubble = board.querySelector('.bubble');
  let zTop = 5;
  board.querySelectorAll('img').forEach(img => {
    img.draggable = false;
    let sx, sy, ox = 0, oy = 0, on = false;
    const apply = (x, y) => {
      img.style.translate = `${x}px ${y}px`;
      if (img.classList.contains('s-devil') && bubble) bubble.style.translate = `${x}px ${y}px`;
    };
    img.addEventListener('pointerdown', e => {
      on = true; sx = e.clientX - ox; sy = e.clientY - oy;
      img.setPointerCapture(e.pointerId);
      img.style.zIndex = ++zTop;
      if (img.classList.contains('s-devil') && bubble) bubble.style.zIndex = zTop + 1;
      img.classList.add('dragging');
    });
    img.addEventListener('pointermove', e => { if (on) { ox = e.clientX - sx; oy = e.clientY - sy; apply(ox, oy); } });
    const end = () => { on = false; img.classList.remove('dragging'); };
    img.addEventListener('pointerup', end);
    img.addEventListener('pointercancel', end);
  });
})();
