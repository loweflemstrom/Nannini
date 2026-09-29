(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const views = [...document.querySelectorAll('.page-view')];
  const pageStage = document.querySelector('.page-stage');
  const viewNames = ['home', 'om', 'repertoar', 'evenemang', 'kontakt'];
  const viewForHash = { home: 'home', om: 'om', repertoar: 'repertoar', spelningar: 'evenemang', evenemang: 'evenemang', kontakt: 'kontakt' };
  let activeView = views.find(view => view.classList.contains('is-active'))?.dataset.view || 'home';

  const showView = (name, updateHistory = true, animate = true) => {
    const next = views.find(view => view.dataset.view === name);
    if (!next || name === activeView) return;
    if (animate && pageStage) {
      pageStage.classList.remove('is-transitioning');
      void pageStage.offsetWidth;
      pageStage.classList.add('is-transitioning');
      document.body.classList.add('page-smoke-active');
      window.setTimeout(() => {
        pageStage.classList.remove('is-transitioning');
        document.body.classList.remove('page-smoke-active');
      }, 1850);
    }
    const current = views.find(view => view.dataset.view === activeView);
    const direction = viewNames.indexOf(name) > viewNames.indexOf(activeView) ? 'left' : 'right';
    if (current && animate) {
      current.classList.remove('is-active');
      current.classList.add(`is-leaving-${direction}`);
      current.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => current.classList.remove(`is-leaving-${direction}`), 1650);
    } else {
      current?.classList.remove('is-active');
      current?.setAttribute('aria-hidden', 'true');
    }
    next.classList.add('is-active');
    next.setAttribute('aria-hidden', 'false');
    if (animate) {
      next.classList.add(direction === 'left' ? 'is-from-right' : 'is-from-left');
      requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('is-from-right', 'is-from-left')));
    }
    activeView = name;
    if (updateHistory) {
      const hash = name === 'home' ? '#home' : name === 'evenemang' ? '#spelningar' : `#${name}`;
      history.pushState({ view: name }, '', hash);
    }
    next.scrollTop = 0;
  };

  if (views.length) {
    document.body.classList.add('page-mode');
    views.forEach(view => view.setAttribute('aria-hidden', String(!view.classList.contains('is-active'))));
    const requestedView = viewForHash[location.hash.slice(1)];
    if (requestedView && requestedView !== activeView) showView(requestedView, false, false);
    window.addEventListener('popstate', () => {
      const view = viewForHash[location.hash.slice(1)] || 'home';
      showView(view, false, true);
    });
    document.addEventListener('click', event => {
      const viewLink = event.target.closest('[data-view-link]');
      if (!viewLink) return;
      event.preventDefault();
      showView(viewLink.dataset.viewLink);
      nav?.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  }

  const getTransition = () => { try { return sessionStorage.getItem('nannini-page-transition'); } catch { return null; } };
  const setTransition = value => { try { sessionStorage.setItem('nannini-page-transition', value); } catch {} };
  const clearTransition = () => { try { sessionStorage.removeItem('nannini-page-transition'); } catch {} };
  const incomingTransition = getTransition();
  if (incomingTransition) {
    clearTransition();
    document.body.classList.add('page-enter-from-left');
    window.setTimeout(() => document.body.classList.remove('page-enter-from-left'), 750);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || !/\.html(?:#.*)?$/i.test(link.getAttribute('href'))) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.href === location.href) return;
    event.preventDefault();
    setTransition('right');
    document.body.classList.add('page-leaving-to-right');
    window.setTimeout(() => location.assign(destination.href), 260);
  });

  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  const dropdown = document.querySelector('.dropdown');
  const dropdownButton = document.querySelector('.dropdown-toggle');
  dropdownButton?.addEventListener('click', () => {
    if (views.length) showView('evenemang');
    const open = dropdown.classList.toggle('open');
    dropdownButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    if (dropdown && !dropdown.contains(event.target)) {
      dropdown.classList.remove('open');
      dropdownButton?.setAttribute('aria-expanded', 'false');
    }
  });

  const windowEl = document.querySelector('#review-window');
  const track = document.querySelector('#review-track');
  if (windowEl && track) {
    const originals = [...track.children];
    originals.forEach(card => track.append(card.cloneNode(true)));
    let offset = 0, dragging = false, startY = 0, startOffset = 0, pausedUntil = 0;
    const limit = () => track.scrollHeight / 2;
    const paint = () => { track.style.transform = `translateY(${-offset}px)`; };
    const pause = () => { pausedUntil = performance.now() + 3600; };
    const down = y => { dragging = true; startY = y; startOffset = offset; pause(); windowEl.classList.add('dragging'); };
    const move = y => { if (!dragging) return; offset = (startOffset - (y - startY) + limit()) % limit(); paint(); };
    const up = () => { dragging = false; windowEl.classList.remove('dragging'); };
    windowEl.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; windowEl.setPointerCapture(e.pointerId); down(e.clientY); });
    windowEl.addEventListener('pointermove', e => move(e.clientY));
    windowEl.addEventListener('pointerup', up);
    windowEl.addEventListener('pointercancel', up);
    windowEl.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); offset = (offset + (e.key === 'ArrowDown' ? 48 : -48) + limit()) % limit(); paint(); pause(); }
    });
    let last = performance.now();
    const tick = now => { const delta = Math.min(now - last, 50); last = now; if (!dragging && now > pausedUntil) { offset = (offset - delta * 0.014 + limit()) % limit(); paint(); } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  document.querySelector('#contact-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const eventType = String(data.get('event') || 'Ej angivet');
    const message = String(data.get('message') || '').trim();
    const subject = `Bokningsförfrågan från ${name}`;
    const body = `Namn: ${name}\nE-post: ${email}\nTyp av evenemang: ${eventType}\n\nMeddelande:\n${message}`;
    document.querySelector('#form-status').textContent = 'Ditt mejlprogram öppnas med förfrågan ifylld. Tryck på Skicka där för att mejlet ska komma fram.';
    window.location.href = `mailto:lowe.flemstrom@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  const headerPlayButton = document.querySelector('#header-player-toggle');
  const siteAudio = document.querySelector('#site-audio');
  const trackSelect = document.querySelector('#track-select');
  const trackTitle = document.querySelector('#track-title');
  const previousTrackButton = document.querySelector('#track-previous');
  const nextTrackButton = document.querySelector('#track-next');
  if (siteAudio && trackSelect) {
    const audioSource = siteAudio.querySelector('source');
    trackSelect.addEventListener('change', () => {
      const shouldResume = !siteAudio.paused;
      siteAudio.pause();
      audioSource.src = trackSelect.value;
      if (trackTitle) trackTitle.textContent = trackSelect.selectedOptions[0].textContent;
      siteAudio.load();
      if (shouldResume) siteAudio.play().catch(() => {});
    });
    const moveTrack = direction => {
      trackSelect.selectedIndex = (trackSelect.selectedIndex + direction + trackSelect.options.length) % trackSelect.options.length;
      trackSelect.dispatchEvent(new Event('change', { bubbles: true }));
    };
    previousTrackButton?.addEventListener('click', () => moveTrack(-1));
    nextTrackButton?.addEventListener('click', () => moveTrack(1));
  }
  if (headerPlayButton && siteAudio) {
    const reflectPlayback = () => {
      const playing = !siteAudio.paused;
      headerPlayButton.classList.toggle('is-playing', playing);
      headerPlayButton.setAttribute('aria-pressed', String(playing));
      headerPlayButton.setAttribute('aria-label', playing ? 'Pausa musiken' : 'Spela musik');
      headerPlayButton.setAttribute('title', playing ? 'Pausa musiken' : 'Spela musik');
    };
    headerPlayButton.addEventListener('click', () => {
      if (siteAudio.paused) siteAudio.play().catch(() => {});
      else siteAudio.pause();
    });
    siteAudio.addEventListener('play', reflectPlayback);
    siteAudio.addEventListener('pause', reflectPlayback);
    siteAudio.addEventListener('ended', reflectPlayback);
  }
})();

