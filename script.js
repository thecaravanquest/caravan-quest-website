(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // one reveal: each element rises once, visible without script
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal]').forEach((el) => io.observe(el));

  // route: the sticky plate follows the row that crosses the middle of the screen
  const rows = $$('.route-row'), plates = $$('.route-plates img');
  const setRoute = (i) => {
    rows.forEach((r, k) => r.classList.toggle('is-active', k === i));
    plates.forEach((p, k) => {
      if (k === i && p.loading === 'lazy') p.loading = 'eager';
      p.classList.toggle('is-on', k === i);
    });
  };
  if (rows.length) {
    const rio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) setRoute(+e.target.dataset.i);
    }), { rootMargin: '-45% 0px -45% 0px' });
    rows.forEach((r) => rio.observe(r));
  }

  // nav: solid after the hero starts to leave, current section marked
  const nav = $('#nav'), hero = $('.hero');
  const disc = $('#discoverWrap'), discO = $('#discoverOutline'), scene = $('#scene'), sceneFg = $('#sceneFg');
  const links = $$('.nav-links a'), secs = links.map((a) => $(a.getAttribute('href')));
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle('solid', y > 60);

    // the hero: DISCOVER and the scene drift and fade as you leave, as before
    if (!reduce && y < hero.offsetHeight) {
      const p = clamp(y / (vh * .9));
      const s = `translate3d(0,${y * .28}px,0) scale(${1 + p * .08})`;
      scene.style.transform = s; sceneFg.style.transform = s;
      disc.style.transform = s; discO.style.transform = s;
      disc.style.opacity = discO.style.opacity = 1 - p * .9;
    }

    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * .4) cur = i; });
    links.forEach((a, i) => a.classList.toggle('active', i === cur));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  // the hunt on the page: two Originals, a Secretive camel that needs both, a Digital one
  (() => {
    const KEY = 'cq-found';
    const camels = $$('[data-camel]'), count = $('#tallyCount'), note = $('#tallyNote'), say = $('#announce'), finale = $('#finale');
    if (!camels.length) return;
    let found = [];
    try { found = JSON.parse(localStorage.getItem(KEY) || '[]').filter((k) => ['a', 's', 'd'].includes(k)); } catch (e) { found = []; }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(found)); } catch (e) { /* private mode: the hunt still works */ } };
    const unlocked = () => found.includes('a') && found.includes('d');
    const label = { a: 'an Original', s: 'a Secretive camel', d: 'a Digital camel' };
    let timer;
    const paint = (msg) => {
      camels.forEach((c) => {
        const k = c.dataset.camel, got = found.includes(k);
        c.classList.toggle('is-found', got);
        if (k === 's') c.hidden = !(unlocked() || got);
        c.setAttribute('aria-label', got ? 'A camel you found.' : (k === 's' ? 'A secretive camel has appeared. Press to find it.' : (k === 'd' ? 'A digital camel. Press to find it.' : 'A hidden camel. Press to find it.')));
      });
      count.textContent = 'Found ' + found.length + ' of 3';
      finale.hidden = found.length < 3;
      if (msg) {
        note.textContent = msg; note.classList.add('is-on'); say.textContent = count.textContent + '. ' + msg;
        clearTimeout(timer); timer = setTimeout(() => { note.classList.remove('is-on'); }, 6000);
      }
    };
    camels.forEach((c) => c.addEventListener('click', () => {
      const k = c.dataset.camel;
      if (found.includes(k) || (k === 's' && !unlocked())) return;
      found.push(k); save();
      const wasLocked = !unlocked();
      paint(k === 's' ? 'You found the Secretive one.' : (k === 'd' ? 'You found a Digital one.' : 'You found ' + label[k] + '.') + (!wasLocked && (k === 'a' || k === 'd') && !found.includes('s') ? ' Something rare has appeared near the end of the page.' : ''));
    }));
    $('#again').addEventListener('click', () => { found = []; save(); paint('Starting again.'); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    paint();
  })();

  // sign-up: says plainly when nothing is connected yet
  $$('form[data-endpoint]').forEach((form) => {
    const input = $('input', form), help = $('[aria-live]', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = input.checkValidity();
      input.toggleAttribute('aria-invalid', !ok);
      if (!ok) { help.textContent = 'That address looks incomplete. Write it as name@example.com.'; input.focus(); return; }
      if (!form.dataset.endpoint) { help.textContent = 'Nothing was sent: sign-ups are not connected yet. Follow @thecaravanquest on Instagram for news.'; return; }
      fetch(form.dataset.endpoint, { method: 'POST', body: new FormData(form) })
        .then((r) => { help.textContent = r.ok ? 'Thanks. We will write to ' + input.value.trim() + '.' : 'That did not go through. Try again in a minute.'; })
        .catch(() => { help.textContent = 'That did not go through. Try again in a minute.'; });
    });
  });
})();
