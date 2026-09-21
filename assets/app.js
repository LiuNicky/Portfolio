/* ═══════════════════════════════════════════════════════════
   Wedding Gallery — 互動與動畫（零依賴、無文字）
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var G = window.GALLERY;
  if (!G) { console.error('找不到 data.js'); return; }

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body;
  var softMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  var THUMB = function (id) { return 'photos/thumb/' + id + '.webp'; };
  var FULL  = function (id) { return 'photos/full/'  + id + '.webp'; };

  var THUMB_W = 900, FULL_LONG = 2400;

  /* full 版實際的像素寬度（直幅約 1600、橫幅 2400），srcset 要用 */
  function fullWidth(p) {
    var s = FULL_LONG / Math.max(p.w, p.h);
    return s < 1 ? Math.round(p.w * s) : p.w;
  }

  /* 每種版面在畫面上大概佔多寬 —— 瀏覽器照這個挑圖，避免放大變糊 */
  var SIZES = {
    'full': '100vw',
    'wide': '(max-width:768px) 100vw, 84vw',
    'lg-l': '(max-width:768px) 100vw, (max-width:1024px) 84vw, 59vw',
    'lg-r': '(max-width:768px) 100vw, (max-width:1024px) 84vw, 59vw',
    'md-c': '(max-width:768px) 100vw, (max-width:1024px) 67vw, 50vw',
    'sm-l': '(max-width:768px) 100vw, (max-width:1024px) 50vw, 34vw',
    'sm-r': '(max-width:768px) 100vw, (max-width:1024px) 50vw, 34vw',
    'duo' : '(max-width:768px) 100vw, 50vw',
  };

  var shots = [];     // 所有 .shot，供視差使用
  var figBy = {};     // id -> 第一個 .shot（燈箱關閉時飛回去的目標）

  /* ── 1. 首屏 ──────────────────────────────────────── */
  function buildHero() {
    var stage = $('#heroStage'), dots = $('#heroDots');
    G.hero.forEach(function (id, i) {
      var p = G.photos[id];
      var fig = document.createElement('figure');
      if (i === 0) fig.className = 'on';

      var img = document.createElement('img');
      img.src = FULL(id);
      img.alt = i === 0 && p ? p.alt : '';
      img.decoding = 'async';
      if (i > 0) img.loading = 'lazy';
      fig.appendChild(img);
      stage.appendChild(fig);

      var dot = document.createElement('i');
      if (i === 0) dot.className = 'on';
      dots.appendChild(dot);
    });
  }

  /* ── 2. 章節與照片網格 ────────────────────────────── */
  function buildChapters() {
    var wrap = $('#chapters');

    G.chapters.forEach(function (ch, ci) {
      var sec = document.createElement('section');
      sec.className = 'chapter';
      sec.id = 'ch' + (ci + 1);

      var rule = document.createElement('div');
      rule.className = 'ch-rule';
      rule.setAttribute('aria-hidden', 'true');
      rule.innerHTML = '<span></span>';
      sec.appendChild(rule);

      var grid = document.createElement('div');
      grid.className = 'gallery';

      ch.items.forEach(function (it) {
        var p = G.photos[it.id];
        if (!p) return;

        var fig = document.createElement('figure');
        fig.className = 'fig';
        fig.setAttribute('data-lay', it.lay);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shot';
        btn.style.setProperty('--ar', p.w + ' / ' + p.h);
        btn.style.backgroundImage = 'url("' + p.q + '")';
        btn.setAttribute('data-id', it.id);
        btn.setAttribute('aria-label', '放大檢視：' + p.alt);

        var img = document.createElement('img');
        var fw = fullWidth(p);
        img.src = THUMB(it.id);
        // 版面大的時候讓瀏覽器改抓 2400px 的圖，小版面維持 900px
        if (fw > THUMB_W) {
          img.srcset = THUMB(it.id) + ' ' + THUMB_W + 'w, ' + FULL(it.id) + ' ' + fw + 'w';
          img.sizes = SIZES[it.lay] || '100vw';
        }
        img.alt = p.alt;
        img.width = p.w; img.height = p.h;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', function () { img.classList.add('ready'); });
        if (img.complete) img.classList.add('ready');

        btn.appendChild(img);
        fig.appendChild(btn);
        grid.appendChild(fig);

        shots.push({ el: btn, img: img, lay: it.lay, vis: false });
        if (!figBy[it.id]) figBy[it.id] = btn;
      });

      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
  }

  /* ── 3. 右側章節指示／導覽 ────────────────────────── */
  var railSegs = [];
  function buildRail() {
    var rail = $('#rail');
    G.chapters.forEach(function (ch, ci) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rail-seg';
      b.setAttribute('aria-label', '第 ' + (ci + 1) + ' 章');
      b.innerHTML = '<i></i>';
      b.addEventListener('click', function () {
        var sec = document.getElementById('ch' + (ci + 1));
        if (!sec) return;
        window.scrollTo({
          top: sec.getBoundingClientRect().top + window.scrollY - 10,
          behavior: softMotion ? 'auto' : 'smooth',
        });
      });
      rail.appendChild(b);
      railSegs.push({ btn: b, fill: b.firstChild, id: 'ch' + (ci + 1) });
    });
  }

  /* ── 4. 載入畫面 ──────────────────────────────────── */
  function preload() {
    var list = G.hero.map(FULL).concat(G.order.slice(0, 5).map(THUMB));
    var done = 0, total = list.length, finished = false;
    var fillEl = $('#loaderFill');

    function tick() {
      done++;
      if (fillEl) fillEl.style.width = Math.min(100, Math.round(done / total * 100)) + '%';
      if (done >= total) finish();
    }

    function finish() {
      if (finished) return;
      finished = true;
      if (fillEl) fillEl.style.width = '100%';
      setTimeout(function () {
        body.classList.remove('is-loading');
        body.classList.add('loaded');
        startHero();
      }, 420);
    }

    list.forEach(function (src) {
      var im = new Image();
      im.onload = im.onerror = tick;
      im.src = src;
    });

    setTimeout(finish, 6000);   // 保險：網路異常也要進場
  }

  /* ── 5. 首屏輪播 ──────────────────────────────────── */
  function startHero() {
    var figs = $$('#heroStage figure'), dots = $$('#heroDots i');
    if (figs.length < 2 || softMotion) return;
    var i = 0;
    setInterval(function () {
      if (document.hidden) return;
      figs[i].classList.remove('on');
      if (dots[i]) dots[i].classList.remove('on');
      i = (i + 1) % figs.length;
      var im = figs[i].querySelector('img');
      im.style.animation = 'none';
      void im.offsetWidth;              // 重播 Ken Burns
      im.style.animation = '';
      figs[i].classList.add('on');
      if (dots[i]) dots[i].classList.add('on');
    }, 6200);
  }

  /* ── 6. 進場揭示 ──────────────────────────────────── */
  function observeReveal() {
    var figObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); figObs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    $$('.fig').forEach(function (f) { figObs.observe(f); });

    var secObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); secObs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.05 });
    $$('.chapter').forEach(function (s) { secObs.observe(s); });

    // 只對可視範圍內的照片算視差
    var visObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        for (var i = 0; i < shots.length; i++) {
          if (shots[i].el === e.target) { shots[i].vis = e.isIntersecting; break; }
        }
      });
    }, { rootMargin: '25% 0px 25% 0px' });
    shots.forEach(function (s) { visObs.observe(s.el); });
  }

  /* ── 7. 滾動：視差與章節進度 ──────────────────────── */
  function scrollFx() {
    var vh = window.innerHeight, ticking = false;
    var AMP = { full: 34, wide: 30, 'lg-l': 26, 'lg-r': 26, 'md-c': 22, duo: 18, 'sm-l': 14, 'sm-r': 14 };

    function frame() {
      ticking = false;

      if (!softMotion) {
        for (var i = 0; i < shots.length; i++) {
          var s = shots[i];
          if (!s.vis) continue;
          var r = s.el.getBoundingClientRect();
          var p = ((r.top + r.height / 2) - vh / 2) / vh;      // 約 -1 .. 1
          s.img.style.setProperty('--py', (p * (AMP[s.lay] || 20)).toFixed(1) + 'px');
        }
      }

      // 每個章節各自的閱讀進度
      for (var j = 0; j < railSegs.length; j++) {
        var sec = document.getElementById(railSegs[j].id);
        if (!sec) continue;
        var b = sec.getBoundingClientRect();
        var pct = b.height ? (vh * 0.5 - b.top) / b.height * 100 : 0;
        railSegs[j].fill.style.height = Math.max(0, Math.min(100, pct)) + '%';
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    window.addEventListener('resize', function () { vh = window.innerHeight; frame(); }, { passive: true });
    frame();
  }

  /* ── 8. 自訂游標 ──────────────────────────────────── */
  function cursorFx() {
    if (!finePointer || softMotion) return;
    var c = $('#cursor'), ring = $('#cursorRing'), dot = $('#cursorDot');
    if (!c) return;

    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf, live = false;

    window.addEventListener('mousemove', function (e) {
      if (!live) {                      // 等滑鼠真的動了才接手游標
        live = true;
        rx = e.clientX; ry = e.clientY;
        body.classList.add('has-cursor');
        c.classList.add('live');
      }
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      raf = (Math.abs(mx - rx) > 0.4 || Math.abs(my - ry) > 0.4) ? requestAnimationFrame(loop) : null;
    }

    document.addEventListener('mouseover', function (e) {
      var img = !!e.target.closest('.shot');
      c.classList.toggle('on-img', img);
      c.classList.toggle('on-link', !img && !!e.target.closest('a,button'));
    });
    document.addEventListener('mouseleave', function () { c.classList.remove('live'); });
    document.addEventListener('mouseenter', function () { if (live) c.classList.add('live'); });
  }

  /* ── 9. 燈箱 ──────────────────────────────────────── */
  function lightbox() {
    var lb = $('#lightbox'), img = $('#lbImg'), film = $('#lbFilm');
    var order = G.order, idx = 0, open = false, lastFocus = null, token = 0;

    order.forEach(function (id, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 張');
      var t = document.createElement('img');
      t.src = G.photos[id].q;          // 先用模糊佔位，開燈箱時才換縮圖
      t.alt = '';
      t.loading = 'lazy';
      b.appendChild(t);
      b.addEventListener('click', function () { go(i, i > idx ? 1 : -1); });
      film.appendChild(b);
    });
    var filmBtns = $$('button', film);
    var filmLoaded = false;
    function loadFilm() {
      if (filmLoaded) return;
      filmLoaded = true;
      filmBtns.forEach(function (b, i) { b.firstChild.src = THUMB(order[i]); });
    }

    function paint() {
      var id = order[idx], p = G.photos[id];
      var my = ++token;

      img.alt = p.alt;
      img.src = THUMB(id);             // 縮圖多半已快取，先顯示
      var big = new Image();
      big.onload = function () { if (my === token) img.src = FULL(id); };
      big.src = FULL(id);

      filmBtns.forEach(function (b, i) { b.classList.toggle('on', i === idx); });
      var act = filmBtns[idx];
      if (act) {
        var fr = film.getBoundingClientRect(), ar = act.getBoundingClientRect();
        film.scrollLeft += (ar.left + ar.width / 2) - (fr.left + fr.width / 2);
      }

      [idx - 1, idx + 1].forEach(function (n) {    // 預載左右鄰居
        if (n >= 0 && n < order.length) { var pre = new Image(); pre.src = FULL(order[n]); }
      });
    }

    function go(n, dir) {
      if (n === idx) return;
      idx = (n + order.length) % order.length;
      if (softMotion) { paint(); return; }
      lb.classList.add(dir > 0 ? 'slide-l' : 'slide-r');
      setTimeout(function () {
        paint();
        lb.classList.remove('slide-l', 'slide-r');
      }, 190);
    }

    // 圖片是 object-fit:contain，元素框比圖片大；這裡算出「看得見的那塊」
    function visibleRect() {
      var box = img.getBoundingClientRect();
      var p = G.photos[order[idx]];
      var ratio = p ? p.r : (img.naturalWidth / img.naturalHeight);
      if (!ratio || !box.width || !box.height) return box;
      var w = box.width, h = w / ratio;
      if (h > box.height) { h = box.height; w = h * ratio; }
      return {
        left: box.left + (box.width - w) / 2,
        top:  box.top  + (box.height - h) / 2,
        width: w, height: h,
      };
    }

    function flip(from, reverse) {
      var to = visibleRect();
      if (!to.width || !to.height) return;
      var sx = from.width / to.width, sy = from.height / to.height;
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      var t = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';

      if (!reverse) {
        img.style.transition = 'none';
        img.style.transform = t;
        requestAnimationFrame(function () {
          img.style.transition = 'transform .6s cubic-bezier(.22,.61,.36,1), opacity .4s ease';
          img.style.transform = '';
        });
      } else {
        img.style.transition = 'transform .45s cubic-bezier(.4,0,.6,1), opacity .4s ease .05s';
        img.style.transform = t;
        img.style.opacity = '0';
      }
    }

    function openAt(id, fromEl) {
      idx = order.indexOf(id);
      if (idx < 0) idx = 0;
      lastFocus = document.activeElement;
      open = true;
      body.classList.add('lb-open');
      lb.hidden = false;
      paint();
      loadFilm();

      var from = fromEl ? fromEl.getBoundingClientRect() : null;
      requestAnimationFrame(function () {
        lb.classList.add('on', 'ready');
        if (from && !softMotion) flip(from, false);
      });
      $('.lb-close', lb).focus({ preventScroll: true });
    }

    function close() {
      if (!open) return;
      open = false; token++;
      var back = figBy[order[idx]];
      var r = back ? back.getBoundingClientRect() : null;
      var onScreen = r && r.bottom > 0 && r.top < innerHeight;

      if (onScreen && !softMotion) flip(r, true);
      lb.classList.remove('on', 'ready');

      setTimeout(function () {
        lb.hidden = true;
        body.classList.remove('lb-open');
        img.removeAttribute('src');
        img.style.cssText = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }, softMotion ? 0 : 440);
    }

    document.addEventListener('click', function (e) {
      var s = e.target.closest('.shot');
      if (s) { e.preventDefault(); openAt(s.getAttribute('data-id'), s); }
    });

    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev',  lb).addEventListener('click', function () { go(idx - 1, -1); });
    $('.lb-next',  lb).addEventListener('click', function () { go(idx + 1,  1); });
    $('.lb-backdrop', lb).addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(idx - 1, -1);
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(idx + 1, 1); }
      else if (e.key === 'Home') go(0, -1);
      else if (e.key === 'End') go(order.length - 1, 1);
      else if (e.key === 'Tab') keepFocus(e);
    });

    function keepFocus(e) {
      var f = $$('button', lb).filter(function (b) { return b.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    // 觸控：左右滑切換、下滑關閉
    var tx = 0, ty = 0, moved = false;
    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      tx = e.touches[0].clientX; ty = e.touches[0].clientY; moved = false;
    }, { passive: true });
    lb.addEventListener('touchmove', function () { moved = true; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (!moved || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? idx + 1 : idx - 1, dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.4) close();
    }, { passive: true });

    // 滾輪切換（桌機）
    var wheelLock = 0;
    lb.addEventListener('wheel', function (e) {
      if (!open) return;
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      var t = Date.now();
      if (Math.abs(d) < 24 || t - wheelLock < 420) return;
      wheelLock = t;
      go(d > 0 ? idx + 1 : idx - 1, d > 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ── 10. 回到開始 ─────────────────────────────────── */
  function misc() {
    var bt = $('#backTop');
    if (bt) bt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: softMotion ? 'auto' : 'smooth' });
    });
  }

  /* ── 啟動 ─────────────────────────────────────────── */
  buildHero();
  buildChapters();
  buildRail();
  observeReveal();
  scrollFx();
  cursorFx();
  lightbox();
  misc();
  preload();
})();
