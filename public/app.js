// reflect site — reveals, copy buttons, and retro Web Audio cues.
// No dependencies, no audio files: every sound is synthesized live.
// Cues fire only on user gestures (autoplay-safe); the floating mute
// button silences everything and the choice persists.

// ---------- reveals ----------
requestAnimationFrame(function () {
  requestAnimationFrame(function () {
    document.querySelectorAll(".reveal-now").forEach(function (el) {
      el.classList.add("in");
    });
  });
});

var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    }
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

// ---------- audio: synthesized atomic-age cues ----------
var muted = false;
try { muted = localStorage.getItem("reflect-muted") === "true"; } catch (e) {}
var ctx = null;

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function envGain(ac, t0, peak, attack, release) {
  var g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
  g.connect(ac.destination);
  return g;
}

// Crisp mechanical tick — button presses.
function cueTick() {
  if (muted) return;
  var ac = audio(), t = ac.currentTime;
  var o = ac.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(1900, t);
  o.frequency.exponentialRampToValueAtTime(700, t + 0.045);
  o.connect(envGain(ac, t, 0.045, 0.004, 0.06));
  o.start(t);
  o.stop(t + 0.08);
}

// Two-note confirmation chime — successful copy.
function cueChime() {
  if (muted) return;
  var ac = audio(), t = ac.currentTime;
  [660, 990].forEach(function (f, i) {
    var o = ac.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    o.connect(envGain(ac, t + i * 0.09, 0.055, 0.012, 0.35));
    o.start(t + i * 0.09);
    o.stop(t + i * 0.09 + 0.4);
  });
}

// Theremin bloom — played when sound is switched back on.
function cueBloom() {
  var ac = audio(), t = ac.currentTime;
  var o = ac.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(440, t + 0.5);
  o.frequency.exponentialRampToValueAtTime(392, t + 0.9);
  var v = ac.createOscillator();
  v.frequency.value = 5.5;
  var vg = ac.createGain(); vg.gain.value = 6;
  v.connect(vg); vg.connect(o.frequency);
  o.connect(envGain(ac, t, 0.05, 0.25, 0.9));
  o.start(t); v.start(t);
  o.stop(t + 1.3); v.stop(t + 1.3);
}

// Filtered-noise rocket whoosh — fleet section, once per visit.
// Only fires after some gesture has already unlocked audio.
function cueWhoosh() {
  if (muted || !ctx) return;
  var ac = audio(), t = ac.currentTime;
  var len = Math.floor(ac.sampleRate * 0.9);
  var buf = ac.createBuffer(1, len, ac.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  var src = ac.createBufferSource();
  src.buffer = buf;
  var f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(220, t);
  f.frequency.exponentialRampToValueAtTime(1600, t + 0.7);
  src.connect(f);
  f.connect(envGain(ac, t, 0.05, 0.15, 0.7));
  src.start(t);
}

// Floating mute button
var muteBtn = document.getElementById("mute");
function renderMute() {
  if (muteBtn) {
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    muteBtn.setAttribute("aria-label", muted ? "Unmute sound effects" : "Mute sound effects");
  }
}
if (muteBtn) {
  renderMute();
  muteBtn.addEventListener("click", function () {
    muted = !muted;
    try { localStorage.setItem("reflect-muted", muted ? "true" : "false"); } catch (e) {}
    renderMute();
    if (!muted) cueBloom();
  });
}

// Fleet whoosh, once
var fleet = document.querySelector(".fleet");
if (fleet) {
  var whooshed = false;
  new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !whooshed) {
        whooshed = true;
        cueWhoosh();
        obs.disconnect();
      }
    });
  }, { threshold: 0.35 }).observe(fleet);
}

// ---------- copy buttons ----------
document.querySelectorAll(".copy-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    cueTick();
    navigator.clipboard.writeText(btn.dataset.copy).then(function () {
      cueChime();
      var prev = btn.textContent;
      btn.textContent = "COPIED!";
      setTimeout(function () { btn.textContent = prev; }, 1400);
    });
  });
});
