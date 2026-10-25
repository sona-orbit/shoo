// Language: the root (English) follows the browser language once; a saved choice wins.
// A direct language URL stays where it is. The menu switches and remembers.
(() => {
  const supported = ['en', 'zh-Hant', 'zh-Hans', 'ja', 'ko', 'th'];
  const current = window.SHOO_LOCALE;
  const page = window.SHOO_PAGE || 'index.html';
  const root = current === 'en' ? '' : '../';
  const urlFor = (lang) => root + (lang === 'en' ? '' : lang + '/') + page;
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
