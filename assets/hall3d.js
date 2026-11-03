/* Palco 3D do Hall: um renderer só, reaproveitado entre as bikes.
   Sem OrbitControls: arrastar na horizontal gira, a inclinação fica entre -12° e 12°, sem zoom na rodinha. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const RAD = Math.PI / 180, INCL = 12 * RAD, PH0 = 4 * RAD, AUTO = .15, ESPERA = 4000;
const VISTAS = { lateral: 0, tres: 40 * RAD, frente: 90 * RAD };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

export function criar({ box, alvo, aoMexer }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  box.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, .02, 40);
  window.__app = { renderer, scene, camera };

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();
  const sol = new THREE.DirectionalLight(0xffffff, 1.1);
  sol.position.set(1.5, 3, 2.2);
  scene.add(sol);

  // sombra de contato: elipse borrada desenhada uma vez num canvas, nada de sombra dura
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const g = sc.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(24,24,24,.5)'); gr.addColorStop(.45, 'rgba(24,24,24,.24)'); gr.addColorStop(1, 'rgba(24,24,24,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, toneMapped: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = .002; sombra.visible = false;
  scene.add(sombra);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  /* estado da câmera em órbita: th gira em volta da bike, ph inclina, zoom alterna dois enquadramentos */
  const est = { th: 0, ph: PH0, zoom: 0 };
  const base = { dist: 3, alvoY: .4 };
  let modelo = null, alturaM = .7, tweens = [], vel = 0, arrastando = false, ultimaMexida = -1e9;
  let visivel = true, raf = 0, ultimo = 0;

  function enquadrar() {
    const W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const a = alvo(1 / alturaM), t = Math.tan(camera.fov * RAD / 2);
    base.dist = 1 / (2 * (a.w / W) * t * camera.aspect);   // comprimento 1 ocupa a.w pixels
    base.alvoY = (1 - 2 * (a.chao / H)) * base.dist * t;   // rodas em cima da linha do chão
  }
  function posicionarCamera() {
    const D = base.dist * (1 - .42 * est.zoom), ty = base.alvoY + (alturaM * .55 - base.alvoY) * est.zoom, cp = Math.cos(est.ph);
    camera.position.set(Math.sin(est.th) * cp * D, ty + Math.sin(est.ph) * D, Math.cos(est.th) * cp * D);
    camera.lookAt(0, ty, 0);
  }

  function pedir() { if (!raf && visivel && modelo) { ultimo = performance.now(); raf = requestAnimationFrame(quadro); } }
  function quadro(now) {
    raf = 0;
    const dt = Math.min(.05, (now - ultimo) / 1000); ultimo = now;
    let mexe = arrastando;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i], p = clamp((now - tw.t0) / tw.dur, 0, 1);
      est[tw.k] = tw.de + (tw.para - tw.de) * suave(p);
      if (p >= 1) tweens.splice(i, 1);
      mexe = true;
    }
    if (!arrastando && Math.abs(vel) > .01) { est.th += vel * dt; vel *= Math.pow(.05, dt); mexe = true; }
    else if (!arrastando) vel = 0;
    if (!arrastando && !tweens.length && !vel && now - ultimaMexida > ESPERA) { est.th += AUTO * dt; mexe = true; }
    posicionarCamera();
    renderer.render(scene, camera);
    if (mexe) pedir(); else retomar();
  }
  // parado: não renderiza nada até a hora de voltar a girar sozinha
  let espera = 0;
  function retomar() {
    clearTimeout(espera);
    const falta = ultimaMexida + ESPERA - performance.now();
    if (falta > 0 && isFinite(falta)) espera = setTimeout(pedir, falta + 20);
  }
  const animar = (k, para, dur) => {
    tweens = tweens.filter(t => t.k !== k);
    tweens.push({ k, de: est[k], para, dur, t0: performance.now() });
    pedir();
  };

  /* arrasto: horizontal gira com inércia; no mouse o vertical inclina; no toque o vertical fica para a rolagem */
  let px = 0, py = 0, pt = 0;
  canvas.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    arrastando = true; px = e.clientX; py = e.clientY; pt = performance.now(); vel = 0;
    tweens = tweens.filter(t => t.k === 'zoom');
    ultimaMexida = Infinity;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    aoMexer && aoMexer();
    pedir();
  });
  canvas.addEventListener('pointermove', e => {
    if (!arrastando) return;
    const now = performance.now(), dx = e.clientX - px, dy = e.clientY - py, dt = Math.max(.008, (now - pt) / 1000);
    const k = 5.2 / Math.max(320, box.clientWidth);
    est.th -= dx * k;
    if (e.pointerType === 'mouse') est.ph = clamp(est.ph + dy * .004, -INCL, INCL);
    vel = vel * .4 + (-dx * k / dt) * .6;
    px = e.clientX; py = e.clientY; pt = now;
  });
  const soltar = () => {
    if (!arrastando) return;
    arrastando = false;
    if (performance.now() - pt > 90) vel = 0;
    vel = clamp(vel, -6, 6);
    ultimaMexida = performance.now();
    pedir();
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('keydown', e => {
    const passo = { ArrowLeft: 1, ArrowRight: -1 }[e.key];
    if (passo) { e.preventDefault(); ultimaMexida = performance.now(); animar('th', est.th + passo * .5, 450); aoMexer && aoMexer(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); ultimaMexida = performance.now(); animar('ph', clamp(est.ph + (e.key === 'ArrowUp' ? 1 : -1) * 4 * RAD, -INCL, INCL), 300); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visivel = es[0].isIntersecting; if (visivel) pedir(); }).observe(box);
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { enquadrar(); if (modelo) { posicionarCamera(); renderer.render(scene, camera); } }).observe(box);
  }

  function descartar(obj) {
    obj.traverse(o => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      [].concat(o.material).forEach(m => {
        for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); }
        m.dispose();
      });
    });
  }

  async function trocar(buf, bike, vale) {
    const gltf = await loader.parseAsync(buf.slice(0), '');
    const obj = gltf.scene;
    if (!vale()) { descartar(obj); return; }

    // normaliza: centro no eixo, comprimento 1, rodas em y = 0, frente para a direita na vista lateral
    const bb = new THREE.Box3().setFromObject(obj), tam = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -bb.min.y, -c.z);
    const giro = new THREE.Group(); giro.add(obj);
    const comp = Math.max(tam.x, tam.z), larg = Math.min(tam.x, tam.z);
    giro.scale.setScalar(1 / comp);
    giro.rotation.y = (tam.z > tam.x ? Math.PI / 2 : 0) + (bike.giro || 0) * RAD;
    obj.traverse(o => {
      if (!o.isMesh) return;
      [].concat(o.material).forEach(m => { m.envMapIntensity = 1; if (m.map) m.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); });
    });

    if (modelo) { scene.remove(modelo); descartar(modelo); }
    modelo = giro; scene.add(giro);
    alturaM = tam.y / comp;
    sombra.scale.set(1.12, (larg / comp) * 1.5 + .06, 1);
    sombra.visible = true;
    canvas.setAttribute('aria-label', `Modelo 3D da ${bike.nome}. Arraste para os lados para girar, ou use as setas do teclado.`);

    // começa do mesmo lado do recorte, para o recorte trocar pelo 3D sem pulo
    tweens = []; vel = 0;
    est.th = bike.frente === 'esq' ? Math.PI : 0; est.ph = PH0; est.zoom = 0;
    ultimaMexida = performance.now() - ESPERA + 1600;
    enquadrar(); posicionarCamera();
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    pedir();
  }

  function vista(nome) {
    const alvoTh = VISTAS[nome] || 0, volta = Math.PI * 2;
    ultimaMexida = performance.now() + 900;
    vel = 0;
    animar('th', alvoTh + volta * Math.round((est.th - alvoTh) / volta), 900);
    animar('ph', PH0, 900);
  }
  function zoom(on) { ultimaMexida = performance.now() + 900; animar('zoom', on ? 1 : 0, 900); }

  return { renderer, trocar, vista, zoom };
}
