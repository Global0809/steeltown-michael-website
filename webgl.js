/* ============ STEELTOWN MICHAEL — THE 3D WORLD ============
   A scroll-driven flight: silk hero → pink flower corridor →
   silver stone corridor → the turntable room (3D vinyl flip).
   Fails gracefully: dispatches stm-webgl {ok:false} and the DOM
   fallback (main.js) takes over. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

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

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* ---------- 1 · HERO BOTTLE — procedural glass flacon, morphs pink<->chrome ---------- */
const bottleGroup = new THREE.Group();
scene.add(bottleGroup);

const bottleMat = new THREE.MeshPhysicalMaterial({
  color: 0xff2e94,
  transmission: 1,
  thickness: 1.0,
  ior: 1.45,
  roughness: 0.05,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  attenuationColor: new THREE.Color(0xff007f),
  attenuationDistance: 3.0,
  envMapIntensity: 1.4,
});
const bBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 1.55, 128, 1), bottleMat);
bBody.position.y = -0.15;
bottleGroup.add(bBody);
const bShoulder = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.15, 32, 96), bottleMat);
bShoulder.rotation.x = Math.PI / 2;
bShoulder.position.y = 0.66;
bShoulder.scale.set(1, 1, 0.7);
bottleGroup.add(bShoulder);
const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 1, roughness: 0.14, envMapIntensity: 1.4 });
const bCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 64), chromeMat);
bCollar.position.y = 0.84;
bottleGroup.add(bCollar);
const bPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.74, 0.16, 96), chromeMat);
bPedestal.position.y = -1.0;
bottleGroup.add(bPedestal);

// the crown cap — sphere sculpted by interfering curl fields
const capGeo = new THREE.SphereGeometry(0.42, 96, 96);
{
  const pos = capGeo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const a = Math.sin(n.x * 31.4) * Math.sin(n.y * 27.2) * Math.sin(n.z * 33.8);
    const b = Math.sin(n.x * 61.0 + 1.3) * Math.sin(n.y * 57.5 + 2.1) * Math.sin(n.z * 63.2 + 0.7);
    const r = 0.42 + a * 0.018 + b * 0.014;
    pos.setXYZ(i, n.x * r, n.y * r, n.z * r);
  }
  capGeo.computeVertexNormals();
}
const bCapMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, metalness: 0.4, roughness: 0.4, envMapIntensity: 0.9 });
const bCap = new THREE.Mesh(capGeo, bCapMat);
bCap.position.y = 1.2;
bCap.scale.set(1, 1.06, 1);
bottleGroup.add(bCap);
bottleGroup.position.set(0, 0.05, 0);
let bottleVis = 1;
const B_PINK = new THREE.Color(0xff2e94), B_CHROME = new THREE.Color(0xe3e6ec), bCol = new THREE.Color();

// hero lighting rig: key + colored rim so the glass reads against the void
const bKey = new THREE.PointLight(0xffffff, 30, 14, 1.8);
bKey.position.set(2.2, 2.6, 3.2);
scene.add(bKey);
const bRim = new THREE.PointLight(0xff4fa8, 36, 12, 1.8);
bRim.position.set(-2.6, 0.6, -2.2);
scene.add(bRim);

/* ---------- 2 · CORRIDORS OF FLOATING FRAMES ---------- */
const frameGroup = new THREE.Group();
scene.add(frameGroup);
const frames = [];
const FRAME_DEFS = [
  // pink corridor
  { img: "assets/pink-full.webp",    x: -1.9, z: -13 },
  { img: "assets/pink-boxed.webp",   x:  1.9, z: -21 },
  { img: "assets/pink-capoff.webp",  x: -1.9, z: -29 },
  // silver corridor
  { img: "assets/silver-full.webp",  x:  1.9, z: -43 },
  { img: "assets/silver-boxed.webp", x: -1.9, z: -51 },
  { img: "assets/silver-capoff.webp",x:  1.9, z: -59 },
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
// soft halo behind the hero bottle so it silhouettes against the dark
const heroGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(7.4, 7.4),
  new THREE.MeshBasicMaterial({ map: softTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xff2e94, opacity: 0.45 })
);
heroGlow.position.set(0, 0.05, -2.4);
scene.add(heroGlow);

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
  { x: 1.4, z: -17, tilt: 0.42, c: 0xff9ec6, o: 0.10 }, { x: -1.4, z: -25, tilt: -0.38, c: 0xff9ec6, o: 0.09 }, { x: 1.2, z: -33, tilt: 0.34, c: 0xffc9de, o: 0.08 },
  { x: -1.4, z: -47, tilt: -0.4, c: 0xd9c9a8, o: 0.09 }, { x: 1.4, z: -55, tilt: 0.36, c: 0xcfd6e2, o: 0.09 },
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

/* ---------- 4b · NEBULA BACKDROP — the void becomes color ---------- */
function blobTex(hex) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 10, 128, 128, 126);
  g.addColorStop(0, hex + "cc"); g.addColorStop(0.55, hex + "44"); g.addColorStop(1, hex + "00");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const nebulas = [];
[
  { c: "#d44a86", x: -7, y: 2.5, z: -97, s: 40, o: 0.5 },
  { c: "#6a3f8f", x: 8, y: -2, z: -93, s: 34, o: 0.42 },
  { c: "#c98f4e", x: 0, y: 1, z: -89, s: 28, o: 0.34 },
].forEach((d, i) => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(d.s, d.s * 0.66),
    new THREE.MeshBasicMaterial({ map: blobTex(d.c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: d.o })
  );
  m.position.set(d.x, d.y, d.z);
  m.userData = { bx: d.x, by: d.y, phase: i * 2.1, o: d.o };
  scene.add(m); nebulas.push(m);
});

/* ---------- 4c · CHROME MUSIC NOTES drifting through the world ---------- */
function noteTex(ch) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  x.font = "90px Georgia"; x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = "rgba(255,215,150,0.9)"; x.shadowBlur = 18;
  const g = x.createLinearGradient(20, 20, 100, 110);
  g.addColorStop(0, "#fff6e8"); g.addColorStop(0.5, "#d8b078"); g.addColorStop(1, "#9a7a4e");
  x.fillStyle = g; x.fillText(ch, 64, 68);
  return new THREE.CanvasTexture(c);
}
const noteTexs = [noteTex("♪"), noteTex("♫"), noteTex("♩")];
const notes = [];
const NOTE_N = MOBILE ? 7 : 15;
for (let i = 0; i < NOTE_N; i++) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTexs[i % 3], transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  const s = 0.25 + Math.random() * 0.3;
  sp.scale.set(s, s, 1);
  sp.position.set((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 5, -4 - Math.random() * 56);
  sp.userData = { vy: 0.12 + Math.random() * 0.2, spin: (Math.random() - 0.5) * 0.6, phase: Math.random() * 6 };
  scene.add(sp); notes.push(sp);
}

/* ---------- 4d · GHOST MINI-VINYLS spinning in the distance ---------- */
const miniVinyls = [];
[{ x: -5.5, y: 1.6, z: -20 }, { x: 5.8, y: -1.4, z: -33 }, { x: -6, y: -0.8, z: -47 }, { x: 5.4, y: 1.8, z: -57 }].forEach(d => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), new THREE.MeshBasicMaterial({ color: 0x14101a, transparent: true, opacity: 0.85 })));
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: grooveTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  gr.position.z = 0.01; g.add(gr);
  const rim = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.25, 40), new THREE.MeshBasicMaterial({ color: 0xd8b078, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending }));
  rim.position.z = 0.02; g.add(rim);
  g.position.set(d.x, d.y, d.z);
  g.userData = { spin: 0.15 + Math.random() * 0.2, baseY: d.y, phase: Math.random() * 6 };
  scene.add(g); miniVinyls.push(g);
});

/* ---------- 4e · SPARKLE BURSTS on click + shooting streaks ---------- */
const starTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d");
  x.translate(32, 32);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 30);
  g.addColorStop(0, "rgba(255,245,225,1)"); g.addColorStop(0.25, "rgba(255,220,170,0.6)"); g.addColorStop(1, "rgba(255,220,170,0)");
  x.fillStyle = g;
  x.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r = i % 2 ? 6 : 30; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  x.closePath(); x.fill();
  return new THREE.CanvasTexture(c);
})();
const sparks = [];
const sparkPool = Array.from({ length: MOBILE ? 14 : 30 }, () => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.visible = false; scene.add(sp); return sp;
});
function burstAt(point) {
  let used = 0;
  for (const sp of sparkPool) {
    if (sp.visible) continue;
    if (used++ >= 12) break;
    sp.visible = true; sp.position.copy(point);
    const s = 0.08 + Math.random() * 0.16; sp.scale.set(s, s, 1);
    sparks.push({ sp, vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.2) * 1.6, vz: (Math.random() - 0.5) * 0.8, life: 1 });
  }
}
const streak = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe6c9 }));
streak.scale.set(3.2, 0.06, 1); scene.add(streak);
let streakT = 4, streakLife = 0;

/* cursor light — your pointer literally lights the world */
const cursorLight = new THREE.PointLight(0xffe4ef, MOBILE ? 0 : 5, 8, 1.6);
scene.add(cursorLight);

/* ---------- 4f · NEON BACKDROP — electric waves that ride your scroll ---------- */
scene.add(camera); // so the backdrop can live on the camera
const neonUniforms = {
  uTime: { value: 0 },
  uP: { value: 0 },     // overall scroll progress 0..1
  uVel: { value: 0 },   // scroll rush 0..1
  uSide: { value: 0 },  // 0 pink · 1 silver
};
const neon = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 64),
  new THREE.ShaderMaterial({
    uniforms: neonUniforms,
    depthWrite: false,
    depthTest: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime, uP, uVel, uSide;
      varying vec2 vUv;
      void main(){
        vec2 uv = vUv - 0.5;
        vec3 col = mix(vec3(0.028, 0.008, 0.030), vec3(0.010, 0.012, 0.022), uSide);
        vec3 acc = vec3(0.0);
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          float y = sin(uv.x * (2.2 + fi * 1.35) + uTime * (0.16 + fi * 0.06) + uP * 14.0 + fi * 1.9) * 0.20
                  + sin(uv.x * 7.5 - uTime * 0.28 + fi * 2.3) * 0.045
                  + (fi - 1.5) * 0.17 + (uP - 0.5) * 0.55;
          float d = abs(uv.y - y);
          float g = (0.0035 + uVel * 0.009) / max(d, 0.0025);
          vec3 cPink = mix(vec3(1.0, 0.06, 0.55), vec3(0.55, 0.22, 1.0), fract(fi * 0.37 + uP * 0.8));
          vec3 cSilv = mix(vec3(0.62, 0.78, 1.0), vec3(0.92, 0.95, 1.0), fract(fi * 0.41));
          acc += g * mix(cPink, cSilv, uSide);
        }
        col += acc * (0.34 + uVel * 0.85);
        col = 1.0 - exp(-col * 1.25);              /* soft roll-off, no blowout */
        col *= 1.0 - dot(uv, uv) * 0.95;           /* vignette */
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
);
neon.renderOrder = -999;
neon.position.set(0, 0, -34);
camera.add(neon);

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
  bottleVis = 0;
  switch (zone.id) {
    case "tape-start":   bottleVis = 1; camTarget.set(0, 0.12, 4.9 - t * 0.5); lookTarget.set(0, 0.05, 0); break;
    case "picture-show": bottleVis = 1 - t; camTarget.set(0, 0.1 - t * 0.3, 4.4 - t * 3.0); lookTarget.set(0, 0.05 - t * 0.1, -t * 3); break;
    case "side-a":       camTarget.set(sway, 0, 1.4 + t * (-30 - 1.4)); lookTarget.set(sway * 0.4, 0, camTarget.z - 7); break;
    case "side-b":       camTarget.set(-sway, 0, -30 + t * -30); lookTarget.set(-sway * 0.4, 0, camTarget.z - 7); break;
    case "turntable":    vinylParked = t; camTarget.set(0, 0, -60 - t * 3.2); lookTarget.lerpVectors(new THREE.Vector3(0, 0, -67), vinylGroup.position, t); break;
  }
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
  mouseStrengthTarget = 1;
});

/* raycast: vinyl click-to-flip + frame hover */
const ray = new THREE.Raycaster();
const curLabel = document.querySelector("#cursor .c-label");
const curEl = document.getElementById("cursor");
let hoverVinyl = false;
addEventListener("click", e => {
  if (hoverVinyl) document.getElementById("flip-btn").click();
  // sparkle burst wherever you click in the world
  if (!e.target.closest("a, button, summary, .marquee, video, input")) {
    ray.setFromCamera(mouse, camera);
    burstAt(camera.position.clone().addScaledVector(ray.ray.direction, 3.4));
    if (window.STMSound) window.STMSound.tick();
  }
});

/* ---------- render loop ---------- */
const clock = new THREE.Clock();
let lastY = 0, velS = 0, hoveredFrame = -1;
function tick() {
  requestAnimationFrame(tick);
  if (document.hidden) return;
  const t = clock.getElapsedTime();
  const dt = Math.min(clock.getDelta ? 0.016 : 0.016, 0.05);

  // scroll velocity → the world reacts to how hard you scroll
  const vel = Math.abs(scrollY - lastY); lastY = scrollY;
  velS += (vel - velS) * 0.08;
  const rush = Math.min(1, velS / 60);                 // 0 idle → 1 flying
  const targetFov = 55 + rush * 9;
  if (Math.abs(camera.fov - targetFov) > 0.05) { camera.fov += (targetFov - camera.fov) * 0.1; camera.updateProjectionMatrix(); }
  mouseStrengthTarget *= 0.985;

  pathAt(scrollY);

  // hero bottle: float, slow turn, lean toward the cursor, morph with the edition
  {
    const fit = camera.aspect > 1.9 ? 0.85 : camera.aspect < 0.8 ? 0.88 : 1; // squat & narrow screens get a smaller bottle
    const vis = bottleGroup.scale.x / fit + (bottleVis - bottleGroup.scale.x / fit) * 0.06;
    bottleGroup.scale.setScalar(Math.max(0.001, vis * fit));
    bottleGroup.visible = vis > 0.02;
    if (bottleGroup.visible) {
      bottleGroup.position.y = 0.05 + Math.sin(t * 0.8) * 0.06;
      bottleGroup.rotation.y = t * 0.25 + mouse.x * 0.3;
      bottleGroup.rotation.x = -mouse.y * 0.12;
      bottleGroup.rotation.z = mouse.x * 0.05;
      const s = neonUniforms.uSide.value;
      bottleMat.transmission = 1 - s;
      bottleMat.metalness = s;
      bottleMat.roughness = 0.05 + s * 0.06;
      bottleMat.color.copy(bCol.lerpColors(B_PINK, B_CHROME, s));
      bottleMat.attenuationColor.copy(bCol);
      bottleMat.emissive.copy(bCol).multiplyScalar((1 - s) * 0.22 + 0.015);
      bRim.color.lerpColors(new THREE.Color(0xff4fa8), new THREE.Color(0xcfd8ff), s);
    }
    bKey.intensity = 30 * vis;
    bRim.intensity = 36 * vis;
    heroGlow.visible = vis > 0.02;
    heroGlow.material.opacity = (0.4 + Math.sin(t * 1.3) * 0.08) * vis;
    heroGlow.material.color.lerpColors(new THREE.Color(0xff2e94), new THREE.Color(0xa9b6cc), neonUniforms.uSide.value);
    heroGlow.scale.setScalar(Math.max(0.001, vis) * (1 + Math.sin(t * 0.9) * 0.03));
  }
  camera.position.lerp(camTarget, 0.07);
  camera.position.y += Math.sin(t * 0.55) * 0.045;      // idle breathing
  lookCur.lerp(lookTarget, 0.07);
  camera.lookAt(lookCur.x + mouse.x * 0.4, lookCur.y + mouse.y * 0.26, lookCur.z);
  camera.rotation.z += Math.sin(t * 0.4) * 0.006;       // gentle film roll
  scene.fog.color.lerp(fogColor, 0.04);
  renderer.setClearColor(scene.fog.color);

  // frames float, sway, and their halos pulse — and only exist near their corridor
  frames.forEach((f, i) => {
    f.visible = camera.position.z - f.position.z < 17;
    if (!f.visible) return;
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

  // neon backdrop rides the scroll
  neonUniforms.uTime.value = t;
  neonUniforms.uP.value = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  neonUniforms.uVel.value += (rush - neonUniforms.uVel.value) * 0.08;
  neonUniforms.uSide.value += ((document.documentElement.dataset.side === "b" ? 1 : 0) - neonUniforms.uSide.value) * 0.03;

  // nebula backdrop breathes and drifts
  nebulas.forEach(n => {
    n.position.x = n.userData.bx + Math.sin(t * 0.05 + n.userData.phase) * 2.4;
    n.position.y = n.userData.by + Math.cos(t * 0.04 + n.userData.phase) * 1.2;
    n.material.opacity = n.userData.o * (0.85 + Math.sin(t * 0.3 + n.userData.phase) * 0.15);
  });

  // chrome notes rise, spin, shimmer
  notes.forEach(nt => {
    nt.position.y += nt.userData.vy * 0.016 * (1 + rush * 1.5);
    nt.material.rotation += nt.userData.spin * 0.016;
    nt.material.opacity = 0.4 + Math.sin(t * 1.4 + nt.userData.phase) * 0.22;
    if (nt.position.y > 3.4) nt.position.y = -3.4;
  });

  // ghost mini-vinyls spin in the distance
  miniVinyls.forEach(v => {
    v.rotation.z += v.userData.spin * 0.016;
    v.position.y = v.userData.baseY + Math.sin(t * 0.5 + v.userData.phase) * 0.25;
  });

  // click sparkles
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life -= 0.022;
    s.sp.position.x += s.vx * 0.016; s.sp.position.y += s.vy * 0.016; s.sp.position.z += s.vz * 0.016;
    s.vy -= 0.03;
    s.sp.material.opacity = Math.max(0, s.life);
    if (s.life <= 0) { s.sp.visible = false; s.sp.material.opacity = 0; sparks.splice(i, 1); }
  }

  // occasional shooting streak deep in the background
  streakT -= 0.016;
  if (streakT <= 0 && streakLife <= 0) {
    streakLife = 1;
    streak.position.set(-14, 1 + Math.random() * 3, -74 - Math.random() * 12);
    streakT = 5 + Math.random() * 6;
  }
  if (streakLife > 0) {
    streakLife -= 0.014;
    streak.position.x += 0.42;
    streak.material.opacity = Math.sin(Math.max(0, streakLife) * Math.PI) * 0.7;
    if (streakLife <= 0) streak.material.opacity = 0;
  }

  // pointer light hovers just in front of the camera, at the cursor
  if (!MOBILE) {
    ray.setFromCamera(mouse, camera);
    cursorLight.position.copy(camera.position).addScaledVector(ray.ray.direction, 3.2);
    cursorLight.intensity = 4 + Math.sin(t * 2.2) * 1 + rush * 4;
  }

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

  // particles drift (scroll rush makes the weather blow harder)
  const drive = 1 + rush * 2.2;
  [[petals, -0.28, 0.4], [embers, 0.22, 0.25], [dust, -0.03, 0.06]].forEach(([p, vy, wob]) => {
    const a = p.geometry.attributes.position.array, s = p.userData.seed;
    for (let i = 0; i < s.length; i++) {
      a[i * 3 + 1] += vy * 0.016 * drive * (0.6 + Math.sin(s[i]) * 0.4);
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
    // frame hover: the picture you look at leans in and glows brighter
    const fh = ray.intersectObjects(frames, true);
    hoveredFrame = fh.length ? frames.findIndex(f => f === fh[0].object.parent) : -1;
  }
  frames.forEach((f, i) => {
    const target = i === hoveredFrame ? 1.06 : 1;
    f.scale.x += (target - f.scale.x) * 0.12;
    f.scale.y = f.scale.z = f.scale.x;
    if (i === hoveredFrame) frameGlows[i].material.opacity = Math.min(0.55, frameGlows[i].material.opacity + 0.02);
  });

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
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
