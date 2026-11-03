/* site-alto-padrao · movimento.js
   Biblioteca de movimento testada para sites estáticos. Sem build. Usa GSAP 3.15 (+ ScrollTrigger, SplitText)
   e, opcionalmente, Lenis 1.3, carregados por <script> antes deste arquivo. Se o GSAP não carregar,
   tudo continua visível e as cenas viram versões estáticas.

   No <head>:
     <html lang="pt-BR" class="no-js">
     <script>document.documentElement.classList.replace('no-js','js');
       if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('reduce');</script>
   Antes de </body>:
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js"></script>
     <script src="https://cdn.jsdelivr.net/npm/lenis@1.3.24/dist/lenis.min.js"></script>   (só nível 2 e 3)
     <script src="assets/movimento.js"></script>
     <script>Movimento.init({ smooth: true });</script>

   Atributos (veja references/05-movimento-e-efeitos.md para o catálogo com exemplos):
     data-reveal              filhos diretos entram em cascata quando a seção chega
     data-reveal-self         o próprio elemento entra
     data-split="lines|words|chars"  título que sobe por máscara (data-split-now no hero: entra ao carregar)
     data-reveal-img          imagem abre por máscara de baixo para cima
     data-parallax="0.12"     imagem desliza dentro da moldura (0.05 a 0.2)
     data-count-to="312"      número que conta uma vez (data-count-decimals, data-count-prefix, data-count-suffix)
     data-magnetic            botão acompanha o cursor (só desktop)
     data-nav-hide            barra some ao descer e volta ao subir
     data-menu-toggle="id"    botão que abre o painel de menu com aquele id
     data-wa-float            botão flutuante que aparece depois do hero e some perto do contato
     data-hero / data-contact marcam o hero e a seção de contato para o flutuante
     data-open-now            selo aberto/fechado (data-hours JSON, ver initOpenNow)
     data-scene="zoom|horizontal|scrub-text"  cenas de scroll presas (nível 2)
     data-scroll-video        vídeo controlado pelo scroll (nível 3)
*/
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = root.classList.contains('reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  var hasSplit = hasGsap && typeof window.SplitText !== 'undefined';
  var EXPO = 'expo.out';
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function init(opts) {
    opts = opts || {};
    if (reduce) root.classList.add('reduce');
    if (!hasGsap || !hasST) { root.classList.add('reduce'); }
    else { gsap.registerPlugin(ScrollTrigger); if (hasSplit) gsap.registerPlugin(SplitText); }

    // Peças que não dependem de GSAP
    initMenu(); initNavHide(); initWaFloat(); initOpenNow(); initFaqClose();

    if (reduce || !hasGsap || !hasST) { initStaticScenes(); initScrollVideo(true); return; }

    if (opts.smooth) initLenis();
    initReveal(); initSplit(); initImageReveal(); initParallax(); initCounters(); initMagnetic();
    initZoomScenes(); initHorizontalScenes(); initScrubText(); initScrollVideo(false);

    // Recalcula depois das fontes e imagens (evita gatilhos no lugar errado)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Lenis (scroll suave) ---------- */
  function initLenis() {
    if (typeof window.Lenis === 'undefined') return;
    var lenis = new Lenis({ lerp: 0.1, anchors: true, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    if (!window.Stage) window.Stage = { lenis: lenis }; // o scenes.mjs da taste-skill rola pelo Lenis quando existe
  }

  /* ---------- Entradas em cascata ---------- */
  function initReveal() {
    $$('[data-reveal]').forEach(function (el) {
      var kids = el.children.length ? Array.prototype.slice.call(el.children) : [el];
      gsap.from(kids, { y: 28, autoAlpha: 0, duration: 0.9, ease: EXPO, stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-reveal-self]').forEach(function (el) {
      gsap.from(el, { y: 28, autoAlpha: 0, duration: 0.9, ease: EXPO,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  /* ---------- Título que sobe por máscara ---------- */
  function initSplit() {
    if (!hasSplit) return;
    var go = function () {
      $$('[data-split]').forEach(function (el) {
        var type = el.getAttribute('data-split') || 'lines';
        var now = el.hasAttribute('data-split-now');
        SplitText.create(el, {
          type: type === 'chars' ? 'lines,chars' : type === 'words' ? 'lines,words' : 'lines',
          mask: 'lines', autoSplit: true, aria: 'auto',
          onSplit: function (self) {
            // Folga na máscara para acentos (Í, Ã, Ê) e cedilha (Ç) não serem cortados com entrelinha apertada.
            // A margem negativa compensa, então o layout não muda.
            (self.masks || []).forEach(function (m) { m.style.paddingBlock = '0.2em'; m.style.marginBlock = '-0.2em'; });
            var parts = type === 'chars' ? self.chars : type === 'words' ? self.words : self.lines;
            var stagger = type === 'chars' ? 0.025 : type === 'words' ? 0.05 : 0.09;
            // No hero o título termina em menos de 1,2 s (o inspetor reprova título tardio)
            var vars = { yPercent: 110, duration: now ? 0.85 : 1, ease: EXPO, stagger: stagger };
            if (!now) vars.scrollTrigger = { trigger: el, start: 'top 88%', once: true };
            return gsap.from(parts, vars);
          }
        });
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  }

  /* ---------- Imagem que abre por máscara ---------- */
  function initImageReveal() {
    $$('[data-reveal-img]').forEach(function (el) {
      var media = el.querySelector('img,video');
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' });
      if (media) tl.from(media, { scale: 1.18, duration: 1.6, ease: EXPO }, 0);
    });
  }

  /* ---------- Paralaxe dentro da moldura ---------- */
  function initParallax() {
    $$('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-parallax')) || 0.12;
      var frame = el.parentElement;
      gsap.set(el, { scale: 1 + amt * 2 });
      gsap.fromTo(el, { yPercent: -amt * 50 }, { yPercent: amt * 50, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- Contadores ---------- */
  function initCounters() {
    $$('[data-count-to]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count-to'));
      var dec = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
      var pre = el.getAttribute('data-count-prefix') || '';
      var suf = el.getAttribute('data-count-suffix') || '';
      var fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      var obj = { v: 0 };
      el.textContent = pre + fmt.format(0) + suf;
      gsap.to(obj, { v: to, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = pre + fmt.format(obj.v) + suf; } });
    });
  }

  /* ---------- Botão magnético ---------- */
  function initMagnetic() {
    if (!finePointer) return;
    $$('[data-magnetic]').forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnetic')) || 0.3;
      var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo(Math.max(-12, Math.min(12, (e.clientX - r.left - r.width / 2) * strength)));
        yTo(Math.max(-10, Math.min(10, (e.clientY - r.top - r.height / 2) * strength)));
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
      el.addEventListener('pointerdown', function () { gsap.to(el, { scale: 0.97, duration: 0.12 }); });
      el.addEventListener('pointerup', function () { gsap.to(el, { scale: 1, duration: 0.3, ease: 'power3.out' }); });
    });
  }

  /* ---------- Navegação que some ao descer ---------- */
  function initNavHide() {
    var nav = document.querySelector('[data-nav-hide]');
    if (!nav) return;
    var last = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        nav.classList.toggle('is-scrolled', y > 24);
        if (!document.documentElement.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > last && y > 160);
        last = y; ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Menu do celular ---------- */
  function initMenu() {
    $$('[data-menu-toggle]').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('data-menu-toggle'));
      if (!panel) return;
      btn.setAttribute('aria-controls', panel.id); btn.setAttribute('aria-expanded', 'false');
      function set(open) {
        btn.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
        root.classList.toggle('menu-open', open);
        if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
        if (open) { var f = panel.querySelector('a,button'); if (f) f.focus(); } else btn.focus();
      }
      btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
      panel.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) set(false); });
    });
  }

  /* ---------- WhatsApp flutuante ---------- */
  function initWaFloat() {
    var fab = document.querySelector('[data-wa-float]');
    if (!fab || !('IntersectionObserver' in window)) { if (fab) fab.classList.add('is-visible'); return; }
    var hero = document.querySelector('[data-hero]');
    var contact = document.querySelector('[data-contact]');
    var heroVisible = !!hero, contactVisible = false;
    function update() { fab.classList.toggle('is-visible', !heroVisible && !contactVisible); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target === hero) heroVisible = en.isIntersecting;
        if (en.target === contact) contactVisible = en.isIntersecting;
      });
      update();
    }, { threshold: 0.15 });
    if (hero) io.observe(hero); if (contact) io.observe(contact);
    update();
  }

  /* ---------- Aberto agora ----------
     <p data-open-now data-hours='{"1":["09:00","20:00"],"2":["09:00","20:00"],"3":["09:00","20:00"],
        "4":["09:00","20:00"],"5":["09:00","20:00"],"6":["08:00","17:00"],"0":null}'>Seg a sex 9h às 20h, sáb 8h às 17h</p>
     Dias: 0 domingo ... 6 sábado. Sem script fica o texto do horário. */
  function initOpenNow() {
    $$('[data-open-now]').forEach(function (el) {
      var hours; try { hours = JSON.parse(el.getAttribute('data-hours')); } catch (e) { return; }
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var map = {}; parts.forEach(function (p) { map[p.type] = p.value; });
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(map.weekday);
      var now = (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10);
      var toMin = function (s) { var a = s.split(':'); return +a[0] * 60 + +a[1]; };
      var fmt = function (s) { var a = s.split(':'); return +a[0] + 'h' + (a[1] !== '00' ? a[1] : ''); };
      var names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      var today = hours[String(day)];
      if (today && now >= toMin(today[0]) && now < toMin(today[1])) {
        el.textContent = 'Aberto agora, fecha às ' + fmt(today[1]); el.setAttribute('data-state', 'open'); return;
      }
      if (today && now < toMin(today[0])) { el.textContent = 'Fechado, abre hoje às ' + fmt(today[0]); el.setAttribute('data-state', 'closed'); return; }
      for (var i = 1; i <= 7; i++) {
        var d = (day + i) % 7, h = hours[String(d)];
        if (h) { el.textContent = 'Fechado, abre ' + (i === 1 ? 'amanhã' : names[d]) + ' às ' + fmt(h[0]); el.setAttribute('data-state', 'closed'); return; }
      }
    });
  }

  /* ---------- FAQ: fecha os outros ao abrir um (opcional: data-faq-single no container) ---------- */
  function initFaqClose() {
    $$('[data-faq-single]').forEach(function (box) {
      box.addEventListener('toggle', function (e) {
        if (e.target.open) $$('details', box).forEach(function (d) { if (d !== e.target) d.open = false; });
      }, true);
    });
  }

  /* ---------- Cena: imagem que cresce de janela até a tela cheia ----------
     <section class="scene scene-zoom" data-scene="zoom" data-window="0.36" aria-label="...">
       <div class="scene-zoom__stage">
         <div class="scene-zoom__frame"><img src="..." alt="..." width="2400" height="1350"></div>
         <div class="scene-zoom__caption" data-scene-caption>...</div>
       </div>
     </section> */
  function initZoomScenes() {
    $$('[data-scene="zoom"]').forEach(function (sec) {
      var stage = sec.querySelector('.scene-zoom__stage');
      var frame = sec.querySelector('.scene-zoom__frame');
      var media = frame && frame.querySelector('img,video');
      var cap = sec.querySelector('[data-scene-caption]');
      var w = parseFloat(sec.getAttribute('data-window')) || 0.36; // largura da janela inicial (fração da tela)
      if (!stage || !frame) return;
      sec.classList.add('is-live');
      var inset = function () {
        var vw = stage.clientWidth, vh = stage.clientHeight;
        var fw = Math.min(vw * w * (vw < 760 ? 2 : 1), vw - 32), fh = Math.min(fw * 1.25, vh * 0.7);
        var x = (vw - fw) / 2 / vw * 100, y = (vh - fh) / 2 / vh * 100;
        return 'inset(' + y + '% ' + x + '% ' + y + '% ' + x + '%)';
      };
      var tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: '+=150%', pin: stage, scrub: true, invalidateOnRefresh: true } });
      tl.fromTo(frame, { clipPath: inset }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 1 }, 0);
      if (media) tl.fromTo(media, { scale: 1.25 }, { scale: 1, ease: 'none', duration: 1 }, 0);
      if (cap) tl.fromTo(cap, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.7);
    });
  }

  /* ---------- Cena: galeria horizontal presa ----------
     <section class="scene scene-h" data-scene="horizontal" aria-label="..."><div class="scene-h__track"> ...itens... </div></section> */
  function initHorizontalScenes() {
    var narrow = matchMedia('(max-width: 900px)').matches;
    $$('[data-scene="horizontal"]').forEach(function (sec) {
      var track = sec.querySelector('.scene-h__track');
      if (!track) return;
      // Telas estreitas: a galeria vira grade empilhada (fila cortada na borda parece defeito no celular)
      if (narrow) { sec.classList.add('scene-h--stack', 'is-rest'); return; }
      sec.classList.add('is-live');
      var dist = function () { return Math.max(0, track.scrollWidth - sec.clientWidth); };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
    });
  }

  /* ---------- Cena: texto que se preenche com o scroll ---------- */
  function initScrubText() {
    $$('[data-scene="scrub-text"]').forEach(function (el) {
      var target = el.querySelector('[data-scrub-target]') || el;
      el.classList.add('is-live');
      if (!target.querySelector('.word')) {
        target.innerHTML = target.textContent.trim().split(/\s+/).map(function (w) { return '<span class="word">' + w + '</span>'; }).join(' ');
      }
      var ink = getComputedStyle(target).getPropertyValue('--ink').trim() || getComputedStyle(document.body).color;
      gsap.to($$('.word', target), { color: ink, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: target, start: 'top 80%', end: 'bottom 40%', scrub: true } });
    });
  }

  function initStaticScenes() {
    // Sem animação: as cenas ficam como seções normais (o CSS cuida do layout estático)
    $$('[data-scene="horizontal"]').forEach(function (s) { s.classList.add('scene-h--stack'); });
    $$('[data-scene], [data-scroll-video]').forEach(function (s) { s.classList.add('is-rest'); });
    $$('[data-scene="scrub-text"] .word').forEach(function (w) { w.style.color = 'inherit'; });
  }

  /* ---------- Vídeo controlado pelo scroll (nível 3) ----------
     <section class="scene scroll-video" data-scene="scroll-video" data-scroll-video data-src="assets/hero-scrub.mp4" data-length="500" aria-label="...">
       <div class="scroll-video__stage">
         <img class="scroll-video__poster" src="assets/hero-poster.webp" alt="..." width="1920" height="1080" fetchpriority="high">
         <video muted playsinline preload="none" aria-hidden="true"></video>
         <p class="scroll-video__progress" aria-hidden="true">Carregando 0%</p>
         <div class="scroll-video__beat" data-at="0.05-0.30">...texto...</div>
       </div>
     </section>
     O arquivo PRECISA ser reencodado com todo quadro como keyframe (references/06-cinema-de-scroll.md).
     data-length = altura da seção em vh (padrão 500). No celular (<760px) ou com economia de dados,
     o vídeo não baixa: fica o pôster e os textos continuam entrando pelo scroll. */
  function initScrollVideo(staticOnly) {
    $$('[data-scroll-video]').forEach(function (sec) {
      var stage = sec.querySelector('.scroll-video__stage');
      var video = sec.querySelector('video');
      var label = sec.querySelector('.scroll-video__progress');
      var beats = $$('.scroll-video__beat', sec).map(function (b) {
        var r = (b.getAttribute('data-at') || '0-1').split('-').map(parseFloat); return { el: b, a: r[0], b: r[1] };
      });
      if (staticOnly) { if (label) label.hidden = true; return; }
      sec.style.height = (parseFloat(sec.getAttribute('data-length')) || 500) + 'vh';
      sec.classList.add('is-live');
      var small = matchMedia('(max-width: 760px)').matches || (navigator.connection && navigator.connection.saveData);
      var duration = 0, ready = false, target = 0, shown = 0, raf = 0, seeking = false;

      function progress() {
        var r = sec.getBoundingClientRect();
        var total = sec.offsetHeight - window.innerHeight;
        return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      }
      function beatsAt(p) {
        beats.forEach(function (bt) {
          var span = bt.b - bt.a, fade = Math.min(0.04, span / 4), o;
          if (p < bt.a || p > bt.b) o = 0;
          else if (p < bt.a + fade) o = (p - bt.a) / fade;
          else if (p > bt.b - fade) o = (bt.b - p) / fade;
          else o = 1;
          if (bt._o !== o) { bt._o = o; bt.el.style.opacity = o; bt.el.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)'; }
        });
      }
      function tick() {
        raf = 0;
        var p = progress();
        beatsAt(p);
        if (ready && duration) {
          target = p * duration;
          shown += (target - shown) * 0.18;                  // suaviza a rodinha do mouse
          if (Math.abs(target - shown) < 0.001) shown = target;
          if (!seeking && Math.abs(video.currentTime - shown) > 0.01) { seeking = true; video.currentTime = shown; }
          if (Math.abs(target - shown) > 0.0005) schedule(); // continua só enquanto há diferença (o laço descansa)
        }
      }
      function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      if (document.hidden !== undefined) document.addEventListener('visibilitychange', schedule);
      schedule();

      if (small || !video) { if (label) label.hidden = true; return; }
      video.addEventListener('seeked', function () { seeking = false; schedule(); });
      function markReady() {
        if (ready) return; ready = true; duration = video.duration || 0; shown = progress() * duration;
        sec.classList.add('is-ready'); schedule();
      }
      // Lê o estado atual E escuta o evento (em servidor local o evento pode disparar antes do ouvinte)
      function check() { if (video.readyState >= 2 && video.duration) markReady(); }
      video.addEventListener('loadeddata', check);
      video.addEventListener('canplay', check);
      var src = sec.getAttribute('data-src');
      fetch(src).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var len = +res.headers.get('content-length') || 0;
        if (!res.body || !len) return res.blob();
        var reader = res.body.getReader(), got = 0, chunks = [];
        return (function pump() {
          return reader.read().then(function (r) {
            if (r.done) return new Blob(chunks, { type: 'video/mp4' });
            chunks.push(r.value); got += r.value.length;
            if (label) label.textContent = 'Carregando ' + Math.round(got / len * 100) + '%';
            return pump();
          });
        })();
      }).then(function (blob) {
        video.src = URL.createObjectURL(blob); video.load(); check();
      }).catch(function () { if (label) label.hidden = true; /* fica o pôster: a página continua completa */ });
    });
  }

  window.Movimento = { init: init };
})();
