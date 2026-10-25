// The moon sticker in the corner: click it and the whole page shoos away,
// leaving a sticker watermark and a clear "bring it back" card. Click again,
// press Esc or use the button and everything comes back where it was.
(() => {
  const box = document.querySelector('[data-moon]');
  if (!box) return;
  const data = JSON.parse(document.getElementById('moon-data').textContent);
  const btn = box.querySelector('.moon-btn');
  const bubble = box.querySelector('.moon-bubble');
  const gone = document.querySelector('.moon-gone');
  const back = gone.querySelector('.moon-back');
  const parts = [...document.querySelectorAll('body > header, body > main > section, body > footer')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shooed = false, bubbleTimer, used = false;
  try { used = localStorage.getItem('shoo-moon-used') === '1'; } catch (_) {}
  if (!used) box.classList.add('fresh');

  // Watermark: our stickers scattered in a soft repeating pattern
  const mark = gone.querySelector('.moon-watermark');
  const cols = 6, rows = 5;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const img = document.createElement('img');
    img.src = data.stickers[(r * 2 + c) % data.stickers.length];
    img.alt = '';
    const jitter = ((r * 7 + c * 13) % 9) - 4;
    img.style.cssText = `left:${(c + (r % 2) * 0.5) * (100 / cols) - 4}%;top:${r * (100 / rows) + 2}%;transform:rotate(${jitter * 4}deg)`;
    mark.append(img);
  }

  function set(next) {
    shooed = next;
    document.documentElement.classList.toggle('moon-shooed', shooed);
    btn.setAttribute('aria-pressed', shooed);
    btn.setAttribute('aria-label', shooed ? data.bring : data.shoo);
    parts.forEach((el, i) => {
      el.style.transitionDelay = (shooed ? i * 60 : (parts.length - i) * 40) + 'ms';
      el.classList.toggle('moon-away', shooed);
      if (shooed) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    clearTimeout(bubbleTimer);
    bubble.classList.toggle('show', shooed);
    if (shooed) bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 2000);
    if (shooed) {
      gone.hidden = false;
      requestAnimationFrame(() => gone.classList.add('show'));
      box.classList.remove('fresh');
      try { localStorage.setItem('shoo-moon-used', '1'); } catch (_) {}
    } else {
      gone.classList.remove('show');
      setTimeout(() => { if (!shooed) gone.hidden = true; }, reduce ? 0 : 400);
    }
  }

  btn.addEventListener('click', () => set(!shooed));
  back.addEventListener('click', () => set(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && shooed) set(false); });
})();
