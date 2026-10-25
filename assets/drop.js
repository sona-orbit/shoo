// "Make it yours", in two hands-on steps like the app:
// 1. Drag a photo from the pile into the book: it flies to the empty slot, turns
//    into its cut-out sticker, and the book switches to the next screenshot taken
//    from the app (5 states, 0–4 photos).
// 2. Drag the finished sticker out of the book and put it anywhere; every finished
//    sticker can be picked up and moved again.
// A click / tap / Enter without dragging does the same step (phones, keyboards).
(() => {
  const root = document.querySelector('[data-drop]');
  if (!root) return;
  const data = JSON.parse(document.getElementById('drop-data').textContent);
  const book = root.querySelector('.drop-book');
  const [shown, next] = book.querySelectorAll('.drop-state');
  const pile = root.querySelector('.drop-pile');
  const hint = root.querySelector('.drop-hint');
  const reset = root.querySelector('.drop-reset');
  const photos = [...pile.querySelectorAll('.drop-photo')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Centres of the sticker slots in the screenshot (% of its width / height); slot 0 is the cactus
  const slots = [[10.4, 25.9], [23.7, 25.9], [37.0, 25.9], [10.4, 48.8], [23.7, 48.8]];
  // Where finished stickers land around the pile: x, y (px from its centre), rotation
  const spots = [[-135, -40, -8], [135, -50, 7], [-125, 75, 5], [130, 65, -6]];
  let count = 0, placed = 0, busy = false;

  // Warm up the next screenshots so the swap is instant
  data.states.slice(1).forEach(src => { const i = new Image(); i.src = src; });
  Object.values(data.stickers).forEach(src => { const i = new Image(); i.src = src; });

  const top = () => pile.querySelector('.drop-photo:last-child');
  const inside = (el, e) => { const r = el.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; };

  function updateHint() {
    const b = hint.querySelector('b'), tip = hint.querySelector('span');
    const waiting = book.querySelector('.drop-pending');
    hint.classList.toggle('done', placed >= data.order.length);
    b.textContent = placed >= data.order.length ? data.done : waiting ? data.out : data.hint;
    tip.hidden = placed >= data.order.length || !!waiting;
    reset.hidden = placed < data.order.length;
  }

  function showState(n) {
    next.src = data.states[n];
    const swap = () => {
      next.classList.add('show');
      setTimeout(() => { shown.src = data.states[n]; next.classList.remove('show'); }, reduce ? 0 : 380);
    };
    if (next.complete && next.naturalWidth) swap(); else next.onload = swap;
  }

  // Drag helper: pointer events for mouse, pen and touch; onDrop(moved, event, rect)
  function draggable(el, canStart, onMove, onDrop) {
    let sx, sy, moved = false, on = false;
    el.addEventListener('pointerdown', e => {
      if (busy || !canStart()) return;
      sx = e.clientX; sy = e.clientY; moved = false; on = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!on) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      el.style.translate = `${dx}px ${dy}px`;
      onMove(e);
    });
    el.addEventListener('pointerup', e => {
      if (!on) return;
      on = false;
      el.classList.remove('dragging');
      const r = el.getBoundingClientRect();   // where it was let go
      el.style.translate = '';
      onDrop(moved, e, r);
    });
    el.addEventListener('pointercancel', () => { on = false; el.classList.remove('dragging'); el.style.translate = ''; onMove(null); });
    el.addEventListener('click', e => { if (e.detail === 0 && !busy && canStart()) onDrop(false, null, el.getBoundingClientRect()); });   // Enter / Space
  }

  // Step 1: a photo goes into the book and becomes a sticker
  function intoBook(photo, start) {
    busy = true;
    const k = photo.dataset.k;
    const n = count;
    const b = book.getBoundingClientRect();
    const [sx, sy] = slots[n + 1];
    const size = b.width * 0.11;
    const to = { x: b.left + b.width * sx / 100 - size / 2, y: b.top + b.height * sy / 100 - size / 2 };
    photo.remove();
    const done = () => { count++; showState(count); addPending(k, n); busy = false; updateHint(); };
    if (reduce) { done(); return; }

    const fly = document.createElement('div');
    fly.className = 'drop-fly';
    fly.innerHTML = `<img class="raw" alt=""><img class="cut" alt="">`;
    fly.querySelector('.raw').src = photo.querySelector('img').src;
    fly.querySelector('.cut').src = data.stickers[k];
    Object.assign(fly.style, { left: start.left + 'px', top: start.top + 'px', width: start.width + 'px', height: start.width + 'px' });
    document.body.append(fly);
    const dx = to.x - start.left, dy = to.y - start.top, s = size / start.width;
    const move = fly.animate([
      { transform: 'translate(0,0) scale(1) rotate(-5deg)' },
      { transform: `translate(${dx}px,${dy}px) scale(${s * 1.4}) rotate(4deg)`, offset: 0.7 },
      { transform: `translate(${dx}px,${dy}px) scale(${s}) rotate(0)` },
    ], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    // Cut-out: the photo background fades away and the sticker pops in
    fly.querySelector('.raw').animate([{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 650, fill: 'forwards' });
    fly.querySelector('.cut').animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 650, fill: 'forwards' });
    move.onfinish = () => {
      sparkle(to.x + size / 2, to.y + size / 2);
      done();
      setTimeout(() => fly.remove(), 60);
    };
  }

  // The new sticker waits in its slot, ready to be dragged out
  function addPending(k, n) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'drop-pending';
    el.setAttribute('aria-label', data.sticker);
    el.innerHTML = `<img alt="" draggable="false">`;
    el.querySelector('img').src = data.stickers[k];
    const [sx, sy] = slots[n + 1];
    Object.assign(el.style, { left: sx + '%', top: sy + '%' });
    book.append(el);
    draggable(el, () => true, () => {},
      (moved, e, r) => {
        if (moved && inside(book, e)) return;          // let go inside the book: stays in its slot
        el.remove();
        if (moved) placeFree(k, r);                    // dragged out: it stays right where it was let go
        else placeFree(k, r, spotRect());              // clicked: it hops over next to the photos
      });
    if (!reduce) el.animate([{ scale: .6, opacity: 0 }, { scale: 1, opacity: 1 }], { duration: 250 });
  }

  // A spot next to the photo pile (for a click instead of a drag)
  function spotRect() {
    const p = pile.getBoundingClientRect();
    const f = innerWidth <= 860 ? 0.72 : 1;
    const [x0, y0] = spots[placed % spots.length], x = x0 * f, y = y0 * f;
    const w = stickerSize();
    return { left: p.left + p.width / 2 + x - w / 2, top: p.top + p.height / 2 + y - w / 2, width: w, height: w };
  }
  const stickerSize = () => (innerWidth <= 860 ? 120 : 150);

  // Step 2: the finished sticker lives on the page; it can be picked up and moved anywhere, any time
  let zTop = 10;
  function placeFree(k, from, target) {
    const L = root.getBoundingClientRect();
    const w = stickerSize();
    const to = target || { left: from.left + from.width / 2 - w / 2, top: from.top + from.height / 2 - w / 2 };
    const el = document.createElement('img');
    el.className = 'drop-made';
    el.src = data.stickers[k];
    el.alt = '';
    el.draggable = false;
    const r = spots[placed % spots.length][2];
    Object.assign(el.style, { left: to.left - L.left + 'px', top: to.top - L.top + 'px', width: w + 'px', height: w + 'px', rotate: r + 'deg', zIndex: ++zTop });
    root.append(el);
    placed++;
    updateHint();
    movable(el);
    if (reduce) return;
    const end = el.getBoundingClientRect();
    el.animate([
      { translate: `${from.left + from.width / 2 - (end.left + end.width / 2)}px ${from.top + from.height / 2 - (end.top + end.height / 2)}px`, scale: from.width / w },
      { translate: '0 0', scale: 1.06, offset: 0.75 },
      { translate: '0 0', scale: 1 },
    ], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }

  function movable(el) {
    let sx, sy, on = false;
    el.addEventListener('pointerdown', e => {
      on = true; sx = e.clientX; sy = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = ++zTop;
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', e => { if (on) el.style.translate = `${e.clientX - sx}px ${e.clientY - sy}px`; });
    const end = e => {
      if (!on) return;
      on = false;
      el.classList.remove('dragging');
      el.style.left = parseFloat(el.style.left) + (e.clientX - sx) + 'px';
      el.style.top = parseFloat(el.style.top) + (e.clientY - sy) + 'px';
      el.style.translate = '';
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', () => { on = false; el.classList.remove('dragging'); el.style.translate = ''; });
  }

  function sparkle(x, y) {
    ['✨', '✂️', '✨'].forEach((c, i) => {
      const el = document.createElement('span');
      el.className = 'drop-spark';
      el.textContent = c;
      Object.assign(el.style, { left: x - 13 + 'px', top: y - 13 + 'px' });
      document.body.append(el);
      const a = (i - 1) * 1.1 - Math.PI / 2;
      el.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 1 },
                  { transform: `translate(${Math.cos(a) * 44}px,${Math.sin(a) * 44}px) scale(1)`, opacity: 0 }],
                 { duration: 600, easing: 'ease-out' }).onfinish = () => el.remove();
    });
  }

  photos.forEach(photo => draggable(photo, () => photo === top(),
    e => book.classList.toggle('hot', !!e && inside(book, e)),
    (moved, e, r) => {
      const over = book.classList.contains('hot');
      book.classList.remove('hot');
      if (!moved || over) intoBook(photo, r);         // otherwise it slides back onto the pile
    }));

  reset.addEventListener('click', () => {
    count = 0; placed = 0;
    root.querySelectorAll('.drop-made').forEach(el => el.remove());
    book.querySelectorAll('.drop-pending').forEach(el => el.remove());
    photos.forEach(p => pile.append(p));
    showState(0);
    updateHint();
    top().focus();
  });
})();
