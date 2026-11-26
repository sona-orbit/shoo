// Window marks demo: one window looked after by the little devil; the buttons
// switch between the four mark styles the app draws (tape, mini sticker, stitches, glow).
(() => {
  const root = document.querySelector('[data-marks]');
  if (!root) return;
  const captions = JSON.parse(document.getElementById('marks-data').textContent);
  const caption = root.querySelector('.demo-caption');
  const buttons = [...root.querySelectorAll('.demo-tabs button')];
  buttons.forEach(b => b.addEventListener('click', () => {
    root.dataset.style = b.dataset.style;
    buttons.forEach(x => x.setAttribute('aria-pressed', x === b));
    caption.textContent = captions[b.dataset.style];
  }));
})();
