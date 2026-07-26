/* STEELTOWN MICHAEL — one continuous 3D world.
   Dimension 1: hot-pink refractive glass in white light.
   Dimension 2: liquid chrome in a black void with harsh rims. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/* ================= RENDERER / SCENE ================= */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 0.25, 4.6);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* ================= LIGHT RIG ================= */
const ambient = new THREE.AmbientLight(0xffffff, 1.3);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(2.5, 4, 3);
scene.add(keyLight);

// harsh white rims for the chrome dimension (rise from 0)
const rimL = new THREE.DirectionalLight(0xffffff, 0);
rimL.position.set(-4, 1.4, -2.6);
const rimR = new THREE.DirectionalLight(0xffffff, 0);
rimR.position.set(4, 2.2, -2.2);
scene.add(rimL, rimR);

/* ================= THE BOTTLE (procedural) ================= */
const bottle = new THREE.Group();
scene.add(bottle);

// -- body: sleek cylinder, morphing glass<->chrome on ONE physical material
const bodyMat = new THREE.MeshPhysicalMaterial({
  color: 0xff2e94,
  transmission: 1,
  thickness: 1.0,
  ior: 1.45,
  roughness: 0.04,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  attenuationColor: new THREE.Color(0xff007f),
  attenuationDistance: 3.0,
  envMapIntensity: 1.5,
  specularIntensity: 1,
});
const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.66, 1.9, 128, 1), bodyMat);
body.position.y = -0.25;
bottle.add(body);

// -- subtle sculpted shoulders: a squashed torus where body meets neck
const shoulder = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.16, 32, 96), bodyMat);
shoulder.rotation.x = Math.PI / 2;
shoulder.position.y = 0.72;
shoulder.scale.y = 0.7;
bottle.add(shoulder);

// -- neck collar: always chrome
const collarMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 1, roughness: 0.12, envMapIntensity: 1.5 });
const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.2, 0.24, 64), collarMat);
collar.position.y = 0.92;
bottle.add(collar);

// -- the crown cap: a sphere sculpted with dense procedural curls
const capGeo = new THREE.SphereGeometry(0.46, 128, 128);
{
  const pos = capGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    // two interfering high-frequency fields -> tight curl clusters
    const a = Math.sin(n.x * 31.4) * Math.sin(n.y * 27.2) * Math.sin(n.z * 33.8);
    const b = Math.sin(n.x * 61.0 + 1.3) * Math.sin(n.y * 57.5 + 2.1) * Math.sin(n.z * 63.2 + 0.7);
    const h = Math.abs(Math.sin((n.x * 127.1 + n.y * 311.7 + n.z * 74.7))) * 0.02;
    const r = 0.46 + a * 0.02 + b * 0.016 + h;
    pos.setXYZ(i, n.x * r, n.y * r, n.z * r);
  }
  capGeo.computeVertexNormals();
}
const capMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, metalness: 0.4, roughness: 0.38, envMapIntensity: 1.2 });
const cap = new THREE.Mesh(capGeo, capMat);
cap.position.y = 1.34;
cap.scale.set(1, 1.06, 1);
bottle.add(cap);

/* ================= STARFIELD (chrome dimension only) ================= */
const starGeo = new THREE.BufferGeometry();
{
  const n = 220, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 26;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 16;
    arr[i * 3 + 2] = -4 - Math.random() * 22;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
}
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0, depthWrite: false });
scene.add(new THREE.Points(starGeo, starMat));

/* ================= SCROLL -> WORLD STATE ================= */
const WHITE = new THREE.Color(0xffffff);
const BLACK = new THREE.Color(0x000000);
const PINK = new THREE.Color(0xff007f);
const CHROME = new THREE.Color(0xe0e0e0);
const bg = new THREE.Color();
const bodyCol = new THREE.Color();

let target = 0, sp = 0; // raw + smoothed scroll progress
const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
addEventListener("scroll", () => { target = scrollY / Math.max(1, maxScroll()); }, { passive: true });

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* mouse parallax */
const mouse = { x: 0, y: 0 };
addEventListener("pointermove", e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
});

/* ================= SOUND — pure Web Audio synthesis ================= */
const Sound = {
  ctx: null, oscA: null, oscB: null, sub: null, filter: null, drone: null,
  start() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const c = this.ctx;
    const master = c.createGain(); master.gain.value = 0.55; master.connect(c.destination);
    this.drone = c.createGain(); this.drone.gain.value = 0;
    this.filter = c.createBiquadFilter(); this.filter.type = "lowpass"; this.filter.frequency.value = 640; this.filter.Q.value = 0.8;
    this.drone.connect(this.filter).connect(master);

    const mk = (freq, gain) => {
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = freq;
      const g = c.createGain(); g.gain.value = gain;
      o.connect(g).connect(this.drone); o.start();
      return o;
    };
    this.oscA = mk(70, 0.5);
    this.oscB = mk(70.6, 0.42);      // slight detune -> slow cinematic beating
    this.sub = mk(35, 0.55);
    this.drone.gain.linearRampToValueAtTime(0.5, c.currentTime + 2.4);
    this.master = master;
  },
  bind(p) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const f = 70 - p * 36;           // pink 70Hz -> chrome 34Hz: the pitch falls into the dark
    this.oscA.frequency.setTargetAtTime(f, t, 0.08);
    this.oscB.frequency.setTargetAtTime(f * 1.009, t, 0.08);
    this.sub.frequency.setTargetAtTime(f / 2, t, 0.08);
    this.filter.frequency.setTargetAtTime(680 - p * 470, t, 0.08);
  },
  tick() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(3600, t);
    o.frequency.exponentialRampToValueAtTime(2100, t + 0.05);
    const g = c.createGain();
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1500;
    o.connect(hp).connect(g).connect(this.master);
    o.start(t); o.stop(t + 0.1);
  },
};

/* ================= ENTER GATE ================= */
const enterEl = document.getElementById("enter");
enterEl.addEventListener("click", () => {
  Sound.start();
  document.body.classList.remove("locked");
  enterEl.classList.add("off");
  setTimeout(() => enterEl.remove(), 1200);
  gsap.to(".ui", { opacity: 1, duration: 1.6, stagger: 0.12, ease: "power2.out", delay: 0.25 });
  gsap.to("#credit", { opacity: 0.6, duration: 1.6, delay: 0.9 });
  gsap.from(bottle.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 2.2, ease: "power3.out" });
  gsap.from(bottle.rotation, { y: -2.4, duration: 2.2, ease: "power3.out" });
}, { once: true });

/* button: synthesized tick on hover */
const acquire = document.getElementById("acquire");
acquire.addEventListener("pointerenter", () => Sound.tick());

/* scroll cue fades after first movement */
let cued = false;
addEventListener("scroll", () => {
  if (!cued && scrollY > 30) { cued = true; gsap.to("#cue", { opacity: 0, duration: 0.8 }); }
}, { passive: true });

/* ================= FRAME LOOP ================= */
const progressBar = document.querySelector("#progress i");
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const t = clock.getElapsedTime();

  sp += (target - sp) * 0.055;                       // butter
  const m = smooth(0.38, 0.62, sp);                  // the material shift, centered at 50%

  /* world morph: pink glass in white light -> chrome in the black void */
  bg.lerpColors(WHITE, BLACK, m);
  scene.background = bg;
  bodyMat.transmission = 1 - m;
  bodyMat.metalness = m;
  bodyMat.roughness = 0.04 + m * 0.02;
  bodyMat.color.copy(bodyCol.lerpColors(PINK, CHROME, m));
  bodyMat.attenuationColor.copy(bodyCol);
  bodyMat.envMapIntensity = 1.5 + m * 0.3;           // chrome stays liquid, not dead
  bodyMat.clearcoat = 1 - m * 0.6;
  ambient.intensity = 1.3 - m * 1.22;
  keyLight.intensity = 2.2 - m * 1.9;
  rimL.intensity = m * 5.2;
  rimR.intensity = m * 4.4;
  starMat.opacity = m * 0.85;
  capMat.color.setScalar(0.043 + m * 0.05);
  capMat.envMapIntensity = 0.7 + m * 0.5;

  /* camera orbit tied to scroll + idle drift + mouse parallax */
  const az = sp * Math.PI * 2.1 + t * 0.03;
  const rad = 4.6 - Math.sin(sp * Math.PI) * 1.1;    // pushes in through the transition
  camera.position.x = Math.sin(az) * rad + mouse.x * 0.18;
  camera.position.z = Math.cos(az) * rad;
  camera.position.y = 0.35 - sp * 0.7 + Math.sin(t * 0.5) * 0.05 - mouse.y * 0.14;
  camera.lookAt(0, 0.18, 0);

  /* the bottle turns with you, floats forever */
  bottle.rotation.y = sp * Math.PI * 3 + t * 0.12;
  bottle.position.y = Math.sin(t * 0.8) * 0.05;

  Sound.bind(sp);
  progressBar.style.height = (sp * 100).toFixed(1) + "%";

  renderer.render(scene, camera);
}
frame();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
