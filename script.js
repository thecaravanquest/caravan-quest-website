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

  // Scroll-driven scene
  const nav = $('#nav'), bar = $('#progress'), hero = $('.hero'), disc = $('#discoverWrap'), discO = $('#discoverOutline'), scene = $('#scene'), sceneFg = $('#sceneFg');
  const lines = $$('#bigStatement span');
  const quest = $('#quest'), track = $('#questTrack'), tcamel = $('#trailCamel');
  const links = $$('.nav-links a'), secs = links.map(a => $(a.getAttribute('href')));

  // ---- JOURNEY ----
  const CH = [
    { stop: 'Dubai', region: 'Dubai', title: 'Where the quest begins', color: '#e08a45', type: 'Sculpture Hunt', level: 'Easy', copy: 'Steel towers on one side, open dunes on the other. The first camel hides where the city meets the sand.' },
    { stop: 'Al Ain', region: 'Al Ain', title: 'Green in the gold', color: '#8cc084', type: 'Desert Trail', level: 'Moderate', copy: 'Follow the water channels into the palm shade. Cool air, old stone and a camel waiting between the trees.' },
    { stop: 'Ras Al Khaimah', region: 'Ras Al Khaimah', title: 'Above the clouds', color: '#9fc0dc', type: 'Coast & Mountains', level: 'Hard', copy: 'The road climbs into rock and mist. Up here the camel watches over the whole valley.' },
    { stop: 'Sharjah', region: 'Sharjah', title: 'Stories in stone', color: '#f0a36b', type: 'Heritage Walk', level: 'Easy', copy: 'Lantern light, coral-stone walls and narrow lanes. Every corner has a story, and one has a camel.' },
    { stop: 'Fujairah', region: 'Fujairah', title: 'Where mountains meet the sea', color: '#4cc1c9', type: 'Coast & Mountains', level: 'Moderate', copy: 'Turn east to the coast. Salt wind, cliff paths and a camel looking out at the water.' },
    { stop: 'Home', region: '', title: 'The last camel', color: '#f2cf8a', type: '', level: '', copy: 'You have walked the whole caravan. The stars come out, and the next journey is yours.' }
  ];
  const N = CH.length;
  const jsec = $('#journey'), jstage = $('#jstage'), jscenes = $$('.jscene'), jtexts = $('#jtexts'), jdots = $('#jdots'), jstops = $('#jstops');
  const jfill = $('#jfill'), jcamel = $('#jcamel');
  const stars = $('#stars');
  for (let k = 0; k < 110; k++) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    s.setAttribute('cx', Math.round(Math.random() * 1600)); s.setAttribute('cy', Math.round(Math.random() * 560));
    s.setAttribute('r', (Math.random() * 1.8 + .4).toFixed(1)); s.setAttribute('opacity', (Math.random() * .7 + .3).toFixed(2));
    stars.appendChild(s);
  }
  const jt = CH.map((ch, i) => {
    const d = document.createElement('div'); d.className = 'jtext';
    d.innerHTML = `<div class="jnum">0${i + 1}</div><p class="eyebrow">${ch.region || 'The finale'}</p><h3>${ch.title}</h3><p>${ch.copy}</p>` +
      (ch.type ? `<div class="jtags"><b>${ch.type.replace('&', '&amp;')}</b><b>${ch.level}</b></div><a href="#destinations" data-region="${ch.region}">See ${ch.region} quests <span>→</span></a>`
               : `<div class="jtags"></div><a href="#join">Join the Journey <span>→</span></a>`);
    jtexts.appendChild(d); return d;
  });
  const dots = CH.map((ch, i) => {
    const li = document.createElement('li'); li.title = ch.stop; li.addEventListener('click', () => goChapter(i));
    jdots.appendChild(li); return li;
  });
  const stops = CH.map((ch, i) => {
    const s = document.createElement('div'); s.className = 'jstop'; s.style.left = (i / (N - 1) * 100) + '%'; s.textContent = ch.stop;
    jstops.appendChild(s); return s;
  });
  const goChapter = i => {
    const top = jsec.getBoundingClientRect().top + scrollY, span = jsec.offsetHeight - innerHeight;
    scrollTo({ top: top + span * (i / (N - 1)), behavior: 'smooth' });
  };
  jtexts.addEventListener('click', e => {
    const a = e.target.closest('a[data-region]'); if (!a) return;
    e.preventDefault();
    const sel = $('#fRegion'); sel.value = a.dataset.region; sel.dispatchEvent(new Event('change', { bubbles: true }));
    $('#finder').requestSubmit();
  });
  let lastCh = -1;
  const journeyUpdate = vh => {
    const r = jsec.getBoundingClientRect();
    const inView = r.top < vh && r.bottom > 0;
    if (!inView) { if (lastCh !== -2) { document.documentElement.style.removeProperty('--prog'); lastCh = -2; } return; }
    const f = clamp(-r.top / (jsec.offsetHeight - vh));
    const p = f * (N - 1), cur = Math.round(p);
    jscenes.forEach((sc, i) => {
      sc.style.opacity = i === 0 ? 1 : clamp(p - (i - 1));
      $$('.lyr', sc).forEach(l => { l.style.transform = `translate3d(${(p - i) * -(+l.dataset.d) * 38}px,0,0)`; });
    });
    jt.forEach((t, i) => {
      const dd = p - i, o = clamp(1 - Math.abs(dd) * 2.4);
      t.style.opacity = o; t.style.visibility = o > .02 ? 'visible' : 'hidden';
      t.style.transform = `translate3d(0,${dd * -40}px,0)`; t.style.pointerEvents = i === cur ? 'auto' : 'none';
    });
    jfill.style.width = (f * 100) + '%';
    jcamel.style.left = (f * 100) + '%';
    jcamel.style.transform = `translateX(-50%) translateY(${Math.sin(f * N * 28) * -2}px)`;
    stops.forEach((s, i) => { s.classList.toggle('done', i < cur); s.classList.toggle('on', i === cur); });
    dots.forEach((d, i) => d.classList.toggle('on', i === cur));
    if (cur !== lastCh) {
      lastCh = cur; jstage.style.setProperty('--accent', CH[cur].color);
      document.documentElement.style.setProperty('--prog', CH[cur].color);
    }
  };
  // ---- END JOURNEY ----

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

    // Statement lines light up one by one
    lines.forEach(l => l.classList.toggle('lit', l.getBoundingClientRect().top < vh * .68));

    // Pinned quest: scroll moves the cards sideways and walks the camel along the trail
    const qr = quest.getBoundingClientRect();
    const qp = clamp(-qr.top / (quest.offsetHeight - vh));
    const maxX = Math.max(0, track.scrollWidth - innerWidth * .9);
    track.style.transform = `translate3d(${-qp * maxX}px,0,0)`;
    tcamel.style.left = `calc(${qp * 100}% - ${qp * 84}px)`;

    journeyUpdate(vh);

    // Gentle image parallax
    $$('[data-par]').forEach(im => { const r = im.parentElement.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) im.style.transform = `translate3d(0,${(r.top + r.height / 2 - vh / 2) * -.07}px,0)`; });

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
    const wrap = document.createElement('div'); wrap.className = 'dd';
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dd-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    const list = document.createElement('ul'); list.className = 'dd-list'; list.setAttribute('role', 'listbox'); list.tabIndex = -1;
    const items = [...sel.options].map((o, i) => {
      const li = document.createElement('li'); li.textContent = o.textContent; li.setAttribute('role', 'option'); li.dataset.i = i;
      list.appendChild(li); return li;
    });
    wrap.append(btn, list);
    let act = sel.selectedIndex;
    const paint = () => {
      btn.textContent = sel.options[sel.selectedIndex].textContent;
      items.forEach((li, i) => { li.setAttribute('aria-selected', i === sel.selectedIndex); li.classList.toggle('act', i === act); });
    };
    const open = v => { wrap.classList.toggle('open', v); btn.setAttribute('aria-expanded', v); if (v) { $$('.dd.open').forEach(d => d !== wrap && d.classList.remove('open')); act = sel.selectedIndex; paint(); } };
    const pick = i => { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); open(false); paint(); btn.focus(); };
    btn.addEventListener('click', () => open(!wrap.classList.contains('open')));
    list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) pick(+li.dataset.i); });
    btn.addEventListener('keydown', e => {
      const isOpen = wrap.classList.contains('open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen) return open(true); act = clamp(act + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); paint(); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); pick(act); }
      else if (e.key === 'Escape') open(false);
    });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) open(false); });
    sel.addEventListener('change', () => { act = sel.selectedIndex; paint(); });
    paint();
  });

  // Quest finder filters the destination cards
  $('#finder').addEventListener('submit', e => {
    e.preventDefault();
    const f = { region: $('#fRegion').value, type: $('#fType').value, level: $('#fLevel').value };
    let shown = 0;
    $$('.card').forEach(c => {
      const ok = (!f.region || c.dataset.region === f.region) && (!f.type || c.dataset.type === f.type) && (!f.level || c.dataset.level === f.level);
      c.classList.toggle('hide', !ok);
      if (ok) shown++;
    });
    $('#empty').hidden = shown > 0;
    $('#destinations').scrollIntoView({ behavior: 'smooth' });
  });

  // Signup: front end only for now
  $('#signup').addEventListener('submit', e => {
    e.preventDefault();
    e.target.hidden = true;
    $('#thanks').hidden = false;
  });
})();
