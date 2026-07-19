// reflect site — reveals + copy buttons. No dependencies.

// Hero elements reveal on load, staggered via .dN delays.
requestAnimationFrame(function () {
  requestAnimationFrame(function () {
    document.querySelectorAll(".reveal-now").forEach(function (el) {
      el.classList.add("in");
    });
  });
});

// Scrolled sections reveal on intersection.
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    }
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

// Copy-to-clipboard.
document.querySelectorAll(".copy-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    navigator.clipboard.writeText(btn.dataset.copy).then(function () {
      var prev = btn.textContent;
      btn.textContent = "COPIED!";
      setTimeout(function () { btn.textContent = prev; }, 1400);
    });
  });
});
