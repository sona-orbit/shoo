// Interactive desktop demo: a messy fake Mac desktop; click the sticker and the
// windows of the chosen scene shoo away; click again and they come back.
(() => {
  const root = document.querySelector('[data-demo]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('demo-data').textContent);
  const screen = root.querySelector('.demo-screen');
  const tabs = root.querySelector('.demo-tabs');
  const caption = root.querySelector('.demo-caption');
  const sticker = root.querySelector('.demo-sticker');
  const bubble = root.querySelector('.demo-bubble');
  const hint = root.querySelector('.demo-hint');
  // Like the app: "Shoo!" pops for 2 seconds, then disappears without a trace
  let bubbleTimer;

  // Desktop file icons along the right edge
  const icons = document.createElement('div');
  icons.className = 'demo-icons';
  data.icons.forEach(([kind, label]) => {
    const el = document.createElement('div');
    el.className = 'demo-icon';
    el.innerHTML = `<span class="glyph ${kind}"></span><span class="label"></span>`;
    el.querySelector('.label').textContent = label;
    icons.append(el);
  });
  screen.append(icons);

  // Windows
  const windows = {};
  data.windows.forEach(w => {
    const el = document.createElement('div');
    el.className = `demo-window kind-${w.kind}`;
    el.style.cssText = `left:${w.x}%;top:${w.y}%;width:${w.w}%;height:${w.h}%;z-index:${w.z}`;
    el.innerHTML = `<div class="bar"><i></i><i></i><i></i><span></span></div><div class="body"></div>`;
    el.querySelector('.bar span').textContent = w.title;
    const body = el.querySelector('.body');
    for (let i = 0; i < w.lines; i++) body.append(document.createElement('b'));
    screen.append(el);
    windows[w.id] = el;
  });

  let scene = 0;
  let shooed = false;

  function render() {
    const s = data.scenes[scene];
    [...tabs.children].forEach((b, i) => b.setAttribute('aria-pressed', i === scene));
    caption.textContent = shooed ? s.after : s.before;
    root.classList.toggle('is-shooed', shooed);
    Object.entries(windows).forEach(([id, el], i) => {
      const hide = shooed && s.hide.includes(id);
      el.style.transitionDelay = (hide ? i * 45 : (Object.keys(windows).length - i) * 30) + 'ms';
      el.classList.toggle('gone', hide);
    });
    icons.classList.toggle('gone', shooed && s.desktop);
    clearTimeout(bubbleTimer);
    bubble.classList.toggle('show', shooed);
    if (shooed) bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 2000);
    sticker.setAttribute('aria-pressed', shooed);
    sticker.setAttribute('aria-label', shooed ? data.labels.bringBack : data.labels.shoo);
  }

  data.scenes.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.name;
    b.addEventListener('click', () => { scene = i; shooed = false; render(); });
    tabs.append(b);
  });

  sticker.addEventListener('click', () => {
    shooed = !shooed;
    hint.classList.add('used');
    render();
  });

  render();
})();
