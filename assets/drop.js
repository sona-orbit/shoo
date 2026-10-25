// "Make it yours": drag a photo from the pile into the book screenshot.
// The photo flies to the empty slot, turns into its cut-out sticker, and the
// book switches to the next screenshot taken from the app (5 states, 0–4 photos).
// Clicking or pressing Enter on the top photo does the same (phones, keyboards).
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
  let count = 0, busy = false;

  // Warm up the next screenshots so the swap is instant
  data.states.slice(1).forEach(src => { const i = new Image(); i.src = src; });
  Object.values(data.stickers).forEach(src => { const i = new Image(); i.src = src; });

  const top = () => pile.querySelector('.drop-photo:last-child');

  function showState(n) {
    next.src = data.states[n];
    const swap = () => {
      next.classList.add('show');
      setTimeout(() => { shown.src = data.states[n]; next.classList.remove('show'); }, reduce ? 0 : 380);
    };
    if (next.complete && next.naturalWidth) swap(); else next.onload = swap;
  }

  function accept(photo, from) {
    if (busy) return;
    busy = true;
    const k = photo.dataset.k;
    const b = book.getBoundingClientRect();
    const [sx, sy] = slots[count + 1];
    const size = b.width * 0.11;
    const to = { x: b.left + b.width * sx / 100 - size / 2, y: b.top + b.height * sy / 100 - size / 2 };
    const start = from || photo.getBoundingClientRect();
    photo.remove();

    const finish = () => {
      bringBack(k, count, null);
      count++;
      showState(count);
      busy = false;
      if (count >= data.order.length) {
        hint.classList.add('done');
        hint.querySelector('b').textContent = data.done;
        hint.querySelector('span').hidden = true;
        reset.hidden = false;
      }
    };
    if (reduce) { finish(); return; }

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
      showState(count + 1);
      const n = count;
      setTimeout(() => {
        fly.remove();
        bringBack(k, n, { left: to.x, top: to.y, width: size });
        count++; busy = false;
        if (count >= data.order.length) finishAll();
      }, 380);
    };
    function finishAll() {
      hint.classList.add('done');
      hint.querySelector('b').textContent = data.done;
      hint.querySelector('span').hidden = true;
      reset.hidden = false;
    }
  }

  // The finished sticker comes back out of the book to where the photo pile is
  const spots = [[-78, -34, -8], [80, -44, 7], [-70, 52, 5], [74, 46, -6]];
  function bringBack(k, n, from) {
    const el = document.createElement('img');
    el.className = 'drop-made';
    el.src = data.stickers[k];
    el.alt = '';
    const [x, y, r] = spots[n];
    el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
    pile.prepend(el);
    if (!from || reduce) return;
    const end = el.getBoundingClientRect();
    const s = from.width / end.width;
    el.animate([
      { transform: `translate(${x + from.left - end.left + (from.width - end.width) / 2}px, ${y + from.top - end.top + (from.width - end.height) / 2}px) scale(${s})` },
      { transform: `translate(${x}px, ${y - 30}px) rotate(${r}deg) scale(1.08)`, offset: 0.75 },
      { transform: `translate(${x}px, ${y}px) rotate(${r}deg)` },
    ], { duration: 700, easing: 'cubic-bezier(.3,.7,.3,1)' });
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

  // Drag with pointer events (mouse, pen, touch); a tap without moving counts as a click
  photos.forEach(photo => {
    let startX, startY, moved = false, dragging = false;
    photo.addEventListener('pointerdown', e => {
      if (busy || photo !== top()) return;
      startX = e.clientX; startY = e.clientY; moved = false; dragging = true;
      photo.setPointerCapture(e.pointerId);
      photo.classList.add('dragging');
    });
    photo.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      photo.style.transform = `translate(${dx}px,${dy}px) rotate(-3deg) scale(1.05)`;
      const b = book.getBoundingClientRect();
      book.classList.toggle('hot', e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom);
    });
    const end = e => {
      if (!dragging) return;
      dragging = false;
      photo.classList.remove('dragging');
      const over = book.classList.contains('hot');
      book.classList.remove('hot');
      if (!moved || over) {
        const r = photo.getBoundingClientRect();   // start the flight where the photo was let go
        accept(photo, r);
        photo.style.transform = '';
      } else {
        photo.style.transform = '';   // dropped outside: slide back onto the pile
      }
    };
    photo.addEventListener('pointerup', end);
    photo.addEventListener('pointercancel', e => { dragging = false; photo.classList.remove('dragging'); photo.style.transform = ''; book.classList.remove('hot'); });
    photo.addEventListener('click', e => { if (e.detail === 0 && photo === top()) accept(photo); });   // keyboard Enter/Space
  });

  reset.addEventListener('click', () => {
    count = 0;
    pile.querySelectorAll('.drop-made').forEach(el => el.remove());
    photos.forEach(p => pile.append(p));
    showState(0);
    hint.classList.remove('done');
    hint.querySelector('b').textContent = data.hint;
    hint.querySelector('span').hidden = false;
    reset.hidden = true;
    top().focus();
  });
})();
