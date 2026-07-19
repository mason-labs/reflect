// reflect site — reveals, copy buttons, and retro Web Audio.
// No dependencies, no audio files: FX cues and the ambient music bed are
// all synthesized live. Music and SFX are independent, each persisted.

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

// ---------- audio state (persisted independently) ----------
function pref(key, fallback) {
  try {
    var v = localStorage.getItem(key);
    return v === null ? fallback : v === "on";
  } catch (e) { return fallback; }
}
var sfxOn = pref("reflect-sfx", true);
var musicOn = pref("reflect-music", false);
try { // migrate the old single mute flag
  if (localStorage.getItem("reflect-muted") === "true") {
    sfxOn = false;
    localStorage.removeItem("reflect-muted");
    localStorage.setItem("reflect-sfx", "off");
  }
} catch (e) {}

var ctx = null;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function envGain(ac, dest, t0, peak, attack, release) {
  var g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
  g.connect(dest);
  return g;
}

// ---------- SFX cues ----------
function cueTick() {
  if (!sfxOn) return;
  var ac = audio(), t = ac.currentTime;
  var o = ac.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(1900, t);
  o.frequency.exponentialRampToValueAtTime(700, t + 0.045);
  o.connect(envGain(ac, ac.destination, t, 0.045, 0.004, 0.06));
  o.start(t); o.stop(t + 0.08);
}

function cueChime() {
  if (!sfxOn) return;
  var ac = audio(), t = ac.currentTime;
  [660, 990].forEach(function (f, i) {
    var o = ac.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    o.connect(envGain(ac, ac.destination, t + i * 0.09, 0.055, 0.012, 0.35));
    o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.4);
  });
}

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
  o.connect(envGain(ac, ac.destination, t, 0.05, 0.25, 0.9));
  o.start(t); v.start(t);
  o.stop(t + 1.3); v.stop(t + 1.3);
}

function cueWhoosh() {
  if (!sfxOn || !ctx) return;
  var ac = audio(), t = ac.currentTime;
  var len = Math.floor(ac.sampleRate * 0.9);
  var buf = ac.createBuffer(1, len, ac.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  var src = ac.createBufferSource();
  src.buffer = buf;
  var f = ac.createBiquadFilter();
  f.type = "bandpass"; f.Q.value = 1.2;
  f.frequency.setValueAtTime(220, t);
  f.frequency.exponentialRampToValueAtTime(1600, t + 0.7);
  src.connect(f);
  f.connect(envGain(ac, ac.destination, t, 0.05, 0.15, 0.7));
  src.start(t);
}

// ---------- ambient music bed ----------
// A quiet atomic-age nocturne: slow detuned pad breathing under sparse
// pentatonic twinkles with a soft echo. Starts/stops with a fade.
var bed = null;

function startMusic() {
  if (bed) return;
  var ac = audio(), t = ac.currentTime;
  var master = ac.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.16, t + 2.5);
  master.connect(ac.destination);

  var lp = ac.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 820; lp.Q.value = 0.4;
  var padGain = ac.createGain(); padGain.gain.value = 0.22;
  lp.connect(padGain); padGain.connect(master);

  var oscs = [110, 110.6, 165.1, 220.4].map(function (f) {
    var o = ac.createOscillator();
    o.type = "sine"; o.frequency.value = f;
    o.connect(lp); o.start(t);
    return o;
  });

  // slow breathing on the pad
  var lfo = ac.createOscillator();
  lfo.frequency.value = 0.07;
  var lfoGain = ac.createGain(); lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain); lfoGain.connect(padGain.gain);
  lfo.start(t);

  // echo bus for twinkles
  var delay = ac.createDelay(1.2);
  delay.delayTime.value = 0.42;
  var fb = ac.createGain(); fb.gain.value = 0.35;
  delay.connect(fb); fb.connect(delay);
  var wet = ac.createGain(); wet.gain.value = 0.4;
  delay.connect(wet); wet.connect(master);

  var SCALE = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  var timer = setInterval(function () {
    if (!bed) return;
    if (Math.random() < 0.35) return; // rests keep it sparse
    var t2 = ac.currentTime;
    var f = SCALE[Math.floor(Math.random() * SCALE.length)];
    var o = ac.createOscillator();
    o.type = "sine"; o.frequency.value = f;
    var g = envGain(ac, master, t2, 0.11, 0.02, 1.4);
    o.connect(g); g.connect(delay);
    o.start(t2); o.stop(t2 + 1.5);
  }, 2600);

  bed = { master: master, oscs: oscs, lfo: lfo, timer: timer };
}

function stopMusic() {
  if (!bed) return;
  var b = bed; bed = null;
  clearInterval(b.timer);
  var ac = audio(), t = ac.currentTime;
  b.master.gain.cancelScheduledValues(t);
  b.master.gain.setValueAtTime(Math.max(b.master.gain.value, 0.0002), t);
  b.master.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  setTimeout(function () {
    b.oscs.forEach(function (o) { o.stop(); });
    b.lfo.stop();
    b.master.disconnect();
  }, 1400);
}

// ---------- sound control flyout ----------
var soundBtn = document.getElementById("sound-btn");
var soundPanel = document.getElementById("sound-panel");
var swMusic = document.getElementById("sw-music");
var swSfx = document.getElementById("sw-sfx");

function renderSound() {
  var anyOn = musicOn || sfxOn;
  if (soundBtn) {
    soundBtn.classList.toggle("all-off", !anyOn);
    soundBtn.setAttribute("aria-label", "Sound settings" + (anyOn ? "" : " (all off)"));
  }
  if (swMusic) swMusic.setAttribute("aria-checked", musicOn ? "true" : "false");
  if (swSfx) swSfx.setAttribute("aria-checked", sfxOn ? "true" : "false");
}

function save(key, on) {
  try { localStorage.setItem(key, on ? "on" : "off"); } catch (e) {}
}

if (soundBtn && soundPanel) {
  renderSound();
  if (musicOn) {
    // Autoplay policy: the bed can only start after a first gesture.
    var arm = function () {
      if (musicOn) startMusic();
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);
  }

  soundBtn.addEventListener("click", function () {
    var open = soundPanel.classList.toggle("open");
    soundBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) cueTick();
  });

  swMusic.addEventListener("click", function () {
    musicOn = !musicOn;
    save("reflect-music", musicOn);
    renderSound();
    if (musicOn) startMusic(); else stopMusic();
  });

  swSfx.addEventListener("click", function () {
    sfxOn = !sfxOn;
    save("reflect-sfx", sfxOn);
    renderSound();
    if (sfxOn) cueBloom();
  });

  document.addEventListener("click", function (e) {
    if (!soundPanel.classList.contains("open")) return;
    if (soundPanel.contains(e.target) || soundBtn.contains(e.target)) return;
    soundPanel.classList.remove("open");
    soundBtn.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && soundPanel.classList.contains("open")) {
      soundPanel.classList.remove("open");
      soundBtn.setAttribute("aria-expanded", "false");
    }
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
