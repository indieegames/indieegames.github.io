// Indiee website: small progressive enhancements. Every page reads fine without this file.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const whenVisible = (el, fn) => {
    if (!("IntersectionObserver" in window)) return fn(true);
    new IntersectionObserver(([e]) => fn(e.isIntersecting)).observe(el);
  };

  // Nav: hides while scrolling down, comes back on the way up; menu button on small screens.
  const nav = $("[data-nav]");
  if (nav) {
    const toggle = $("[data-nav-toggle]", nav);
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    let last = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      nav.classList.toggle("is-hidden", y > last && y > 260 && !nav.classList.contains("is-open"));
      last = y;
    }, { passive: true });
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    $$(".nav__links a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
  }

  // Headline letters pop in one by one (the h1 keeps its aria-label).
  let letter = 0;
  $$("[data-split]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    for (const ch of text) {
      if (ch === " ") { el.append(" "); continue; }
      const span = document.createElement("span");
      span.className = "ch";
      span.textContent = ch;
      span.style.setProperty("--i", letter++);
      el.append(span);
    }
  });

  // Reveal on scroll, staggered between siblings.
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    reveals.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
      const k = siblings.indexOf(el);
      if (k > 0) el.style.setProperty("--delay", `${Math.min(k, 6) * 80}ms`);
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // Home hero: confetti and Dee lean towards the pointer.
  const hero = $("[data-hero]");
  if (hero && finePointer && !reduce) {
    let raf = 0, mx = 0, my = 0;
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      my = ((e.clientY - r.top) / r.height) * 2 - 1;
      raf ||= requestAnimationFrame(() => {
        hero.style.setProperty("--mx", mx.toFixed(3));
        hero.style.setProperty("--my", my.toFixed(3));
        raf = 0;
      });
    });
    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--mx", "0");
      hero.style.setProperty("--my", "0");
    });
  }

  // Dee: every press is a new pose and a new line.
  const dee = $("[data-dee]");
  if (dee) {
    const img = $("[data-dee-img]", dee);
    const bubble = $("[data-dee-bubble]");
    const poses = [
      ["wave", "Hi! I'm Dee."], ["cheer", "Big fun, incoming!"], ["jump", "Boing."],
      ["wink", "Psst. Keep clicking."], ["lantern", "It's dark out there…"], ["play", "One more run?"],
      ["run", "Brb, chasing bugs."], ["create", "Making something cool."], ["idle", "Okay, that's every pose."],
    ];
    const preload = () => poses.forEach(([p]) => { new Image().src = `/brand/dee/${p}.svg`; });
    ("requestIdleCallback" in window ? requestIdleCallback : setTimeout)(preload);
    let n = 0;
    dee.addEventListener("click", () => {
      n = (n + 1) % poses.length;
      img.src = `/brand/dee/${poses[n][0]}.svg`;
      bubble.textContent = poses[n][1];
      for (const el of [dee, bubble]) { el.classList.remove("is-pop"); void el.offsetWidth; el.classList.add("is-pop"); }
    });
  }

  // Game card: a lantern light follows the pointer, and wanders on its own otherwise.
  $$("[data-lantern]").forEach((card) => {
    if (reduce) return;
    let px = 0, py = 0, active = false, cx = -1, cy = -1, running = false;
    const t0 = performance.now();
    if (finePointer) {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        px = e.clientX - r.left; py = e.clientY - r.top; active = true;
      });
      card.addEventListener("pointerleave", () => { active = false; });
    }
    const tick = () => {
      if (!running) return;
      const w = card.clientWidth, h = card.clientHeight, t = (performance.now() - t0) / 1000;
      const tx = active ? px : w * (0.68 + 0.16 * Math.sin(t * 0.45));
      const ty = active ? py : h * (0.4 + 0.16 * Math.sin(t * 0.7 + 1));
      if (cx < 0) { cx = tx; cy = ty; }
      cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
      card.style.setProperty("--lx", `${cx.toFixed(1)}px`);
      card.style.setProperty("--ly", `${cy.toFixed(1)}px`);
      requestAnimationFrame(tick);
    };
    whenVisible(card, (v) => { const was = running; running = v; if (v && !was) requestAnimationFrame(tick); });
  });

  // Sticker board: drag Dee around.
  $$("[data-board]").forEach((board) => {
    let z = 10;
    $$(".sticker", board).forEach((s) => {
      s.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        s.setPointerCapture(e.pointerId);
        s.classList.add("is-dragging");
        s.style.zIndex = ++z;
        const bw = board.clientWidth, bh = board.clientHeight;
        const start = { x: e.clientX, y: e.clientY, l: s.offsetLeft, t: s.offsetTop };
        const move = (ev) => {
          const l = Math.max(-s.offsetWidth * 0.3, Math.min(bw - s.offsetWidth * 0.7, start.l + ev.clientX - start.x));
          const t = Math.max(-s.offsetHeight * 0.3, Math.min(bh - s.offsetHeight * 0.7, start.t + ev.clientY - start.y));
          s.style.left = `${(l / bw) * 100}%`;
          s.style.top = `${(t / bh) * 100}%`;
        };
        const up = () => {
          s.classList.remove("is-dragging");
          s.removeEventListener("pointermove", move);
          s.removeEventListener("pointerup", up);
          s.removeEventListener("pointercancel", up);
        };
        s.addEventListener("pointermove", move);
        s.addEventListener("pointerup", up);
        s.addEventListener("pointercancel", up);
      });
    });
  });

  // Copy the email address.
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const label = b.textContent;
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent = "Copied!";
    } catch {
      getSelection().selectAllChildren($("[data-email]"));
      b.textContent = "Selected";
    }
    setTimeout(() => { b.textContent = label; }, 1800);
  }));

  // Dialogs: trailer and screenshots.
  $$("dialog").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    $("[data-modal-close]", d)?.addEventListener("click", () => d.close());
    d.addEventListener("close", () => $$("video", d).forEach((v) => v.pause()));
  });
  const trailer = $("[data-trailer-modal]");
  $$("[data-trailer]").forEach((b) => b.addEventListener("click", () => {
    if (!trailer || !trailer.showModal) { location.href = "/last-lantern/#trailer"; return; }
    const v = $("video", trailer);
    if (!v.getAttribute("src")) v.src = v.dataset.src;
    trailer.showModal();
    v.play().catch(() => {});
  }));
  $$("[data-player]").forEach((p) => {
    const v = $("video", p);
    $("[data-play]", p).addEventListener("click", () => {
      v.src = v.dataset.src;
      v.controls = true;
      p.classList.add("is-playing");
      v.play().catch(() => {});
      v.focus();
    });
  });

  // Last Lantern heroes: press to see the Ascended form.
  $$("[data-hero-card]").forEach((c) => c.addEventListener("click", () => {
    c.setAttribute("aria-pressed", String(c.getAttribute("aria-pressed") !== "true"));
  }));

  // Screenshot strip and lightbox.
  const gallery = $("[data-gallery]");
  if (gallery) {
    const step = () => ($(".shot", gallery).offsetWidth + 20) * (matchMedia("(max-width: 620px)").matches ? 1 : 1.5);
    const behavior = reduce ? "auto" : "smooth";
    $("[data-gallery-prev]")?.addEventListener("click", () => gallery.scrollBy({ left: -step(), behavior }));
    $("[data-gallery-next]")?.addEventListener("click", () => gallery.scrollBy({ left: step(), behavior }));
    const box = $("[data-lightbox]"), big = $("[data-lightbox-img]");
    $$(".shot", gallery).forEach((s) => s.addEventListener("click", () => {
      big.src = s.dataset.full;
      big.alt = $("img", s).alt;
      box.showModal();
    }));
  }

  // Last Lantern tagline types itself out (screen readers get the whole line at once).
  $$("[data-type]").forEach((el) => {
    if (reduce) return;
    const full = el.textContent.trim();
    el.innerHTML = "";
    const sr = Object.assign(document.createElement("span"), { className: "sr", textContent: full });
    const shown = document.createElement("span");
    shown.setAttribute("aria-hidden", "true");
    el.append(sr, shown);
    let k = 0;
    const step = () => { shown.textContent = full.slice(0, ++k); if (k < full.length) setTimeout(step, 42); };
    setTimeout(step, 600);
  });

  // Rising embers behind the Last Lantern hero: square, like the game's pixels.
  const canvas = $("[data-embers] canvas");
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, running = false;
    const parts = [];
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (p) => Object.assign(p, {
      x: Math.random() * w, y: h + Math.random() * 40, size: 2 + Math.round(Math.random() * 3),
      vy: 0.25 + Math.random() * 0.8, vx: (Math.random() - 0.5) * 0.25, life: 0, max: 360 + Math.random() * 520,
      hue: 22 + Math.random() * 26, ph: Math.random() * 6.28,
    });
    resize();
    addEventListener("resize", resize);
    for (let k = 0; k < Math.round(Math.min(110, w / 12)); k++) {
      const p = spawn({});
      p.y = Math.random() * h; p.life = Math.random() * p.max;
      parts.push(p);
    }
    const draw = (t) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.life++;
        p.y -= p.vy;
        p.x += p.vx + Math.sin(t / 1100 + p.ph) * 0.22;
        if (p.life > p.max || p.y < -12) spawn(p);
        const a = Math.sin(Math.PI * Math.min(p.life / p.max, 1));
        const x = Math.round(p.x), y = Math.round(p.y), s = p.size;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${(a * 0.16).toFixed(3)})`;
        ctx.fillRect(x - s, y - s, s * 3, s * 3);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 66%, ${(a * 0.95).toFixed(3)})`;
        ctx.fillRect(x, y, s, s);
      }
      requestAnimationFrame(draw);
    };
    whenVisible(canvas, (v) => { const was = running; running = v; if (v && !was) requestAnimationFrame(draw); });
  }

  // Legal pages: highlight the section being read in the contents list.
  const toc = $$(".legal__toc a");
  if (toc.length && "IntersectionObserver" in window) {
    const byId = new Map(toc.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      toc.forEach((a) => a.classList.remove("is-active"));
      byId.get(e.target.id)?.classList.add("is-active");
    }), { rootMargin: "-15% 0px -70% 0px" });
    $$(".prose h2[id]").forEach((h) => io.observe(h));
  }
})();
