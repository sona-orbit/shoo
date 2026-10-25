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

// Home page sticker board, like the app: every sticker looks after part of the page.
// Click a sticker: its part shoos away (header, headline, demo…); click again: it's back.
// Drag a sticker: it moves anywhere on the page (offset in CSS `translate`, so each keeps
// its tilt and the devil keeps bobbing; the "Shoo!" bubble travels with the devil).
(() => {
  const board = document.querySelector('.sticker-board');
  const dataEl = document.getElementById('board-data');
  if (!board || !dataEl) return;
  const text = JSON.parse(dataEl.textContent);
  const bubble = board.querySelector('.bubble');
  const tip = board.querySelector('.board-tip');
  const targets = {
    devil: '.hero-text',
    mug: '.site-header .nav-links, .site-header label',
    tv: '#demo',
    moon: '.site-header',
    cactus: 'main > section:not(.hero), body > footer',
  };
  let zTop = 5;

  function showTip(img) {
    const k = img.dataset.k;
    const sep = /^(zh|ja)/.test(document.documentElement.lang) ? '：' : ': ';
    tip.textContent = `${img.classList.contains('on') ? text.show : text.hide}${sep}${text[k]}`;
    const b = board.getBoundingClientRect(), r = img.getBoundingClientRect();
    tip.style.left = r.left - b.left + r.width / 2 + 'px';
    tip.style.top = r.top - b.top - 8 + 'px';
    tip.classList.add('show');
  }

  function pop(img) {
    const b = board.getBoundingClientRect(), r = img.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'board-pop';
    el.textContent = 'Shoo!';
    Object.assign(el.style, { left: r.left - b.left + r.width * 0.15 + 'px', top: r.top - b.top - 6 + 'px', zIndex: zTop + 2 });
    board.append(el);
    setTimeout(() => el.remove(), 2000);
  }

  function toggle(img) {
    const on = !img.classList.contains('on');
    img.classList.toggle('on', on);
    document.querySelectorAll(targets[img.dataset.k]).forEach(el => {
      // Whole sections also give back their space once they're gone, so the page doesn't scroll into emptiness
      const collapse = el.matches('main > section, body > footer');
      clearTimeout(el._shooTimer);
      if (on) {
        el.setAttribute('inert', '');
        el.classList.add('board-away');
        if (collapse) el._shooTimer = setTimeout(() => { el.hidden = true; }, 380);
      } else {
        // still looked after by another sticker that's on? then it stays away
        if ([...board.querySelectorAll('img.on')].some(o => el.matches(targets[o.dataset.k]))) return;
        el.removeAttribute('inert');
        el.hidden = false;
        void el.offsetWidth;   // let it lay out again before fading back in
        el.classList.remove('board-away');
      }
    });
    if (on) pop(img);
    showTip(img);
  }

  board.querySelectorAll('img').forEach(img => {
    img.dataset.k = [...img.classList].find(c => c.startsWith('s-')).slice(2);
    img.draggable = false;
    let sx, sy, ox = 0, oy = 0, on = false, moved = false;
    const apply = (x, y) => {
      img.style.translate = `${x}px ${y}px`;
      if (img.dataset.k === 'devil' && bubble) bubble.style.translate = `${x}px ${y}px`;
    };
    img.addEventListener('pointerdown', e => {
      on = true; moved = false; sx = e.clientX - ox; sy = e.clientY - oy;
      img.setPointerCapture(e.pointerId);
      img.style.zIndex = ++zTop;
      if (img.dataset.k === 'devil' && bubble) bubble.style.zIndex = zTop + 1;
    });
    img.addEventListener('pointermove', e => {
      if (!on) return;
      const nx = e.clientX - sx, ny = e.clientY - sy;
      if (!moved && Math.abs(nx - ox) + Math.abs(ny - oy) < 6) return;
      moved = true;
      img.classList.add('dragging');
      tip.classList.remove('show');
      ox = nx; oy = ny; apply(ox, oy);
    });
    img.addEventListener('pointerup', () => {
      if (!on) return;
      on = false;
      img.classList.remove('dragging');
      if (!moved) toggle(img);
    });
    img.addEventListener('pointercancel', () => { on = false; img.classList.remove('dragging'); });
    img.addEventListener('pointerenter', () => showTip(img));
    img.addEventListener('pointerleave', () => tip.classList.remove('show'));
  });
})();
