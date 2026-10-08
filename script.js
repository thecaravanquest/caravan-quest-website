(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  // Count-up stats
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    const tick = t => {
      const p = clamp((t - t0) / 1400);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    cio.unobserve(el);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  // ---- Elements ----
  const nav = $('#nav'), bar = $('#progress'), hero = $('.hero');
  const disc = $('#discoverWrap'), discO = $('#discoverOutline'), scene = $('#scene'), sceneFg = $('#sceneFg');
  const links = $$('.nav-links a'), secs = links.map(a => $(a.getAttribute('href')));

  // ---- The Route: pinned stage; each emirate's scene rises up as you scroll down ----
  const route = $('#route'), rscenes = $$('.rscene'), rtexts = $$('.rtext'), N = rtexts.length;
  const rfill = $('#rfill'), rcamel = $('#rcamel'), rdots = $('#rdots'), rstage = $('#rstage');
  const dotEls = rtexts.map((t, i) => {
    const s = document.createElement('span'); s.style.top = (i / (N - 1) * 100) + '%';
    rdots.appendChild(s); return s;
  });
  let lastCh = -1;
  const routeUpdate = vh => {
    const r = route.getBoundingClientRect();
    if (r.top > vh || r.bottom < 0) { if (lastCh !== -2) { document.documentElement.style.removeProperty('--prog'); lastCh = -2; } return; }
    const f = clamp(-r.top / (route.offsetHeight - vh));
    const p = f * (N - 1), cur = Math.round(p);
    rscenes.forEach((sc, i) => {
      const t = i === 0 ? 0 : (1 - clamp(p - (i - 1))) * 100;
      sc.style.transform = `translate3d(0,${t}%,0)`;
      sc.style.visibility = t >= 100 ? 'hidden' : 'visible';
      $$('.lyr', sc).forEach(l => { l.style.transform = `translate3d(0,${(i - p) * (+l.dataset.d) * 26}px,0)`; });
    });
    rtexts.forEach((t, i) => {
      const dd = p - i, o = clamp(1 - Math.abs(dd) * 2.2);
      t.style.opacity = o; t.style.visibility = o > .02 ? 'visible' : 'hidden';
      t.style.transform = `translate3d(0,${dd * -70}px,0)`;
    });
    rfill.style.height = (f * 100) + '%';
    rcamel.style.top = (f * 100) + '%';
    dotEls.forEach((d, i) => d.classList.toggle('done', i <= p + .02));
    if (cur !== lastCh) {
      lastCh = cur;
      const ac = rtexts[cur].dataset.color;
      rstage.style.setProperty('--ac', ac);
      document.documentElement.style.setProperty('--prog', ac);
    }
  };

  // ---- About: the pinned photo follows the statement you are reading ----
  const abtSteps = $$('.abt-step'), abtImgs = $$('.abt-img'), abtCap = $('#abtCap'), abtIdx = $('#abtIdx'), abtBar = $('#abtBar');
  let lastAbt = -1;
  const aboutUpdate = vh => {
    let cur = 0, best = 1e9;
    abtSteps.forEach((s, i) => {
      const r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh * .5);
      if (d < best) { best = d; cur = i; }
      s.classList.toggle('on', r.top < vh * .62 && r.bottom > vh * .38);
    });
    if (cur === lastAbt) return;
    lastAbt = cur;
    abtImgs.forEach((im, i) => im.classList.toggle('on', i === cur));
    abtCap.textContent = abtImgs[cur].dataset.cap;
    abtIdx.textContent = '0' + (cur + 1) + ' / 0' + abtSteps.length;
    abtBar.style.width = ((cur + 1) / abtSteps.length * 100) + '%';
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    bar.style.width = (y / (document.documentElement.scrollHeight - vh) * 100) + '%';
    nav.classList.toggle('solid', y > 60);

    if (!reduce && y < hero.offsetHeight) {
      const p = clamp(y / (vh * .9));
      const s = `translate3d(0,${y * .28}px,0) scale(${1 + p * .08})`;
      scene.style.transform = s; sceneFg.style.transform = s;
      disc.style.transform = s; discO.style.transform = s;
      disc.style.opacity = discO.style.opacity = 1 - p * .9;
    }

    aboutUpdate(vh);
    routeUpdate(vh);

    // The Hunt: the block you are reading lights up
    $$('.hblock').forEach(b => { const r = b.getBoundingClientRect(); b.classList.toggle('on', r.top < vh * .6 && r.bottom > vh * .4); });

    // Gentle image parallax
    $$('[data-par]').forEach(im => {
      const r = im.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) im.style.transform = `translate3d(0,${(r.top + r.height / 2 - vh / 2) * -(parseFloat(im.dataset.par) || .07)}px,0)`;
    });

    // Active nav link
    let cur = 0;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * .4) cur = i; });
    links.forEach((a, i) => a.classList.toggle('active', i === cur));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  // Glass dropdowns: replace native select lists (browsers can't style them)
  $$('.finder select').forEach(sel => {
    const wrapEl = document.createElement('div'); wrapEl.className = 'dd';
    sel.parentNode.insertBefore(wrapEl, sel); wrapEl.appendChild(sel);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dd-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    const list = document.createElement('ul'); list.className = 'dd-list'; list.setAttribute('role', 'listbox'); list.tabIndex = -1;
    const items = [...sel.options].map((o, i) => {
      const li = document.createElement('li'); li.textContent = o.textContent; li.setAttribute('role', 'option'); li.dataset.i = i;
      list.appendChild(li); return li;
    });
    wrapEl.append(btn, list);
    let act = sel.selectedIndex;
    const paint = () => {
      btn.textContent = sel.options[sel.selectedIndex].textContent;
      items.forEach((li, i) => { li.setAttribute('aria-selected', i === sel.selectedIndex); li.classList.toggle('act', i === act); });
    };
    const open = v => {
      wrapEl.classList.toggle('open', v); btn.setAttribute('aria-expanded', v);
      if (v) { $$('.dd.open').forEach(d => d !== wrapEl && d.classList.remove('open')); act = sel.selectedIndex; paint(); }
    };
    const pick = i => { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); open(false); paint(); btn.focus(); };
    btn.addEventListener('click', () => open(!wrapEl.classList.contains('open')));
    list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) pick(+li.dataset.i); });
    btn.addEventListener('keydown', e => {
      const isOpen = wrapEl.classList.contains('open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!isOpen) return open(true);
        act = clamp(act + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); paint();
      } else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); pick(act); }
      else if (e.key === 'Escape') open(false);
    });
    document.addEventListener('click', e => { if (!wrapEl.contains(e.target)) open(false); });
    sel.addEventListener('change', () => { act = sel.selectedIndex; paint(); });
    paint();
  });

  // Start the Hunt: filter the route by site type, then jump to the region or camel type chosen
  $('#finder').addEventListener('submit', e => {
    e.preventDefault();
    const region = $('#fRegion').value, kind = $('#fType').value, species = $('#fLevel').value;
    $$('.sites li').forEach(li => li.classList.toggle('hide', !!kind && li.dataset.kind !== kind));
    $$('.species').forEach(s => s.classList.remove('pulse'));
    let target = $('#route');
    if (region) {
      const i = rtexts.findIndex(t => t.dataset.region === region);
      if (i >= 0) { const top = route.getBoundingClientRect().top + scrollY, span = route.offsetHeight - innerHeight; scrollTo({ top: top + span * (i / (N - 1)), behavior: 'smooth' }); return; }
    }
    else if (species) {
      const card = $$('.species').find(s => s.dataset.species === species);
      if (card) { card.classList.add('pulse'); target = card; }
    }
    target.scrollIntoView({ behavior: 'smooth', block: target.classList.contains('species') ? 'center' : 'start' });
  });

  // Signup: front end only for now
  $('#signup').addEventListener('submit', e => {
    e.preventDefault();
    e.target.hidden = true;
    $('#thanks').hidden = false;
  });
})();
