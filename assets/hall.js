/* Hall de Bikes: a fileira do showroom, o palco e as bolhas de ficha.
   O 3D (three.js) mora em hall3d.js e só é importado quando o hall chega perto da tela. */
import { BIKES, ROTULOS } from './bikes/bikes.js';

const d = document, root = d.documentElement;
const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const WA = 'https://wa.me/5548999918272?text=';
const ORDEM = ['potencia', 'bateria', 'autonomia', 'velocidade', 'freios', 'suspensao', 'pneu', 'peso'];
const reduce = root.classList.contains('reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;

const hall = $('[data-hall]'), palco = $('[data-palco]'), cena = $('[data-cena]'), box = $('[data-vista-box]');
const poster = $('[data-poster]'), glBox = $('[data-gl]'), carga = $('[data-carga]'), fundo = $('[data-fundo]');
const bolhasUl = $('[data-bolhas]'), info = $('[data-info]'), nomeEl = $('[data-nome]'), fraseEl = $('[data-frase]');
const notaEl = $('[data-nota]'), quero = $('[data-quero]'), fila = $('[data-fila]'), motos = $$('.moto', fila);
const btVistas = $$('[data-vista]'), btZoom = $('[data-zoom]');
const bySlug = Object.fromEntries(BIKES.map(b => [b.slug, b]));

const temGL = (() => {
  try { const c = d.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch (e) { return false; }
})();
const usa3D = temGL && !reduce;
if (!usa3D) palco.classList.add('is-static');

/* os cards seguem o bikes.js: editou o nome lá, muda aqui */
motos.forEach(m => {
  const b = bySlug[m.dataset.slug]; if (!b) return;
  $('.moto__nome', m).textContent = b.nome;
  $('.moto__marca', m).textContent = b.marca || '';
  m.setAttribute('aria-label', `Ver a ${b.nome} em 3D`);
  m.setAttribute('aria-pressed', 'false');
});

/* ---------- ficha: 4 especificações confirmadas, completadas pelos destaques ---------- */
function spec(rot, v) {
  if (typeof v === 'object') return { rot, num: String(v.valor), un: v.unidade || '', nota: v.nota || '' };
  const m = /^(\d[\d.,]*(?:\s+a\s+\d[\d.,]*)?)\s*(.*)$/.exec(v);
  if (m && m[2].length <= 8) return { rot, num: m[1], un: m[2] };   // "1000 W", "50 a 60 km", "45 kg"
  return { rot, txt: v };                                            // "Disco dianteiro e traseiro"
}
function ficha(b) {
  const out = [];
  for (const k of ORDEM) {
    const v = b.specs && b.specs[k];
    if (v == null || v === '') continue;
    out.push(spec(ROTULOS[k], v));
    if (out.length === 4) return out;
  }
  for (const x of b.destaques || []) { if (out.length === 4) break; out.push({ rot: x.rotulo, txt: x.texto }); }
  return out;
}

/* os números contam até o valor ("1.440" mantém o ponto de milhar) */
function contar(el, alvo, atraso) {
  const partes = alvo.split(/(\d[\d.]*)/).map((t, i) => i % 2 ? { v: parseInt(t.replace(/\./g, ''), 10), ponto: t.includes('.') } : t);
  const fmt = k => partes.map((x, i) => i % 2 ? (x.ponto ? Math.round(x.v * k).toLocaleString('pt-BR') : String(Math.round(x.v * k))) : x).join('');
  el.textContent = fmt(0);
  const t0 = performance.now() + atraso;
  const passo = now => {
    const p = Math.max(0, Math.min(1, (now - t0) / 600));
    el.textContent = p < 1 ? fmt(1 - Math.pow(1 - p, 3)) : alvo;
    if (p < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

let geracao = 0;
function montarBolhas(b, animar) {
  const gen = ++geracao, itens = ficha(b), anima = animar && !reduce && !!d.body.animate;
  const entrar = () => {
    if (gen !== geracao) return;
    bolhasUl.innerHTML = '';
    itens.forEach((it, i) => {
      const li = d.createElement('li');
      li.className = 'bolha' + (it.txt ? ' bolha--txt' : '');
      li.style.setProperty('--fase', (-i * 1.6) + 's');
      li.innerHTML = `<span class="bolha__rot">${esc(it.rot)}</span>` +
        `<span class="bolha__val">${it.txt ? esc(it.txt) : `<b>${esc(it.num)}</b><span class="bolha__un">${esc(it.un)}</span>`}</span>` +
        (it.nota ? `<span class="bolha__nota">${esc(it.nota)}</span>` : '');
      bolhasUl.appendChild(li);
      if (!anima) return;
      li.animate([{ opacity: 0, scale: .9, filter: 'blur(8px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)' }],
        { duration: 520, delay: i * 80, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      const n = $('b', li); if (n) contar(n, it.num, i * 80);
    });
  };
  const atuais = $$('.bolha', bolhasUl);
  if (anima && atuais.length) {
    Promise.all(atuais.map((el, i) => el.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: .94 }],
      { duration: 200, delay: i * 40, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }).finished)).then(entrar, entrar);
  } else entrar();
}

function preencher(b) {
  nomeEl.textContent = b.nome;
  fraseEl.textContent = b.frase;
  notaEl.hidden = ORDEM.some(k => b.specs && b.specs[k] != null);
  quero.href = WA + encodeURIComponent(`Olá! Vi a ${b.nome} no site da Estação da Bike e quero saber preço e condições.`);
  fundo.textContent = b.nome.replace(/^Ouxi\s+/, '');
}

/* ---------- onde a bike fica no palco: o recorte e o 3D usam a mesma conta ---------- */
function alvo(ar) {
  const W = box.clientWidth, H = box.clientHeight, cs = getComputedStyle(cena);
  const bw = parseFloat(cs.getPropertyValue('--bw')) || .5, ch = parseFloat(cs.getPropertyValue('--chao')) || .1;
  const chao = H * ch;
  let w = W * bw;
  const maxH = (H - chao) * .86;
  if (w / ar > maxH) w = maxH * ar;
  return { W, H, w, chao };
}
function posicionarPoster(ar) {
  const a = alvo(ar);
  poster.style.width = a.w + 'px';
  poster.style.left = (a.W - a.w) / 2 + 'px';
}
/* retângulo do desenho dentro de um <img> com object-fit: contain e apoiado embaixo */
function conteudo(img) {
  const r = img.getBoundingClientRect(), ar = img.naturalWidth / img.naturalHeight || r.width / r.height;
  const w = Math.min(r.width, r.height * ar), h = w / ar;
  return { left: r.left + (r.width - w) / 2, top: r.bottom - h, width: w, height: h };
}
const voar = (el, de, para, dur, atraso) => {
  const dx = de.left - para.left, dy = de.top - para.top, s = de.width / para.width;
  if (!isFinite(s) || s <= 0) return;
  el.animate([{ transformOrigin: '0 0', transform: `translate(${dx}px,${dy}px) scale(${s})` }, { transformOrigin: '0 0', transform: 'none' }],
    { duration: dur, delay: atraso || 0, easing: 'cubic-bezier(.22,.9,.24,1)', fill: 'backwards' });
};

/* ---------- 3D sob demanda ---------- */
let motor = null;
const cache = new Map(), ouvintes = new Map();
function carregarMotor() {
  if (!motor) motor = import('./hall3d.js').then(m => m.criar({ box: glBox, alvo, aoMexer }));
  return motor;
}
function baixar(slug) {
  if (cache.has(slug)) return cache.get(slug);
  const p = (async () => {
    const r = await fetch(`assets/bikes/${slug}.glb`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const total = +r.headers.get('content-length') || 0;
    if (!r.body || !total) return r.arrayBuffer();
    const leitor = r.body.getReader(), pedacos = []; let n = 0;
    for (;;) {
      const { done, value } = await leitor.read(); if (done) break;
      pedacos.push(value); n += value.length;
      const f = ouvintes.get(slug); if (f) f(n / total);
    }
    const buf = new Uint8Array(n); let o = 0;
    for (const c of pedacos) { buf.set(c, o); o += c.length; }
    return buf.buffer;
  })();
  p.catch(() => cache.delete(slug));
  cache.set(slug, p);
  return p;
}
const preCarregar = slug => { if (usa3D) { carregarMotor().catch(() => {}); baixar(slug).catch(() => {}); } };

let pedido = 0;
async function mostrar3D(b) {
  if (!usa3D) return;
  const id = ++pedido;
  cena.classList.remove('is-3d');
  cena.classList.add('is-loading');
  carga.style.transform = 'scaleX(0)';
  ouvintes.set(b.slug, f => { if (id === pedido) carga.style.transform = `scaleX(${f.toFixed(3)})`; });
  try {
    const [m, buf] = await Promise.all([carregarMotor(), baixar(b.slug)]);
    if (id !== pedido) return;
    carga.style.transform = 'scaleX(1)';
    await m.trocar(buf, b, () => id === pedido);
    if (id !== pedido) return;
    cena.classList.add('is-3d');
    marcarVista(null);
    btZoom.setAttribute('aria-pressed', 'false'); btZoom.textContent = 'Aproximar';
  } catch (e) {
    /* sem o 3D fica o recorte, com as mesmas bolhas */
  } finally {
    if (id === pedido) cena.classList.remove('is-loading');
  }
}

/* ---------- abrir uma bike ---------- */
let atual = null;
function abrir(slug, origem) {
  const b = bySlug[slug];
  if (!b || atual === slug) return;
  const imgOrig = $('.moto__img img', origem);
  const anima = !reduce && !!d.body.animate;
  const de = anima ? conteudo(imgOrig) : null;
  const antes = anima ? motos.map(m => m.getBoundingClientRect()) : null;

  atual = slug;
  motos.forEach(m => m.setAttribute('aria-pressed', String(m === origem)));
  preencher(b);
  cena.classList.remove('is-3d');
  poster.src = imgOrig.currentSrc || imgOrig.src;
  poster.width = imgOrig.naturalWidth || 1600; poster.height = imgOrig.naturalHeight || 1100;
  poster.style.scale = b.espelhar && b.frente === 'esq' ? '-1 1' : '';
  palco.hidden = false; info.hidden = false;
  hall.classList.add('is-open');

  // o palco precisa estar na tela: pula direto para ele e anima a partir de onde cada coisa estava
  const pr = palco.getBoundingClientRect(), topoH = 76;
  if (Math.abs(pr.top - topoH) > 40) {
    const y = pr.top + scrollY - topoH;
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
  }

  const ar = (imgOrig.naturalWidth / imgOrig.naturalHeight) || 1.4;
  posicionarPoster(ar);
  if (anima) {
    voar(poster, de, poster.getBoundingClientRect(), 760);
    motos.forEach((m, i) => { if (m !== origem) voar(m, antes[i], m.getBoundingClientRect(), 620, 40 + i * 30); });
    if (!fila.contains(d.activeElement)) origem.focus({ preventScroll: true });
  }
  setTimeout(() => montarBolhas(b, true), anima ? 320 : 0);
  mostrar3D(b);
  requestAnimationFrame(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
}

motos.forEach(m => {
  m.addEventListener('click', () => abrir(m.dataset.slug, m));
  m.addEventListener('pointerenter', () => preCarregar(m.dataset.slug));
  m.addEventListener('focus', () => preCarregar(m.dataset.slug));
});

/* ---------- vistas e zoom ---------- */
function marcarVista(nome) { btVistas.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.vista === nome))); }
function aoMexer() { marcarVista(null); }
btVistas.forEach(bt => bt.addEventListener('click', () => {
  if (!motor) return;
  motor.then(m => { m.vista(bt.dataset.vista); marcarVista(bt.dataset.vista); });
}));
btZoom.addEventListener('click', () => {
  if (!motor) return;
  const on = btZoom.getAttribute('aria-pressed') !== 'true';
  btZoom.setAttribute('aria-pressed', String(on));
  btZoom.textContent = on ? 'Afastar' : 'Aproximar';
  motor.then(m => m.zoom(on));
});

/* ---------- carrega o motor e a bike do meio quando o hall chega perto ---------- */
if (usa3D && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    preCarregar(BIKES[Math.floor(BIKES.length / 2)].slug);
  }, { rootMargin: '900px 0px' });
  io.observe(hall);
}

let rz = 0;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => { if (atual) posicionarPoster((poster.naturalWidth / poster.naturalHeight) || 1.4); }, 120);
});

window.__hall = { abrir: slug => abrir(slug, motos.find(m => m.dataset.slug === slug)) };
window.__ready = true;
