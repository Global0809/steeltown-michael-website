/* ============ STEELTOWN MICHAEL — SIDE A / SIDE B ============ */
gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const desktop = matchMedia("(min-width: 900px)").matches;

/* ============================================================
   SOUND ENGINE — fully procedural Web Audio, zero audio files.
   Ambience: tape hiss + vinyl crackle. SFX: needle drop, flip
   whoosh, UI ticks, power-on static. Gesture-gated, toggleable.
   ============================================================ */
const Sound = {
  ctx: null, master: null, amb: null, enabled: true, started: false,
  init() {
    if (this.ctx || reduced) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
  },
  noiseBuf(seconds = 2) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  },
  startAmbience() {
    if (!this.ctx || this.started) return;
    this.started = true;
    this.amb = this.ctx.createGain();
    this.amb.gain.value = this.enabled ? 1 : 0;
    this.amb.connect(this.master);
    // tape hiss: looped noise through a lowpass, very quiet
    const hiss = this.ctx.createBufferSource();
    hiss.buffer = this.noiseBuf(2); hiss.loop = true;
    const hissF = this.ctx.createBiquadFilter(); hissF.type = "lowpass"; hissF.frequency.value = 6000;
    const hissG = this.ctx.createGain(); hissG.gain.value = 0.013;
    hiss.connect(hissF).connect(hissG).connect(this.amb); hiss.start();
    // warm turntable rumble
    const rum = this.ctx.createBufferSource();
    rum.buffer = this.noiseBuf(2); rum.loop = true;
    const rumF = this.ctx.createBiquadFilter(); rumF.type = "lowpass"; rumF.frequency.value = 110;
    const rumG = this.ctx.createGain(); rumG.gain.value = 0.03;
    rum.connect(rumF).connect(rumG).connect(this.amb); rum.start();
    // vinyl crackle: randomly scheduled pops
    const pop = () => {
      if (this.ctx.state === "running" && this.enabled) {
        const s = this.ctx.createBufferSource();
        s.buffer = this.noiseBuf(0.012);
        const f = this.ctx.createBiquadFilter(); f.type = "bandpass";
        f.frequency.value = 1500 + Math.random() * 4500; f.Q.value = 2;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.04 + Math.random() * 0.12, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);
        s.connect(f).connect(g).connect(this.amb); s.start();
      }
      setTimeout(pop, 60 + Math.random() * 480);
    };
    pop();
  },
  burst(dur, filterType, freq, gain, freqEnd) {
    if (!this.ctx || !this.enabled) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf(dur);
    const f = this.ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = 1.2;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    s.connect(f).connect(g).connect(this.master); s.start();
  },
  thump(freq = 75, gain = 0.35, dur = 0.18) {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.master); o.start(); o.stop(this.ctx.currentTime + dur);
  },
  needle() { this.burst(0.06, "bandpass", 3200, 0.22); this.thump(85, 0.18, 0.1); },
  flip()   { this.burst(0.38, "bandpass", 320, 0.2, 2800); this.thump(70, 0.4, 0.22); },
  tick()   { this.burst(0.015, "highpass", 5200, 0.06); },
  power()  { this.burst(0.3, "lowpass", 8000, 0.25); this.thump(55, 0.4, 0.3); },
  setEnabled(on) {
    this.enabled = on;
    if (this.amb) this.amb.gain.linearRampToValueAtTime(on ? 1 : 0, this.ctx.currentTime + 0.4);
  },
};

// unlock audio on first gesture
const unlock = () => {
  Sound.init();
  if (Sound.ctx && Sound.ctx.state === "suspended") Sound.ctx.resume();
  Sound.startAmbience();
  removeEventListener("pointerdown", unlock);
  removeEventListener("keydown", unlock);
};
addEventListener("pointerdown", unlock);
addEventListener("keydown", unlock);

// sound toggle
const sndBtn = document.getElementById("sound-toggle");
sndBtn.addEventListener("click", () => {
  const on = !(Sound.enabled);
  Sound.setEnabled(on);
  sndBtn.querySelector("em").textContent = on ? "ON" : "OFF";
  sndBtn.setAttribute("aria-pressed", on);
  document.body.classList.toggle("sound-off", !on);
  if (on) Sound.tick();
});

/* ============ INTRO — dead TV power-on ============ */
const intro = document.getElementById("intro");
const killIntro = () => {
  if (!intro || intro.classList.contains("off")) return;
  intro.classList.add("tracking");
  Sound.power();
  setTimeout(() => { intro.classList.add("off"); setTimeout(() => intro.remove(), 500); }, 480);
};
if (reduced) intro.remove();
else { setTimeout(killIntro, 1300); intro.addEventListener("pointerdown", killIntro); }

/* ============ SIDE STATE (A = pink · B = silver) ============ */
const html = document.documentElement;
const npBtn = document.getElementById("now-playing");
const flipBtn = document.getElementById("flip-btn");
const vinyl = document.getElementById("vinyl");
const vinylImg = document.getElementById("vinyl-img");
const matrixEl = document.getElementById("matrix");
const sleeveMatrix = document.getElementById("sleeve-matrix");
const SIDES = {
  a: { np: "SIDE A — PINK", flip: "SIDE B — SILVER", matrix: "STM-PNK-100", sleeve: "STM-PNK-100 · SIDE A · 33⅓" },
  b: { np: "SIDE B — SILVER", flip: "SIDE A — PINK", matrix: "STM-SLV-100", sleeve: "STM-SLV-100 · SIDE B · 33⅓" },
};
let side = "a", flipping = false;

const EQ_HTML = `<span class="eq"><i></i><i></i><i></i></span>`;
function applySide(s) {
  side = s;
  html.dataset.side = s;
  vinylImg.src = vinylImg.dataset[s];
  npBtn.innerHTML = `NOW PLAYING · <em>${SIDES[s].np}</em>${EQ_HTML}`;
  flipBtn.innerHTML = `⟲ FLIP TO <em>${SIDES[s].flip}</em>`;
  matrixEl.textContent = `MATRIX Nº ${SIDES[s].matrix}`;
  sleeveMatrix.textContent = SIDES[s].sleeve;
  try { localStorage.setItem("stm-side", s); } catch {}
  history.replaceState(null, "", "#side-" + s);
  dispatchEvent(new CustomEvent("stm-side", { detail: { side: s } }));
}

function flipRecord() {
  if (flipping) return;
  flipping = true;
  const next = side === "a" ? "b" : "a";
  Sound.flip();
  if (document.body.classList.contains("webgl-on")) {
    // the 3D vinyl animates the flip; state applies immediately
    dispatchEvent(new CustomEvent("stm-flip", { detail: { next } }));
    applySide(next);
    setTimeout(() => (flipping = false), 700);
    return;
  }
  if (reduced) { applySide(next); flipping = false; return; }
  gsap.timeline({ onComplete: () => (flipping = false) })
    .to(vinyl, { rotationY: 90, scale: 0.94, duration: 0.32, ease: "power2.in", onComplete: () => applySide(next) })
    .set(vinyl, { rotationY: -90 })
    .to(vinyl, { rotationY: 0, scale: 1, duration: 0.42, ease: "power3.out" });
}
flipBtn.addEventListener("click", flipRecord);
vinyl.addEventListener("click", flipRecord);
npBtn.addEventListener("click", () => document.getElementById("turntable").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }));

// restore side from hash or storage (no animation)
const initSide = location.hash === "#side-b" ? "b" : location.hash === "#side-a" ? "a" : (() => { try { return localStorage.getItem("stm-side") || "a"; } catch { return "a"; } })();
if (initSide !== "a") applySide(initSide);
else npBtn.innerHTML = `NOW PLAYING · <em>${SIDES.a.np}</em>${EQ_HTML}`;

/* ============ KINETIC TYPE — split headings into rising chars ============ */
function splitChars(el, stagger = 0.028) {
  let i = 0;
  [...el.childNodes].forEach(node => {
    if (node.nodeType !== 3) return; // keep <br> etc.
    const frag = document.createDocumentFragment();
    for (const word of node.textContent.split(/(\s+)/)) {
      if (!word.trim()) { frag.appendChild(document.createTextNode(word)); continue; }
      const w = document.createElement("span");
      w.className = "chw"; // keeps the word unbreakable
      for (const c of word) {
        const s = document.createElement("span");
        s.className = "ch"; s.textContent = c;
        s.style.setProperty("--d", (i++ * stagger).toFixed(3) + "s");
        w.appendChild(s);
      }
      frag.appendChild(w);
    }
    el.replaceChild(frag, node);
  });
}
const heroH1 = document.querySelector(".hero-copy h1");
splitChars(heroH1, 0.045);
setTimeout(() => heroH1.classList.add("chars-on"), reduced ? 0 : 1500);
document.querySelectorAll(".sec-title").forEach(el => splitChars(el));

/* verses: word-level stagger */
document.querySelectorAll(".verses p").forEach(p => {
  const words = p.textContent.split(" ");
  p.innerHTML = words.map((w, i) => `<span class="w" style="--d:${(i * 0.07).toFixed(2)}s">${w}</span>`).join(" ");
});

/* marquees: duplicate content for a seamless -50% loop */
document.querySelectorAll(".marquee-track").forEach(tr => { tr.innerHTML += tr.innerHTML; });

/* films: 3D tilt toward the cursor (fine pointers) */
if (finePointer && !reduced) {
  document.querySelectorAll(".tv-frame, .home-movie").forEach(fr => {
    fr.addEventListener("pointermove", e => {
      const r = fr.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      fr.style.transform = `perspective(950px) rotateY(${px * 6}deg) rotateX(${-py * 5}deg)`;
    });
    fr.addEventListener("pointerleave", () => { fr.style.transform = ""; });
  });
}

/* ============ FILMS — custom play + chapters ============ */
function wireFilm(videoId, btnId, chapters, chapterEl) {
  const v = document.getElementById(videoId);
  const btn = document.getElementById(btnId);
  const cap = chapterEl ? document.getElementById(chapterEl) : null;
  const toggle = () => {
    if (v.paused) { v.muted = false; v.play(); btn.classList.add("hidden"); Sound.needle(); }
    else { v.pause(); btn.classList.remove("hidden"); }
  };
  btn.addEventListener("click", toggle);
  v.addEventListener("click", toggle);
  v.addEventListener("ended", () => btn.classList.remove("hidden"));
  if (chapters && cap) {
    v.addEventListener("timeupdate", () => {
      const c = chapters.filter(x => v.currentTime >= x.t).pop();
      if (c && cap.textContent !== c.label) cap.textContent = c.label;
      const bar = document.getElementById("film-bar");
      if (bar && v.duration) bar.style.width = (v.currentTime / v.duration) * 100 + "%";
    });
  }
  // pause when scrolled away
  new IntersectionObserver(e => { if (!e[0].isIntersecting && !v.paused) { v.pause(); btn.classList.remove("hidden"); } }, { threshold: 0.15 }).observe(v);
}
wireFilm("film", "film-btn", [
  { t: 0, label: "CH. 1 — THE STREET" },
  { t: 27, label: "CH. 2 — THE STAGE" },
  { t: 56, label: "CH. 3 — THE KISS" },
], "film-chapter");
wireFilm("boudoir", "boudoir-btn", null, null);

/* ============ NEEDLE-DROP SFX on accordions ============ */
document.querySelectorAll("details[data-sfx]").forEach(d =>
  d.addEventListener("toggle", () => { if (d.open) Sound.needle(); })
);
document.querySelectorAll("a, button, summary").forEach(el =>
  el.addEventListener("pointerenter", () => Sound.tick())
);

/* ============ HORIZONTAL GALLERIES — DOM fallback only.
   The WebGL world (webgl.js) replaces these; if it fails to boot
   (no WebGL / CDN blocked), we fall back to the 2D pinned galleries. */
let domGalleriesInit = false;
function initDomGalleries() {
  if (domGalleriesInit || document.body.classList.contains("webgl-on")) return;
  domGalleriesInit = true;
  gsap.matchMedia().add("(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
    [["#gallery-a", 1], ["#gallery-b", -1]].forEach(([sel, dir]) => {
      const gal = document.querySelector(sel);
      const frames = gal.querySelector(".frames");
      const dist = () => Math.max(0, frames.scrollWidth - innerWidth);
      if (dir === -1) gsap.set(frames, { x: () => -dist() });
      gsap.to(frames, {
        x: () => (dir === 1 ? -dist() : 0),
        ease: "none",
        scrollTrigger: { trigger: gal, pin: gal.closest(".side-chapter"), scrub: 1, start: "center center", end: () => "+=" + dist(), invalidateOnRefresh: true },
      });
      gal.querySelectorAll(".frame img").forEach(img => {
        gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: { trigger: gal.closest(".side-chapter"), scrub: 1, start: "top bottom", end: "bottom top" } });
      });
    });
  });
}
addEventListener("stm-webgl", e => { if (!e.detail.ok) initDomGalleries(); else setTimeout(() => ScrollTrigger.refresh(), 100); });
setTimeout(() => { if (!document.body.classList.contains("webgl-on")) initDomGalleries(); }, 3000);

/* verse lines light up as you fly through each corridor (3D mode) */
document.querySelectorAll(".side-chapter").forEach(sec => {
  const lines = sec.querySelectorAll(".verses p");
  if (!lines.length) return;
  addEventListener("scroll", () => {
    const r = sec.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    lines.forEach((l, i) => l.classList.toggle("lit", t > (i + 0.35) / (lines.length + 0.7) && t < 0.98));
  }, { passive: true });
});

/* ============ SCROLL AMBIENT UI — tape counter + tonearm + glitch ============ */
const counter = document.querySelector("#tape-counter span");
const taArm = document.getElementById("ta-arm");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const p = Math.min(1, scrollY / (document.documentElement.scrollHeight - innerHeight));
    const t = Math.round(p * 272); // fake 4:32 runtime
    counter.textContent = String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
    if (taArm) taArm.style.transform = `rotate(${-14 + p * 34}deg)`;
    ticking = false;
  });
}, { passive: true });

// section-title glitch on entry (once each)
if (!reduced) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("chars-on");
      e.target.classList.add("glitching");
      Sound.burst && Sound.burst(0.08, "highpass", 3000, 0.05);
      setTimeout(() => e.target.classList.remove("glitching"), 500);
      io.unobserve(e.target);
    }
  }), { threshold: 0.6 });
  document.querySelectorAll(".glitchable").forEach(el => io.observe(el));
}

// crown draw-on + vinyl spin only in view
new IntersectionObserver(e => e[0].isIntersecting && e[0].target.classList.add("crown-drawn"), { threshold: 0.5 })
  .observe(document.querySelector(".credits"));
new IntersectionObserver(e => vinyl.classList.toggle("paused", !e[0].isIntersecting), { threshold: 0.05 })
  .observe(vinyl);

/* ============ CUSTOM CURSOR — the stylus (fine pointers only) ============ */
if (finePointer && !reduced) {
  document.body.classList.add("has-cursor");
  const cur = document.getElementById("cursor");
  const label = cur.querySelector(".c-label");
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; });
  (function loop() {
    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
    cur.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener("pointerover", e => {
    const t = e.target.closest("[data-cursor]");
    if (t) { label.textContent = t.dataset.cursor; cur.classList.add("active"); }
    else if (e.target.closest("a, button, summary")) { label.textContent = "●"; cur.classList.add("active"); }
    else cur.classList.remove("active");
  });
}

/* ============ simple reveals for sections (cheap, no pin) ============ */
if (!reduced) {
  gsap.utils.toArray(".panel > .sec-title, .sec-sub, .tv-frame, .home-movie, .deck, .pressing, .liner-grid, .sleeve-grid").forEach(el => {
    gsap.from(el, { opacity: 0, y: 34, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%" } });
  });
}
