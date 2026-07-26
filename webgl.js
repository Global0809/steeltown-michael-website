/* ============ STEELTOWN MICHAEL — THE 3D WORLD ============
   A scroll-driven flight: silk hero → pink flower corridor →
   silver stone corridor → the turntable room (3D vinyl flip).
   Fails gracefully: dispatches stm-webgl {ok:false} and the DOM
   fallback (main.js) takes over. */
import * as THREE from "three";

const canvas = document.getElementById("world");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: matchMedia("(min-width: 900px)").matches, powerPreference: "high-performance" });
} catch (e) {
  dispatchEvent(new CustomEvent("stm-webgl", { detail: { ok: false } }));
  throw e;
}
const MOBILE = matchMedia("(max-width: 899px)").matches || matchMedia("(pointer: coarse)").matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.2 : 1.6));
renderer.setSize(innerWidth, innerHeight);
document.body.classList.add("webgl-on");
dispatchEvent(new CustomEvent("stm-webgl", { detail: { ok: true } }));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x170a14, 0.038);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 0, 4.2);

const amb = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(amb);
const key = new THREE.PointLight(0xf0568f, 26, 30);
key.position.set(-1.6, 1.8, -64);
scene.add(key);
const fill = new THREE.PointLight(0xfff2e0, 14, 24);
fill.position.set(1.6, -0.6, -63.2);
scene.add(fill);

const texLoader = new THREE.TextureLoader();
const T = p => { const t = texLoader.load(p); t.colorSpace = THREE.SRGBColorSpace; return t; };

/* ---------- 1 · SILK HERO PLANE (displacement shader) ---------- */
const silkUniforms = {
  uTex: { value: T("assets/cover.webp") },
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  uMouseStrength: { value: 0 },
  uDim: { value: 1 },
};
const silk = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1, 90, 60),
  new THREE.ShaderMaterial({
    uniforms: silkUniforms,
    vertexShader: `
      uniform float uTime; uniform vec2 uMouse; uniform float uMouseStrength;
      varying vec2 vUv; varying float vH;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      void main(){
        vUv = uv;
        float n = noise(uv * 3.0 + vec2(uTime * 0.12, uTime * 0.07));
        n += 0.5 * noise(uv * 6.0 - vec2(uTime * 0.09, 0.0));
        float d = distance(uv, uMouse);
        float ripple = exp(-d * 9.0) * sin(d * 30.0 - uTime * 4.0) * uMouseStrength;
        vH = n;
        vec3 pos = position + vec3(0.0, 0.0, n * 0.16 + ripple * 0.12);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform float uDim;
      varying vec2 vUv; varying float vH;
      uniform float uTime;
      void main(){
        vec3 c = texture2D(uTex, vUv).rgb;
        c *= 0.82 + vH * 0.35;           /* fake silk shading from height */
        /* travelling iridescent sheen band */
        float band = fract(vUv.x * 0.7 - vUv.y * 0.25 + uTime * 0.05);
        float sheen = smoothstep(0.42, 0.5, band) * (1.0 - smoothstep(0.5, 0.58, band));
        c += sheen * vec3(1.0, 0.85, 0.95) * 0.22 * (0.5 + vH);
        gl_FragColor = vec4(c * uDim, 1.0);
      }`,
  })
);
scene.add(silk);
function fitSilk() {
  const d = 4.2, h = 2 * d * Math.tan(THREE.MathUtils.degToRad(27.5)), w = h * camera.aspect;
  silk.scale.set(Math.max(w * 1.15, 8), Math.max(h * 1.15, 4.6), 1);
}

/* ---------- 2 · CORRIDORS OF FLOATING FRAMES ---------- */
const frameGroup = new THREE.Group();
scene.add(frameGroup);
const frames = [];
const FRAME_DEFS = [
  // pink corridor
  { img: "assets/pink-full.webp",    x: -1.9, z: -8 },
  { img: "assets/pink-boxed.webp",   x:  1.9, z: -16 },
  { img: "assets/pink-capoff.webp",  x: -1.9, z: -24 },
  // silver corridor
  { img: "assets/silver-full.webp",  x:  1.9, z: -38 },
  { img: "assets/silver-boxed.webp", x: -1.9, z: -46 },
  { img: "assets/silver-capoff.webp",x:  1.9, z: -54 },
];
const frameBorder = new THREE.MeshBasicMaterial({ color: 0x191410 });
FRAME_DEFS.forEach(def => {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 3.62), frameBorder);
  back.position.z = -0.02;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 3.4), new THREE.MeshBasicMaterial({ map: T(def.img) }));
  g.add(back, pic);
  g.position.set(def.x, Math.sin(def.z) * 0.18, def.z);
  g.rotation.y = def.x > 0 ? -0.32 : 0.32;
  g.userData.baseY = g.position.y;
  g.userData.baseRotY = g.rotation.y;
  frameGroup.add(g);
  frames.push(g);
});

/* ---------- 2b · LIGHT & GLOW: frame halos + beams ---------- */
const softTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 126);
  g.addColorStop(0, "rgba(255,255,255,0.5)"); g.addColorStop(0.6, "rgba(255,255,255,0.14)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
const frameGlows = [];
frames.forEach((f, i) => {
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 5.4),
    new THREE.MeshBasicMaterial({ map: softTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: i < 3 ? 0xf0568f : 0x9aa7bd, opacity: 0.32 })
  );
  glow.position.z = -0.1;
  f.add(glow);
  frameGlows.push(glow);
});

// slanted light beams raking through the corridors + turntable spots
const beamTex = (() => {
  const c = document.createElement("canvas"); c.width = 128; c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(0.6, "rgba(255,255,255,0.12)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 512);
  const h = x.createLinearGradient(0, 0, 128, 0);
  h.addColorStop(0, "rgba(0,0,0,1)"); h.addColorStop(0.25, "rgba(0,0,0,0)"); h.addColorStop(0.75, "rgba(0,0,0,0)"); h.addColorStop(1, "rgba(0,0,0,1)");
  x.globalCompositeOperation = "destination-out"; x.fillStyle = h; x.fillRect(0, 0, 128, 512);
  return new THREE.CanvasTexture(c);
})();
const beams = [];
const BEAM_DEFS = [
  { x: 1.4, z: -12, tilt: 0.42, c: 0xff9ec6, o: 0.10 }, { x: -1.4, z: -20, tilt: -0.38, c: 0xff9ec6, o: 0.09 }, { x: 1.2, z: -28, tilt: 0.34, c: 0xffc9de, o: 0.08 },
  { x: -1.4, z: -42, tilt: -0.4, c: 0xd9c9a8, o: 0.09 }, { x: 1.4, z: -50, tilt: 0.36, c: 0xcfd6e2, o: 0.09 },
  { x: -2.0, z: -66.5, tilt: -0.5, c: 0xffb9d6, o: 0.16 }, { x: -0.6, z: -66.5, tilt: 0.45, c: 0xfff0dc, o: 0.13 },
];
BEAM_DEFS.forEach(d => {
  const b = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 13),
    new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: d.c, opacity: d.o })
  );
  b.position.set(d.x, 4.2, d.z);
  b.rotation.z = d.tilt;
  b.userData = { baseTilt: d.tilt, baseO: d.o, phase: Math.random() * 6 };
  scene.add(b);
  beams.push(b);
});

/* ---------- 2c · GIANT GHOST RECORD in the deep fog ---------- */
const ghost = new THREE.Group();
ghost.position.set(0, 0.4, -83);
const gDisc = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshBasicMaterial({ color: 0x120d12 }));
const gGroove = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 16.4), new THREE.MeshBasicMaterial({ map: grooveTexBig(), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
gGroove.position.z = 0.05;
const gRim = new THREE.Mesh(new THREE.RingGeometry(7.85, 8, 64), new THREE.MeshBasicMaterial({ color: 0xf0568f, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
gRim.position.z = 0.06;
ghost.add(gDisc, gGroove, gRim);
scene.add(ghost);
function grooveTexBig() {
  const c = document.createElement("canvas"); c.width = c.height = 1024;
  const x = c.getContext("2d");
  x.translate(512, 512);
  for (let r = 90, i = 0; r < 500; r += 4, i++) {
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2);
    x.strokeStyle = `rgba(255,255,255,${i % 7 === 0 ? 0.09 : 0.035})`;
    x.lineWidth = 1.4; x.stroke();
  }
  return new THREE.CanvasTexture(c);
}

/* ---------- 3 · THE 3D VINYL ---------- */
const VINYL_Z = -67;
const vinylGroup = new THREE.Group();
vinylGroup.position.set(-1.35, 0, VINYL_Z);
scene.add(vinylGroup);

// backlit halo so the black disc silhouettes against the dark room
const haloTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 40, 128, 128, 126);
  g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(0.55, "rgba(255,255,255,0.18)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
const halo = new THREE.Mesh(
  new THREE.PlaneGeometry(6.4, 6.4),
  new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xff2e8a })
);
halo.position.set(-1.35, 0, VINYL_Z - 0.9);
scene.add(halo);

const disc = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 0.05, 72),
  new THREE.MeshStandardMaterial({ color: 0x161616, metalness: 0.6, roughness: 0.26 })
);
disc.rotation.x = Math.PI / 2;
vinylGroup.add(disc);

// concentric groove shimmer (canvas texture, both faces)
const gc = document.createElement("canvas"); gc.width = gc.height = 512;
const gx = gc.getContext("2d");
gx.translate(256, 256);
for (let r = 70; r < 250; r += 3) {
  gx.beginPath(); gx.arc(0, 0, r, 0, Math.PI * 2);
  gx.strokeStyle = `rgba(255,255,255,${0.03 + (r % 9 === 0 ? 0.05 : 0)})`;
  gx.lineWidth = 1; gx.stroke();
}
const grooveTex = new THREE.CanvasTexture(gc);
[1, -1].forEach(s => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: grooveTex, transparent: true }));
  m.position.z = 0.028 * s; m.rotation.y = s === -1 ? Math.PI : 0;
  vinylGroup.add(m);
});

// circular label per face: front = Side A (pink), back = Side B (silver)
function circleTex(src) {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const x = c.getContext("2d");
  const img = new Image();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  img.onload = () => {
    x.beginPath(); x.arc(256, 256, 256, 0, Math.PI * 2); x.clip();
    const s = Math.max(512 / img.width, 512 / img.height);
    x.drawImage(img, (512 - img.width * s) / 2, (512 - img.height * s) / 2, img.width * s, img.height * s);
    tex.needsUpdate = true;
  };
  img.src = src;
  return tex;
}
const labelA = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), new THREE.MeshBasicMaterial({ map: circleTex("assets/pink-boxed.webp") }));
labelA.position.z = 0.034;
const labelB = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), new THREE.MeshBasicMaterial({ map: circleTex("assets/silver-boxed.webp") }));
labelB.position.z = -0.034; labelB.rotation.y = Math.PI;
vinylGroup.add(labelA, labelB);

const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 }));
spindle.rotation.x = Math.PI / 2;
vinylGroup.add(spindle);

let spin = 0, flipTarget = document.documentElement.dataset.side === "b" ? Math.PI : 0;
vinylGroup.rotation.y = flipTarget;
addEventListener("stm-flip", e => { flipTarget += Math.PI; });
function sideTint(s) {
  key.color.set(s === "a" ? 0xf0568f : 0xd9b177);
  halo.material.color.set(s === "a" ? 0xf0568f : 0xbfc6d2);
  gRim.material.color.set(s === "a" ? 0xf0568f : 0xbfc6d2);
}
addEventListener("stm-side", e => sideTint(e.detail.side));
sideTint(document.documentElement.dataset.side);

/* ---------- 4 · PARTICLES: dust, petals, embers ---------- */
function spriteTex(draw) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  draw(c.getContext("2d"));
  return new THREE.CanvasTexture(c);
}
const dustTex = spriteTex(x => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, "rgba(255,250,240,0.9)"); g.addColorStop(1, "rgba(255,250,240,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
});
const petalTex = spriteTex(x => {
  x.translate(32, 32); x.rotate(0.6);
  const g = x.createRadialGradient(0, 0, 2, 0, 0, 26);
  g.addColorStop(0, "rgba(255,150,200,0.95)"); g.addColorStop(1, "rgba(255,60,140,0)");
  x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2); x.fill();
});
const emberTex = spriteTex(x => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 28);
  g.addColorStop(0, "rgba(255,190,110,1)"); g.addColorStop(0.4, "rgba(255,120,50,0.5)"); g.addColorStop(1, "rgba(255,80,30,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
});

function makeParticles(count, tex, size, zMin, zMax, spread) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    pos[i * 3 + 2] = zMin + Math.random() * (zMax - zMin);
    seed[i] = Math.random() * 100;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ map: tex, size, transparent: true, depthWrite: false, opacity: 0.8, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat);
  pts.userData = { seed, zMin, zMax, spread };
  scene.add(pts);
  return pts;
}
const N = MOBILE ? 0.45 : 1;
const dust   = makeParticles(Math.floor(300 * N), dustTex, 0.05, -70, 5, 14);
const petals = makeParticles(Math.floor(210 * N), petalTex, 0.26, -32, -2, 10);
const embers = makeParticles(Math.floor(210 * N), emberTex, 0.13, -60, -32, 10);
petals.material.blending = THREE.NormalBlending;
// golden bokeh — two depths, twinkling everywhere
const bokehA = makeParticles(Math.floor(90 * N), dustTex, 0.42, -80, 4, 16);
const bokehB = makeParticles(Math.floor(70 * N), dustTex, 0.8, -80, 4, 20);
bokehA.material.color.set(0xd8b078); bokehA.material.opacity = 0.32;
bokehB.material.color.set(0xc9a06a); bokehB.material.opacity = 0.16;

/* ---------- 5 · CAMERA PATH (scroll-driven flight) ---------- */
const secs = {};
["tape-start", "picture-show", "side-a", "side-b", "turntable"].forEach(id => (secs[id] = document.getElementById(id)));
let zones = [];
function measure() {
  const vh = innerHeight;
  zones = Object.entries(secs).map(([id, el]) => ({
    id, top: el.offsetTop, end: el.offsetTop + Math.max(el.offsetHeight - vh, 1),
  }));
}
const FOGS = { "tape-start": 0x170a14, "picture-show": 0x0d070b, "side-a": 0x2a0d1c, "side-b": 0x150f09, turntable: 0x100810 };
const camTarget = new THREE.Vector3(0, 0, 4.2);
const lookTarget = new THREE.Vector3(0, 0, 0);
const lookCur = new THREE.Vector3(0, 0, 0);
const fogColor = new THREE.Color(0x140a10);
let vinylParked = 0; // 0..1 how "arrived" we are at the turntable

function pathAt(y) {
  let zone = zones[0], t = 0;
  for (const z of zones) if (y >= z.top - innerHeight * 0.35) { zone = z; t = Math.min(1, Math.max(0, (y - z.top) / (z.end - z.top))); }
  const sway = Math.sin(t * Math.PI * 2) * 0.55;
  vinylParked = 0;
  switch (zone.id) {
    case "tape-start":   camTarget.set(0, 0, 4.2 - t * 0.6); lookTarget.set(0, 0, 0); break;
    case "picture-show": camTarget.set(0, -0.15 * t, 3.6 - t * 2.2); lookTarget.set(0, -0.2 * t, 0); silkUniforms.uDim.value = 1 - t * 0.75; break;
    case "side-a":       camTarget.set(sway, 0, 1.4 + t * (-30 - 1.4)); lookTarget.set(sway * 0.4, 0, camTarget.z - 7); break;
    case "side-b":       camTarget.set(-sway, 0, -30 + t * -30); lookTarget.set(-sway * 0.4, 0, camTarget.z - 7); break;
    case "turntable":    vinylParked = t; camTarget.set(0, 0, -60 - t * 3.2); lookTarget.lerpVectors(new THREE.Vector3(0, 0, -67), vinylGroup.position, t); break;
  }
  if (zone.id !== "picture-show") silkUniforms.uDim.value = Math.min(1, silkUniforms.uDim.value + 0.02);
  fogColor.set(FOGS[zone.id]);
  // particle visibility by zone
  petals.material.opacity += (((zone.id === "side-a") ? 0.85 : 0) - petals.material.opacity) * 0.04;
  embers.material.opacity += (((zone.id === "side-b" || zone.id === "turntable") ? 0.8 : 0) - embers.material.opacity) * 0.04;
}

/* mouse */
const mouse = new THREE.Vector2(0, 0);
let mouseStrengthTarget = 0;
addEventListener("pointermove", e => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  silkUniforms.uMouse.value.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
  mouseStrengthTarget = 1;
});

/* raycast: vinyl click-to-flip + frame hover */
const ray = new THREE.Raycaster();
const curLabel = document.querySelector("#cursor .c-label");
const curEl = document.getElementById("cursor");
let hoverVinyl = false;
addEventListener("click", e => {
  if (hoverVinyl) document.getElementById("flip-btn").click();
});

/* ---------- render loop ---------- */
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  if (document.hidden) return;
  const t = clock.getElapsedTime();
  silkUniforms.uTime.value = t;
  silkUniforms.uMouseStrength.value += (mouseStrengthTarget - silkUniforms.uMouseStrength.value) * 0.05;
  mouseStrengthTarget *= 0.985;

  pathAt(scrollY);
  camera.position.lerp(camTarget, 0.07);
  camera.position.y += Math.sin(t * 0.55) * 0.045;      // idle breathing
  lookCur.lerp(lookTarget, 0.07);
  camera.lookAt(lookCur.x + mouse.x * 0.4, lookCur.y + mouse.y * 0.26, lookCur.z);
  camera.rotation.z += Math.sin(t * 0.4) * 0.006;       // gentle film roll
  scene.fog.color.lerp(fogColor, 0.04);
  renderer.setClearColor(scene.fog.color);

  // frames float, sway, and their halos pulse
  frames.forEach((f, i) => {
    f.position.y = f.userData.baseY + Math.sin(t * 0.7 + i * 1.7) * 0.09;
    f.rotation.y = f.userData.baseRotY + Math.sin(t * 0.5 + i * 2.3) * 0.045;
    frameGlows[i].material.opacity = 0.3 + Math.sin(t * 1.3 + i * 1.1) * 0.1;
  });

  // beams sway and flicker like stage light through haze
  beams.forEach(b => {
    b.rotation.z = b.userData.baseTilt + Math.sin(t * 0.5 + b.userData.phase) * 0.05;
    b.material.opacity = b.userData.baseO * (0.8 + Math.sin(t * 1.7 + b.userData.phase * 2) * 0.25);
  });

  // giant ghost record turns forever in the deep fog
  ghost.rotation.z += 0.0018;
  gRim.material.opacity = 0.3 + Math.sin(t * 1.1) * 0.1;

  // bokeh twinkle
  bokehA.material.opacity = 0.3 + Math.sin(t * 0.9) * 0.1;
  bokehB.material.opacity = 0.15 + Math.sin(t * 0.7 + 2) * 0.06;

  // vinyl: spin + flip + float
  spin += 0.012;
  disc.rotation.y = spin;                       // cylinder local Y = facing axis
  labelA.rotation.z = -spin; labelB.rotation.z = spin;
  vinylGroup.rotation.y += (flipTarget - vinylGroup.rotation.y) * 0.09;
  vinylGroup.position.y = Math.sin(t * 0.9) * 0.05;
  vinylGroup.position.x = (MOBILE || camera.aspect < 1 ? 0 : -1.35);
  const vs = 0.72 + vinylParked * 0.28;
  vinylGroup.scale.set(vs, vs, vs);
  halo.position.set(vinylGroup.position.x, vinylGroup.position.y, VINYL_Z - 0.9);
  halo.scale.setScalar(vs * (1 + Math.sin(t * 1.6) * 0.04));

  // particles drift
  [[petals, -0.28, 0.4], [embers, 0.22, 0.25], [dust, -0.03, 0.06]].forEach(([p, vy, wob]) => {
    const a = p.geometry.attributes.position.array, s = p.userData.seed;
    for (let i = 0; i < s.length; i++) {
      a[i * 3 + 1] += vy * 0.016 * (0.6 + Math.sin(s[i]) * 0.4);
      a[i * 3] += Math.sin(t * 0.8 + s[i]) * wob * 0.008;
      if (vy < 0 && a[i * 3 + 1] < -2.8) a[i * 3 + 1] = 2.8;
      if (vy > 0 && a[i * 3 + 1] > 2.8) a[i * 3 + 1] = -2.8;
    }
    p.geometry.attributes.position.needsUpdate = true;
  });

  // raycast (desktop only, throttled by simple frame mod)
  if (!MOBILE && renderer.info.render.frame % 3 === 0) {
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObject(disc, false);
    const h = hit.length > 0 && Math.abs(camera.position.z - VINYL_Z) < 12;
    if (h !== hoverVinyl) {
      hoverVinyl = h;
      if (curEl) {
        if (h) { curLabel.textContent = "FLIP"; curEl.classList.add("active"); }
        else curEl.classList.remove("active");
      }
      document.body.style.cursor = ""; // custom cursor handles visuals
    }
  }

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  fitSilk();
  measure();
}
addEventListener("resize", onResize);
// measure after layout settles (webgl-on class changes section heights),
// re-measure when fonts land or anything reflows the page height
requestAnimationFrame(() => { onResize(); tick(); });
setTimeout(onResize, 600);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => onResize());
new ResizeObserver(() => measure()).observe(document.body);
window.__stm = { camera, zones: () => zones, camTarget, lookTarget };
