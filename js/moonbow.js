// Moonbow's upcoming page (/moonbow/): the hero's night sky (twinkling stars and drifting fireflies over the key
// art), a little pointer parallax, the screenshot and chapter rails' arrow buttons, and the screenshot zoom.
// Everything here is decoration: the page reads the same without it, and reduced motion turns the movement off.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  // Night sky: stars twinkle in the upper half, fireflies wander low and warm.
  const hero = $("[data-mb-hero]");
  const canvas = hero && $(".mb-hero__sky", hero);
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, stars = [], flies = [], raf = 0, visible = true;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = w * h;
      stars = Array.from({ length: Math.round(area / 9000) }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.55, r: Math.random() * 1.4 + 0.4,
        p: Math.random() * Math.PI * 2, s: Math.random() * 1.5 + 0.6,
      }));
      flies = Array.from({ length: Math.round(area / 38000) + 8 }, () => ({
        x: Math.random() * w, y: h * (0.45 + Math.random() * 0.55), a: Math.random() * Math.PI * 2,
        v: Math.random() * 0.35 + 0.15, p: Math.random() * Math.PI * 2, r: Math.random() * 2 + 1.5,
        hue: Math.random() < 0.7 ? "255,214,110" : "190,170,255",
      }));
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;
      for (const s of stars) {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.s + s.p));
        ctx.fillStyle = `rgba(255,248,230,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
        if (s.r > 1.5 && a > 0.85) { // the brightest ones get a little cross sparkle
          ctx.strokeStyle = `rgba(255,248,230,${(a - 0.85) * 4})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(s.x - 6, s.y); ctx.lineTo(s.x + 6, s.y); ctx.moveTo(s.x, s.y - 6); ctx.lineTo(s.x, s.y + 6); ctx.stroke();
        }
      }
      for (const f of flies) {
        f.a += (Math.sin(time * 0.7 + f.p) * 0.02);
        f.x += Math.cos(f.a) * f.v; f.y += Math.sin(f.a) * f.v * 0.6 - 0.05;
        if (f.x < -10) f.x = w + 10; if (f.x > w + 10) f.x = -10;
        if (f.y < h * 0.35) f.a = Math.PI / 2; if (f.y > h + 10) f.y = h * 0.5;
        const glow = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 2.2 + f.p));
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
        g.addColorStop(0, `rgba(${f.hue},${0.9 * glow})`); g.addColorStop(1, `rgba(${f.hue},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 6, 0, 6.283); ctx.fill();
      }
      raf = visible ? requestAnimationFrame(draw) : 0;
    };
    size();
    addEventListener("resize", () => { cancelAnimationFrame(raf); size(); if (visible) raf = requestAnimationFrame(draw); });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    }).observe(hero);
    raf = requestAnimationFrame(draw);

    if (finePointer) { // the key art leans away from the pointer a touch
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        hero.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      hero.addEventListener("pointerleave", () => { hero.style.setProperty("--px", 0); hero.style.setProperty("--py", 0); });
    }
  }

  // Rails: the arrow buttons scroll by most of a screen.
  $$("[data-rail-nav]").forEach((nav) => {
    const rail = $(`[data-rail="${nav.dataset.railNav}"]`);
    if (!rail) return;
    $$("button", nav).forEach((b) => b.addEventListener("click", () => {
      rail.scrollBy({ left: Number(b.dataset.dir) * rail.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
    }));
  });

  // Screenshot zoom: a dialog with the bigger image; Escape, the close button or a click outside closes it.
  const dialog = $("[data-zoom-dialog]");
  if (dialog && dialog.showModal) {
    const img = $("img", dialog);
    $$("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
      img.src = b.dataset.zoom;
      img.alt = $("img", b).alt;
      dialog.showModal();
    }));
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }
})();
