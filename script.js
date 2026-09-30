(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const views = [...document.querySelectorAll('.page-view')];
  const pageStage = document.querySelector('.page-stage');
  const viewNames = ['home', 'om', 'melodifestivalen', 'repertoar', 'live', 'eget-material', 'evenemang', 'kontakt'];
  const viewForHash = { home: 'home', om: 'om', melodifestivalen: 'melodifestivalen', repertoar: 'repertoar', live: 'live', 'eget-material': 'eget-material', spelningar: 'evenemang', evenemang: 'evenemang', kontakt: 'kontakt' };
  const viewFromLocation = () => {
    const requested = new URLSearchParams(location.search).get('view');
    return viewNames.includes(requested) ? requested : (viewForHash[location.hash.slice(1)] || 'home');
  };
  let activeView = views.find(view => view.classList.contains('is-active'))?.dataset.view || 'home';
  let transitionVersion = 0;
  let smokeTimer = 0;
  let slideTimer = 0;
  let slideAnimations = [];

  const resetViewTransition = () => {
    transitionVersion += 1;
    window.clearTimeout(smokeTimer);
    window.clearTimeout(slideTimer);
    slideAnimations.forEach(animation => animation.cancel());
    slideAnimations = [];
    views.forEach(view => view.classList.remove('is-from-left', 'is-from-right', 'is-leaving-left', 'is-leaving-right'));
    pageStage?.classList.remove('is-transitioning');
    pageStage?.classList.remove('is-sliding');
    document.body.classList.remove('page-smoke-active');
  };

  const showView = (name, updateHistory = true, animate = true) => {
    const next = views.find(view => view.dataset.view === name);
    const current = views.find(view => view.classList.contains('is-active'));
    const currentName = current?.dataset.view || activeView;
    if (!next || name === currentName) {
      activeView = currentName;
      return;
    }
    resetViewTransition();
    const version = transitionVersion;
    if (animate && pageStage) {
      pageStage.classList.add('is-sliding');
      slideTimer = window.setTimeout(() => {
        if (version !== transitionVersion) return;
        // Restore the resting classes before dropping the WAAPI fill effects.
        // This prevents CSS from briefly replaying the slide at cleanup time.
        views.forEach(view => view.classList.remove('is-from-left', 'is-from-right', 'is-leaving-left', 'is-leaving-right'));
        slideAnimations.forEach(animation => animation.cancel());
        slideAnimations = [];
        pageStage.classList.remove('is-sliding');
      }, 1900);
      pageStage.classList.remove('is-transitioning');
      void pageStage.offsetWidth;
      pageStage.classList.add('is-transitioning');
      document.body.classList.add('page-smoke-active');
      smokeTimer = window.setTimeout(() => {
        if (version !== transitionVersion) return;
        pageStage.classList.remove('is-transitioning');
        document.body.classList.remove('page-smoke-active');
      }, 1850);
    }
    let leaveDirection;
    let enterDirection;
    if (currentName === 'home') {
      // Hero always exits left when another header view is selected.
      leaveDirection = 'left';
      enterDirection = 'right';
    } else if (name === 'home') {
      // Hero always enters from the left when returning from another view.
      leaveDirection = 'right';
      enterDirection = 'left';
    } else {
      const isMovingForward = viewNames.indexOf(name) > viewNames.indexOf(currentName);
      leaveDirection = isMovingForward ? 'left' : 'right';
      enterDirection = isMovingForward ? 'right' : 'left';
    }
    if (current && animate) {
      current.classList.remove('is-active');
      current.classList.add(`is-leaving-${leaveDirection}`);
      current.setAttribute('aria-hidden', 'true');
    } else {
      current?.classList.remove('is-active');
      current?.setAttribute('aria-hidden', 'true');
    }
    next.classList.add('is-active');
    next.setAttribute('aria-hidden', 'false');
    if (animate && current?.animate && next.animate) {
      const currentWidth = current.getBoundingClientRect().width;
      const nextWidth = next.getBoundingClientRect().width;
      const leaveX = leaveDirection === 'left' ? -currentWidth : currentWidth;
      const enterX = enterDirection === 'left' ? -nextWidth : nextWidth;
      const slideOptions = { duration: 1850, easing: 'cubic-bezier(.22,.75,.22,1)', fill: 'both' };
      slideAnimations = [
        current.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${leaveX}px)` }], slideOptions),
        next.animate([{ transform: `translateX(${enterX}px)` }, { transform: 'translateX(0)' }], slideOptions)
      ];
    } else if (animate) {
      current?.classList.add(`is-leaving-${leaveDirection}`);
      next.classList.add(`is-from-${enterDirection}`);
      requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('is-from-left', 'is-from-right')));
    }
    activeView = name;
    if (updateHistory) {
      const hash = name === 'home' ? '#home' : name === 'evenemang' ? '#spelningar' : `#${name}`;
      history.pushState({ view: name }, '', hash);
    }
    next.scrollTop = 0;
  };

  const activateViewImmediately = name => {
    const target = views.find(view => view.dataset.view === name);
    if (!target) return;
    document.body.classList.add('no-view-transition');
    document.body.classList.remove('page-smoke-active', 'page-enter-from-left', 'page-enter-from-right', 'page-leaving-to-right', 'page-leaving-to-left');
    resetViewTransition();
    views.forEach(view => {
      const active = view === target;
      view.classList.toggle('is-active', active);
      view.setAttribute('aria-hidden', String(!active));
    });
    activeView = name;
    target.scrollTop = 0;
    void pageStage?.offsetWidth;
    document.body.classList.remove('no-view-transition');
  };

  if (views.length) {
    document.body.classList.add('page-mode');
    views.forEach(view => view.setAttribute('aria-hidden', String(!view.classList.contains('is-active'))));
    activateViewImmediately(viewFromLocation());
    const syncViewWithLocation = () => {
      activateViewImmediately(viewFromLocation());
    };
    window.addEventListener('popstate', syncViewWithLocation);
    // Returning from a standalone event page can restore this document from
    // the browser's back-forward cache. In that case the URL hash changes
    // without rerunning this script, so explicitly activate the matching view.
    window.addEventListener('hashchange', syncViewWithLocation);
    window.addEventListener('pageshow', syncViewWithLocation);
    document.addEventListener('click', event => {
      const viewLink = event.target.closest('[data-view-link]');
      if (!viewLink) return;
      event.preventDefault();
      showView(viewLink.dataset.viewLink);
      nav?.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
      document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('open');
        dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
      });
    });
  }

  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  const dropdowns = [...document.querySelectorAll('.dropdown')];
  dropdowns.forEach(dropdown => {
    const dropdownButton = dropdown.querySelector('.dropdown-toggle');
    dropdownButton?.addEventListener('click', () => {
      if (dropdown.classList.contains('events-dropdown') && !views.length) {
        window.location.assign('index.html?view=evenemang');
        return;
      }
      const open = !dropdown.classList.contains('open');
      dropdowns.forEach(other => {
        other.classList.toggle('open', other === dropdown && open);
        other.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', String(other === dropdown && open));
      });
      if (dropdown.classList.contains('events-dropdown') && views.length) showView('evenemang');
    });
  });
  document.addEventListener('click', event => {
    if (!dropdowns.some(dropdown => dropdown.contains(event.target))) {
      dropdowns.forEach(dropdown => {
        dropdown.classList.remove('open');
        dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
      });
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
    const tick = now => { const delta = Math.min(now - last, 50); last = now; if (!dragging && now > pausedUntil) { offset = (offset + delta * 0.014 + limit()) % limit(); paint(); } requestAnimationFrame(tick); };
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

