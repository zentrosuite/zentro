/* ==========================================================================
   Zentro — brand site behaviour
   No dependencies. Every block is progressive enhancement: with JavaScript
   off the page still reads, navigates and submits.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── theme ───────────────────────────────────────────────────────────────
     A stored choice always wins. We follow the OS only while the visitor has
     never chosen one — otherwise changing the system theme would silently
     undo an explicit click.                                                  */
  var themeBtns = $$('[data-theme-toggle]');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function setTheme(mode, remember) {
    root.dataset.theme = mode;
    if (remember) { try { localStorage.setItem('zentro-theme', mode); } catch (e) {} }
    themeBtns.forEach(function (b) {
      b.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
    var meta = $('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', mode === 'dark' ? '#05070F' : '#FFFFFF'); }
  }

  themeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  });
  mq.addEventListener('change', function (e) {
    var stored = null;
    try { stored = localStorage.getItem('zentro-theme'); } catch (err) {}
    if (!stored) { setTheme(e.matches ? 'dark' : 'light', false); }
  });
  setTheme(root.dataset.theme || 'light', false);

  /* ── scroll: progress bar, sticky header state, back-to-top ────────────── */
  var bar = $('.progress');
  var hdr = $('.hdr');
  var top = $('.totop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) { bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')'; }
    if (hdr) {
      if (y > 6) { hdr.setAttribute('data-stuck', ''); } else { hdr.removeAttribute('data-stuck'); }
    }
    if (top) {
      if (y > 700) { top.setAttribute('data-show', ''); } else { top.removeAttribute('data-show'); }
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (top) {
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
    });
  }

  /* ── mega menu ───────────────────────────────────────────────────────────
     Hover opens it on a pointer, click works on touch and for the keyboard,
     and Escape always closes it and returns focus to the trigger.            */
  $$('[data-mega]').forEach(function (mega) {
    var btn = $('.mega__btn', mega);
    var timer;

    function open(state) {
      clearTimeout(timer);
      mega.setAttribute('aria-expanded', String(state));
      btn.setAttribute('aria-expanded', String(state));
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      open(mega.getAttribute('aria-expanded') !== 'true');
    });
    mega.addEventListener('mouseenter', function () { open(true); });
    // A small grace period stops the menu snapping shut on the gap between
    // the trigger and the panel.
    mega.addEventListener('mouseleave', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { open(false); }, 140);
    });
    mega.addEventListener('focusout', function (e) {
      if (!mega.contains(e.relatedTarget)) { open(false); }
    });
    document.addEventListener('click', function (e) {
      if (!mega.contains(e.target)) { open(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mega.getAttribute('aria-expanded') === 'true') {
        open(false); btn.focus();
      }
    });
  });

  /* ── mobile drawer ─────────────────────────────────────────────────────── */
  var burger = $('#burger');
  var drawer = $('#drawer');
  if (burger && drawer) {
    var setDrawer = function (state) {
      if (state) {
        // Measured rather than assumed: the announcement bar sits above the
        // header, so its offset differs at scroll 0 and once the header sticks.
        if (hdr) { drawer.style.top = Math.round(hdr.getBoundingClientRect().bottom) + 'px'; }
        drawer.setAttribute('data-open', '');
      } else { drawer.removeAttribute('data-open'); }
      burger.setAttribute('aria-expanded', String(state));
      if (state) { document.body.setAttribute('data-lock', ''); }
      else { document.body.removeAttribute('data-lock'); }
    };
    burger.addEventListener('click', function () {
      setDrawer(!drawer.hasAttribute('data-open'));
    });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) { setDrawer(false); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.hasAttribute('data-open')) { setDrawer(false); burger.focus(); }
    });
    // Rotating the phone to landscape can cross the breakpoint that hides the
    // drawer — release the scroll lock rather than trapping the page.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 940 && drawer.hasAttribute('data-open')) { setDrawer(false); }
    });
  }

  /* ── scroll reveal ──────────────────────────────────────────────────────
     One observer for both plain reveals and staggered groups; children of a
     group get their index stamped so CSS can space them out.                 */
  var revealables = $$('[data-reveal],[data-stagger]');

  $$('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  if (!('IntersectionObserver' in window) || reduced.matches) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ── animated counters ───────────────────────────────────────────────────
     Counts once, when the number first scrolls into view. The markup already
     holds the final value, so this only ever animates towards what is there. */
  function runCount(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) { return; }
    var dp = parseInt(el.dataset.decimals || '0', 10);
    var pre = el.dataset.prefix || '';
    var suf = el.dataset.suffix || '';
    var dur = 1500;
    var t0;

    function frame(now) {
      if (!t0) { t0 = now; }
      var p = Math.min((now - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);          // quart-out: fast, then settles
      el.textContent = pre + (target * eased).toFixed(dp) + suf;
      if (p < 1) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  }

  var counters = $$('[data-count]');
  if (counters.length) {
    if (!('IntersectionObserver' in window) || reduced.matches) {
      counters.forEach(function (el) {
        el.textContent = (el.dataset.prefix || '') +
          parseFloat(el.dataset.count).toFixed(parseInt(el.dataset.decimals || '0', 10)) +
          (el.dataset.suffix || '');
      });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) { return; }
          runCount(e.target);
          cio.unobserve(e.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ── product filter ─────────────────────────────────────────────────────
     Filtering is a plain hidden toggle so the cards keep their DOM order and
     stay reachable by find-in-page when "All" is showing.                    */
  var filters = $$('.filter');
  var appCards = $$('[data-cat]');
  var liveRegion = $('#filter-status');

  if (filters.length && appCards.length) {
    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        var cat = f.dataset.filter;
        filters.forEach(function (o) { o.setAttribute('aria-pressed', String(o === f)); });

        var shown = 0;
        appCards.forEach(function (card) {
          var match = cat === 'all' || card.dataset.cat === cat;
          card.hidden = !match;
          if (match) { shown++; }
        });
        if (liveRegion) {
          liveRegion.textContent = shown + (shown === 1 ? ' app' : ' apps') + ' shown';
        }
      });
    });
  }

  /* ── cursor spotlight on cards ──────────────────────────────────────────
     Pointer-only: a touch device has no hover, and running this on scroll
     momentum would just burn frames.                                        */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced.matches) {
    $$('.app').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ── marquee ────────────────────────────────────────────────────────────
     The row is duplicated so the -100% translate lands exactly where it
     started; the clone is hidden from assistive tech.                        */
  $$('.marquee').forEach(function (m) {
    var row = $('.marquee__row', m);
    if (!row) { return; }
    var clone = row.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    m.appendChild(clone);
  });

  /* ── FAQ: one answer at a time ─────────────────────────────────────────── */
  var answers = $$('.faq details');
  answers.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) { return; }
      answers.forEach(function (other) { if (other !== d) { other.open = false; } });
    });
  });

  /* ── scrollspy ──────────────────────────────────────────────────────────
     Marks the nav link for whichever section is currently in the upper half
     of the viewport.                                                         */
  var spyLinks = $$('.nav__link[data-spy]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var sections = spyLinks
      .map(function (l) { return document.getElementById(l.dataset.spy); })
      .filter(Boolean);

    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        spyLinks.forEach(function (l) {
          if (l.dataset.spy === e.target.id) { l.setAttribute('aria-current', 'true'); }
          else if (l.getAttribute('aria-current') === 'true') { l.removeAttribute('aria-current'); }
        });
      });
    }, { rootMargin: '-18% 0px -62% 0px' });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* ── contact form ───────────────────────────────────────────────────────
     Posts to Formspree on its own with JavaScript off. This only avoids
     navigating the visitor away from the page.                               */
  var form = $('#contact-form');
  if (form) {
    var status = $('#form-status');
    var submit = $('#form-submit');
    var original = submit ? submit.textContent : 'Send';

    form.addEventListener('submit', function (e) {
      if (!window.fetch || !form.reportValidity()) { return; }
      e.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Sending…';
      status.textContent = '';
      status.removeAttribute('data-state');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      }).then(function (res) {
        if (!res.ok) { throw new Error('rejected'); }
        form.reset();
        status.textContent = 'Thanks — that reached us. We will reply to your email.';
        status.setAttribute('data-state', 'ok');
      }).catch(function () {
        status.textContent = 'That did not send. Email hello@zentro.example and we will pick it up.';
        status.setAttribute('data-state', 'err');
      }).then(function () {
        submit.disabled = false;
        submit.textContent = original;
      });
    });
  }

  /* ── year stamp ─────────────────────────────────────────────────────────── */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
