/* =====================================================================
   CLONE STYLE WOLVERINE WORLDWIDE — moteur JavaScript
   Animations reproduites d'après le système du site de référence :
   - Lenis : smooth scroll + suivi de la vélocité
   - .is-inview : reveals (anim-text lignes, anim-fade, anim-up, stagger, mots galaxy)
   - SplitText maison : découpe en lignes (anim-text) et en mots (galaxy)
   - Particules : dérive verticale continue pilotée par la vélocité du scroll
     (scale selon la position, profondeur Z, bouclage infini)
   - Carrousel : drag + inertie + snap + boutons
   - Count-up, header pilule, méga-menu, burger
   ===================================================================== */

(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a, b, t) => (1 - t) * a + b * t;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  /* État global de scroll partagé (vélocité, direction) */
  const scrollState = { velocity: 0, direction: 0 };
  let lenis = null;

  /* --------------------------------------------------------------- */
  /* 1. SMOOTH SCROLL (Lenis)                                         */
  /* --------------------------------------------------------------- */
  function initLenis() {
    if (reduced || typeof Lenis === "undefined") {
      // Fallback : vélocité calculée depuis window.scrollY
      let last = window.scrollY;
      window.addEventListener("scroll", () => {
        const y = window.scrollY;
        scrollState.velocity = y - last;
        scrollState.direction = Math.sign(y - last);
        last = y;
      }, { passive: true });
      return;
    }
    lenis = new Lenis({ duration: 0.6, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", (e) => {
      scrollState.velocity = e.velocity || 0;
      scrollState.direction = e.direction || 0;
    });
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault();
          lenis.scrollTo(id, { offset: -90 });
        }
      });
    });
  }

  /* --------------------------------------------------------------- */
  /* 2. SPLIT TEXT — lignes (anim-text)                              */
  /* --------------------------------------------------------------- */
  function splitToLines(el) {
    // Préserve les <br> comme sauts de ligne forcés (sentinelle)
    el.querySelectorAll("br").forEach((br) => br.replaceWith("¦"));
    const raw = el.textContent.replace(/[ \t\n]+/g, " ");
    const segments = raw.split("¦").map((s) => s.trim()).filter((s) => s.length);
    // Segments séparés par <br>, mots en spans pour détecter le wrapping visuel
    el.innerHTML = segments
      .map((seg) => `<span class="seg">${seg.split(" ").map((w) => `<span class="w-tmp">${w}</span>`).join(" ")}</span>`)
      .join("<br>");
    // Regroupe par ligne visuelle dans chaque segment (forcé + naturel)
    const lines = [];
    el.querySelectorAll(".seg").forEach((seg) => {
      const spans = Array.from(seg.querySelectorAll(".w-tmp"));
      let current = [], lastTop = null;
      spans.forEach((s) => {
        const top = s.offsetTop;
        if (lastTop === null) lastTop = top;
        if (top !== lastTop) { lines.push(current); current = []; lastTop = top; }
        current.push(s.textContent);
      });
      if (current.length) lines.push(current);
    });
    el.innerHTML = lines
      .map((l, i) => `<span class="line"><span class="anim-text-item" style="--index:${i}">${l.join(" ")}</span></span>`)
      .join("");
  }

  function initSplitText() {
    document.querySelectorAll(".anim-text").forEach((el) => {
      el.dataset.raw = el.innerHTML;
      splitToLines(el);
    });
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        document.querySelectorAll(".anim-text").forEach((el) => {
          if (el.dataset.raw !== undefined) {
            const wasIn = el.classList.contains("is-inview");
            el.innerHTML = el.dataset.raw;
            splitToLines(el);
            if (wasIn) el.classList.add("is-inview");
          }
        });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, 250);
    });
  }

  /* --------------------------------------------------------------- */
  /* 3. SPLIT TEXT — mots (titre galaxy)                            */
  /* --------------------------------------------------------------- */
  const GALAXY_OFFSETS = [[-40, 0], [0, -40], [0, 40], [40, 0], [0, -40], [0, 40]];
  function initGalaxyTitle() {
    document.querySelectorAll(".galaxy-title").forEach((el) => {
      const lines = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = lines
        .map((line) => {
          const words = line.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
          return `<span class="gline">${words.map((w) => `<span class="word">${w}</span>`).join(" ")}</span>`;
        })
        .join("");
      el.querySelectorAll(".word").forEach((w, i) => {
        const [tx, ty] = GALAXY_OFFSETS[i % GALAXY_OFFSETS.length];
        w.style.setProperty("--tx", tx + "px");
        w.style.setProperty("--ty", ty + "px");
        w.style.setProperty("--delay", i * 0.1 + "s");
      });
    });
  }

  /* --------------------------------------------------------------- */
  /* 4. REVEALS (.is-inview via IntersectionObserver)                */
  /* --------------------------------------------------------------- */
  function initReveals() {
    const sel = ".anim-text:not(.hero__title), .anim-fade, .anim-up, .anim-up-scale, .stagger, .galaxy-title, .img-reveal";
    const targets = document.querySelectorAll(sel);
    if (reduced) { targets.forEach((t) => t.classList.add("is-inview")); return; }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.classList.contains("stagger")) {
            Array.from(el.children).forEach((c, i) => c.style.setProperty("--index", i));
          }
          el.classList.add("is-inview");
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((t) => io.observe(t));
  }

  /* --------------------------------------------------------------- */
  /* 5. PARTICULES (dérive verticale pilotée par la vélocité)        */
  /* Repris du composant c-particles du site source.                 */
  /* --------------------------------------------------------------- */
  const P_CFG = { speed: 0.15, ease: 0.1, scaleEase: 0.25, scrollMultiplier: 0.05, scaleMin: 0.5, scaleMax: 1.4 };
  const Z_PATTERN = [-200, -150, -100, -50, 0, 50, 100, 150, 200];
  const SPEED_PATTERN = [0.8, 0.9, 1, 1.1, 1.2];

  function initParticles() {
    const container = document.querySelector(".particles");
    if (!container || reduced) {
      if (container) container.style.display = "none"; // statique : on masque la couche
      return null;
    }
    const images = Array.from(container.querySelectorAll(".particles__image"));
    const ps = { current: 0, target: 0, last: 0 };
    let direction = "down", directionSign = 1, containerHeight = 0, containerOffset = 0;

    function layout() {
      const cRect = container.getBoundingClientRect();
      const small = window.innerWidth < 700;
      images.forEach((img, n) => {
        const x = parseFloat(img.dataset.x);
        const y = parseFloat(img.dataset.y);
        const z = Z_PATTERN[n % Z_PATTERN.length];
        const speed = SPEED_PATTERN[n % SPEED_PATTERN.length];
        const opacity = z < 0 ? Math.max(0.5, 1 + z / 250) : 1;
        const overlay = img.querySelector(".particles__overlay");
        if (overlay) overlay.style.opacity = String(1 - opacity);
        img.style.left = (small ? (n % 4) * 25 + (x % 20) : x) + "%";
        img.style.top = y + "%";
        img.style.transform = "translate3d(0,0,0)";
        const r = img.getBoundingClientRect();
        img._speed = speed; img._z = z; img._extra = 0;
        img._top = r.top - cRect.top; img._height = r.height; img._scale = 1;
      });
      containerHeight = container.clientHeight;
      containerOffset = containerHeight * 0.1;
      ps.current = ps.target = ps.last = 0;
    }

    function tick(dt) {
      // dérive constante (la vélocité du scroll est ajoutée par impulsion, voir plus bas)
      ps.target += P_CFG.speed * dt * directionSign;
      ps.current = lerp(ps.current, ps.target, P_CFG.ease);
      direction = ps.current < ps.last ? "down" : "up";

      images.forEach((img) => {
        img._position = -ps.current * img._speed - img._extra;
        const nBottom = img._position + img._top + img._height;
        const isBefore = nBottom < -containerOffset;
        const isAfter = nBottom > containerHeight + containerOffset;
        if (direction === "up" && isBefore) img._extra = img._extra - containerHeight - containerOffset;
        if (direction === "down" && isAfter) img._extra = img._extra + containerHeight + containerOffset;
        const posTop = img._position + img._top;
        const l = clamp01(posTop / containerHeight);
        const targetScale = P_CFG.scaleMin + l * (P_CFG.scaleMax - P_CFG.scaleMin);
        img._scale = lerp(img._scale, targetScale, P_CFG.scaleEase);
        img.style.transform = `translate3d(0, ${img._position}px, ${img._z}px) scale(${img._scale})`;
      });
      ps.last = ps.current;
    }

    // Impulsion : la vélocité du scroll s'ajoute UNE fois par event (conforme à la spec)
    function impulse(velocity, dir) {
      ps.target += velocity * P_CFG.scrollMultiplier;
      if (dir !== 0) directionSign = dir;
    }
    if (lenis) {
      lenis.on("scroll", (e) => impulse(e.velocity || 0, e.direction || 0));
    } else {
      let lastY = window.scrollY;
      window.addEventListener("scroll", () => {
        const y = window.scrollY, v = y - lastY; lastY = y;
        impulse(v, Math.sign(v));
      }, { passive: true });
    }

    layout();
    window.addEventListener("resize", layout);
    return tick;
  }

  /* --------------------------------------------------------------- */
  /* 6. CARROUSEL (drag + inertie + snap + boutons)                 */
  /* --------------------------------------------------------------- */
  function makeCarousel(wrap, track, prev, next) {
    if (!wrap || !track) return null;
    // Reduced-motion : scroll natif, pas d'inertie ni de tick JS
    if (reduced) {
      wrap.style.overflowX = "auto";
      track.style.transform = "none";
      if (prev) prev.hidden = true;
      if (next) next.hidden = true;
      return null;
    }

    let pos = 0, target = 0, max = 0;
    let dragging = false, startX = 0, startPos = 0, lastX = 0, vel = 0;

    function bounds() { max = Math.min(0, wrap.offsetWidth - track.scrollWidth); }
    function cardStep() {
      const card = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).gap) || 24;
      return card ? card.offsetWidth + gap : wrap.offsetWidth * 0.8;
    }
    function snap(v) { const s = cardStep(); return Math.round(v / s) * s; }
    function clampPos(v) { return Math.max(max, Math.min(0, v)); }
    function updateButtons() {
      if (prev) prev.disabled = target >= -1;
      if (next) next.disabled = target <= max + 1;
    }
    bounds(); updateButtons();
    window.addEventListener("resize", () => { bounds(); target = clampPos(target); updateButtons(); });

    next && next.addEventListener("click", () => { target = clampPos(snap(target - cardStep())); updateButtons(); });
    prev && prev.addEventListener("click", () => { target = clampPos(snap(target + cardStep())); updateButtons(); });

    function down(x) { dragging = true; startX = lastX = x; startPos = pos; vel = 0; wrap.classList.add("is-dragging"); }
    function move(x) {
      if (!dragging) return;
      let np = startPos + (x - startX);
      if (np > 0) np = np * 0.35;                          // rubber-band
      if (np < max) np = max + (np - max) * 0.35;
      vel = x - lastX; lastX = x; pos = np; target = np;
      track.style.transform = `translate3d(${pos}px,0,0)`;
    }
    function up() {
      if (!dragging) return;
      dragging = false; wrap.classList.remove("is-dragging");
      target = clampPos(snap(pos + vel * 6));             // inertie puis snap
      updateButtons();
    }

    wrap.addEventListener("mousedown", (e) => { e.preventDefault(); down(e.clientX); });
    window.addEventListener("mousemove", (e) => move(e.clientX));
    window.addEventListener("mouseup", up);
    let touchY = 0;
    wrap.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; down(e.touches[0].clientX); }, { passive: true });
    wrap.addEventListener("touchmove", (e) => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - touchY);
      if (dx > dy) e.preventDefault(); // drag horizontal dominant -> on bloque le scroll vertical
      move(e.touches[0].clientX);
    }, { passive: false });
    wrap.addEventListener("touchend", up);
    // empêche le clic après un drag
    track.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => { if (Math.abs(vel) > 2 || pos !== target) e.preventDefault(); }));

    return function tickCarousel() {
      if (dragging) return;
      pos = lerp(pos, target, 0.12);
      if (Math.abs(pos - target) < 0.1) pos = target;
      track.style.transform = `translate3d(${pos}px,0,0)`;
    };
  }

  function initCarousels() {
    const ticks = [];
    // Carrousel actus de la home (markup existant)
    const newsWrap = document.querySelector(".news-track-wrap");
    if (newsWrap) {
      const t = makeCarousel(newsWrap, newsWrap.querySelector(".news-track"),
        document.querySelector(".news-nav-prev"), document.querySelector(".news-nav-next"));
      if (t) ticks.push(t);
    }
    // Carrousels génériques (timeline, large-card, cards)
    document.querySelectorAll("[data-carousel]").forEach((c) => {
      const t = makeCarousel(c.querySelector(".carousel__viewport"), c.querySelector(".carousel__track"),
        c.querySelector("[data-carousel-prev]"), c.querySelector("[data-carousel-next]"));
      if (t) ticks.push(t);
    });
    return ticks;
  }

  /* --------------------------------------------------------------- */
  /* 7. COUNT-UP                                                     */
  /* --------------------------------------------------------------- */
  function initCountUp() {
    const els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    // Amorce chaque compteur à 0 (hors reduced-motion) : le compte-up est ainsi
    // toujours visible quand la section entre dans le viewport.
    if (!reduced) els.forEach((el) => {
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      el.textContent = (0).toFixed(decimals);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const decimals = (el.dataset.count.split(".")[1] || "").length;
        const dur = 1400;
        if (reduced) { el.textContent = target.toFixed(decimals); io.unobserve(el); return; }
        let start = null;
        function frame(t) {
          if (!start) start = t;
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals);
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  }

  /* --------------------------------------------------------------- */
  /* 7b. GLOW CARDS (bordure lumineuse suivant le curseur, speakers) */
  /* --------------------------------------------------------------- */
  function initGlowCards() {
    const scope = document.querySelector("[data-glow-scope]");
    if (!scope) return;
    if (window.matchMedia("(hover: none)").matches) return; // tactile : pas d'effet curseur
    // Suivi LOCAL par carte : chaque carte lit sa position curseur relative à
    // elle-même. Seule la carte survolée reçoit les pointermove -> seule elle
    // s'illumine, et la lumière reste exactement sous le curseur.
    scope.querySelectorAll(".news-card").forEach((card) => {
      let raf = 0, lx = 0, ly = 0;
      const apply = () => {
        raf = 0;
        card.style.setProperty("--x", lx.toFixed(1) + "px");
        card.style.setProperty("--y", ly.toFixed(1) + "px");
      };
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        lx = e.clientX - r.left; ly = e.clientY - r.top;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
    });
  }

  /* --------------------------------------------------------------- */
  /* 8. HEADER + MÉGA-MENU + BURGER                                  */
  /* --------------------------------------------------------------- */
  function initHeader() {
    const header = document.querySelector(".header");
    if (!header) return;
    // Header dynamique sur TOUTES les pages : transparent en haut, puis pilule
    // sombre au scroll. Sur les pages à hero clair (page-hero), on ajoute
    // .header--light : le texte est en encre au repos (lisible sur fond clair),
    // et repasse en blanc dès que la pilule sombre apparaît.
    const darkHero = document.querySelector(".hero, .hero-page");
    if (!darkHero) header.classList.add("header--light");
    // IMPORTANT : Lenis (smooth scroll) n'émet PAS l'événement "scroll" natif,
    // il a son propre système. On branche donc le header sur les DEUX : l'event
    // natif (cas sans Lenis : reduced-motion, CDN indisponible) ET lenis.on("scroll")
    // (cas nominal). Sinon la barre ne réagirait jamais au scroll. On lit la
    // position depuis l'event Lenis quand elle est fournie, sinon window.scrollY.
    const onScroll = (e) => {
      const y = e && typeof e.scroll === "number" ? e.scroll : window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (lenis) lenis.on("scroll", onScroll);

    /* ------ Curseur pilule qui glisse sous le lien survolé (desktop) ------ */
    (function initNavCursor() {
      const nav = document.querySelector(".nav#site-nav") || document.querySelector(".nav");
      if (!nav) return;
      const tabs = [...nav.querySelectorAll(".nav__link:not(.nav__link--cta)")]
        .filter((l) => !l.closest(".nav__account"));
      if (!tabs.length) return;
      const cursor = document.createElement("span");
      cursor.className = "nav__cursor";
      cursor.setAttribute("aria-hidden", "true");
      nav.appendChild(cursor);
      nav.classList.add("has-cursor");
      const move = (el) => {
        if (window.innerWidth <= 1024) return;
        cursor.style.width = el.offsetWidth + "px";
        cursor.style.height = el.offsetHeight + "px";
        cursor.style.transform = "translate(" + el.offsetLeft + "px," + el.offsetTop + "px)";
        cursor.style.opacity = "1";
      };
      tabs.forEach((t) => {
        t.addEventListener("mouseenter", () => move(t));
        t.addEventListener("focus", () => move(t));
      });
      nav.addEventListener("mouseleave", () => { cursor.style.opacity = "0"; });
    })();

    document.querySelectorAll(".nav__item--has-menu").forEach((item) => {
      const link = item.querySelector(".nav__link");
      const setOpen = (open) => {
        item.classList.toggle("is-open", open);
        if (link) link.setAttribute("aria-expanded", open ? "true" : "false");
      };
      if (link) link.setAttribute("aria-expanded", "false");
      item.addEventListener("mouseenter", () => { if (window.innerWidth > 1024) setOpen(true); });
      item.addEventListener("mouseleave", () => { if (window.innerWidth > 1024) setOpen(false); });
      // Clavier : le focus qui entre dans l'item ouvre le menu, en sortir le ferme,
      // Échap le referme et rend le focus au lien. (Le mégamenu était souris-only.)
      item.addEventListener("focusin", () => { if (window.innerWidth > 1024) setOpen(true); });
      item.addEventListener("focusout", () => {
        // Le focus a bougé : on referme si, au tick suivant, il a quitté l'item.
        setTimeout(() => { if (window.innerWidth > 1024 && !item.contains(document.activeElement)) setOpen(false); }, 0);
      });
      item.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { setOpen(false); if (link) link.focus(); }
      });
      link.addEventListener("click", (e) => { if (window.innerWidth <= 1024) { e.preventDefault(); setOpen(!item.classList.contains("is-open")); } });
    });

    const burger = document.querySelector(".burger");
    burger && burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    document.querySelectorAll(".nav__link").forEach((l) =>
      l.addEventListener("click", () => {
        if (window.innerWidth <= 1024 && !l.closest(".nav__item--has-menu")) {
          document.body.classList.remove("menu-open");
          if (lenis) lenis.start();
        }
      })
    );
  }

  /* --------------------------------------------------------------- */
  /* 8e. ESPACE COMPTE (connexion / inscription / menu utilisateur)  */
  /* Un seul point d'entrée : icône profil -> menu déroulant.        */
  /* État lu depuis localStorage (ssb_account) ; sans back-end, les   */
  /* actions "Se connecter"/"Créer un compte" basculent en mode      */
  /* connecté pour la démo, "Déconnexion" revient en mode invité.     */
  /* --------------------------------------------------------------- */
  function initAccount() {
    const root = document.querySelector("[data-account]");
    if (!root) return;
    const trigger = root.querySelector(".account-trigger");
    const avatar = root.querySelector(".account-trigger__avatar");
    const title = root.querySelector("[data-account-title]");

    const readUser = () => {
      try { return JSON.parse(localStorage.getItem("ssb_account") || "null"); }
      catch (e) { return null; }
    };
    const initials = (name) =>
      name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "M";

    const render = () => {
      const user = readUser();
      root.classList.toggle("is-authed", !!user);
      if (user) {
        if (avatar) avatar.textContent = initials(user.name);
        if (trigger) trigger.setAttribute("aria-label", "Mon compte — " + user.name);
        if (title) title.textContent = user.name;
      } else {
        if (trigger) trigger.setAttribute("aria-label", "Se connecter ou s'inscrire");
        if (title) title.textContent = "Bienvenue";
      }
    };

    const setOpen = (open) => {
      root.classList.toggle("is-open", open);
      if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
    };

    render();

    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!root.classList.contains("is-open")); });
    }
    document.addEventListener("click", (e) => { if (!root.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

    // Démo sans back-end : connexion / inscription basculent l'état.
    root.querySelectorAll("[data-account-login]").forEach((el) =>
      el.addEventListener("click", (e) => {
        e.preventDefault();
        try { localStorage.setItem("ssb_account", JSON.stringify({ name: "Membre SSB" })); } catch (_) {}
        render(); setOpen(false);
      })
    );
    const logout = root.querySelector("[data-account-logout]");
    if (logout) logout.addEventListener("click", (e) => {
      e.preventDefault();
      try { localStorage.removeItem("ssb_account"); } catch (_) {}
      render(); setOpen(false);
    });
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* --------------------------------------------------------------- */
  /* 11. INLINE VIDEO (lecture/pause selon visibilité)               */
  /* --------------------------------------------------------------- */
  function initInlineVideo() {
    const vids = document.querySelectorAll("[data-inline-video]");
    if (!vids.length) return;
    vids.forEach((v) => {
      if (reduced) { v.removeAttribute("autoplay"); v.pause && v.pause(); return; }
      let inView = false;
      const tryPlay = () => { if (inView) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } };
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          inView = e.isIntersecting;
          if (inView) tryPlay(); else v.pause();
        }),
        { threshold: 0.1 }
      );
      io.observe(v);
      // Relance dès que la vidéo est prête (l'observer peut tirer avant le chargement)
      v.addEventListener("loadeddata", tryPlay);
      v.addEventListener("canplay", tryPlay);
    });
  }

  /* --------------------------------------------------------------- */
  /* 12. ACCORDÉONS                                                  */
  /* --------------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll(".accordion").forEach((acc) => {
      const head = acc.querySelector(".accordion__head");
      const body = acc.querySelector(".accordion__body");
      if (!head || !body) return;
      head.setAttribute("aria-expanded", acc.classList.contains("is-open") ? "true" : "false");
      head.addEventListener("click", () => {
        const open = acc.classList.toggle("is-open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
        body.style.height = open ? body.scrollHeight + "px" : "0px";
      });
    });
    window.addEventListener("resize", () => {
      document.querySelectorAll(".accordion.is-open .accordion__body").forEach((b) => { b.style.height = b.scrollHeight + "px"; });
    });
  }

  /* --------------------------------------------------------------- */
  /* 13. ANCHOR-NAV (scrollspy + scroll doux)                        */
  /* --------------------------------------------------------------- */
  function initAnchorNav() {
    const nav = document.querySelector(".anchor-nav");
    if (!nav) return;
    // On ne garde que les vraies ancres (href="#section"), pas les CTA en href="#" :
    // querySelector("#") lève une SyntaxError qui casserait l'init et figerait le scroll.
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'))
      .filter((l) => (l.getAttribute("href") || "").length > 1);
    if (!links.length) return;
    const sections = links.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
    links.forEach((l) => l.addEventListener("click", (e) => {
      const tgt = document.querySelector(l.getAttribute("href"));
      if (tgt) { e.preventDefault(); if (lenis) lenis.scrollTo(tgt, { offset: -90 }); else tgt.scrollIntoView({ behavior: "smooth" }); }
    }));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = "#" + entry.target.id;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === id));
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach((s) => io.observe(s));
  }

  /* --------------------------------------------------------------- */
  /* 14. MASONRY PARALLAX (par colonne)                              */
  /* --------------------------------------------------------------- */
  function initMasonryParallax() {
    const cols = Array.from(document.querySelectorAll(".masonry__col"));
    if (!cols.length || reduced) return null;
    const speeds = cols.map((c, i) => parseFloat(c.dataset.speed || [0.07, -0.03, 0.11][i % 3]));
    return function tick() {
      cols.forEach((col, i) => {
        const m = col.parentElement.getBoundingClientRect();
        const center = m.top + m.height / 2 - window.innerHeight / 2;
        col.style.transform = `translate3d(0, ${-center * speeds[i]}px, 0)`;
      });
    };
  }

  /* --------------------------------------------------------------- */
  /* 15. AUTO-CAROUSEL (images + dots)                               */
  /* --------------------------------------------------------------- */
  function initAutoCarousels() {
    document.querySelectorAll(".auto-carousel").forEach((ac) => {
      const imgs = Array.from(ac.querySelectorAll(".auto-carousel__media img"));
      const dots = Array.from(ac.querySelectorAll(".auto-carousel__dots button"));
      if (!imgs.length) return;
      let i = 0, timer = null;
      function show(n) {
        i = (n + imgs.length) % imgs.length;
        imgs.forEach((im, k) => im.classList.toggle("is-active", k === i));
        dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
      }
      function start() { if (reduced) return; stop(); timer = setInterval(() => show(i + 1), 4000); }
      function stop() { if (timer) clearInterval(timer); }
      dots.forEach((d, k) => d.addEventListener("click", () => { show(k); start(); }));
      show(0); start();
    });
  }

  /* --------------------------------------------------------------- */
  /* 16. ONGLETS MARQUES (brands)                                    */
  /* --------------------------------------------------------------- */
  function initBrandTabs() {
    const root = document.querySelector(".brands-showcase");
    if (!root) return;
    const tabs = Array.from(root.querySelectorAll(".brands-tabs button"));
    const panels = Array.from(root.querySelectorAll(".brands-stage__panel"));
    const counter = root.querySelector(".brands-counter");
    function activate(n) {
      tabs.forEach((t, k) => t.classList.toggle("is-active", k === n));
      panels.forEach((p, k) => p.classList.toggle("is-active", k === n));
      if (counter) counter.textContent = String(n + 1).padStart(2, "0") + " / " + String(tabs.length).padStart(2, "0");
    }
    tabs.forEach((t, k) => t.addEventListener("click", () => activate(k)));
    if (tabs.length) activate(0);
  }

  /* --------------------------------------------------------------- */
  /* 16a. SHOWCASE MARQUES PILOTÉ AU SCROLL                          */
  /* Section épinglée : chaque marque se révèle en montant par-dessus */
  /* la précédente (clip-path), l'encadré et le compteur suivent.     */
  /* --------------------------------------------------------------- */
  function initBrandsScroll() {
    const root = document.querySelector("[data-brands-scroll]");
    if (!root) return null;
    const panels = Array.from(root.querySelectorAll(".brands-stage__panel"));
    const tabs = Array.from(root.querySelectorAll(".brands-tabs button"));
    const counter = root.querySelector(".brands-counter");
    const N = panels.length;
    if (!N) return null;
    const smooth = (t) => t * t * (3 - 2 * t);
    const total = (n) => String(N).padStart(2, "0");

    // Reduced-motion : pas d'épinglage, on bascule les marques au clic.
    if (reduced) {
      root.classList.add("brands-scroll--static");
      const show = (n) => {
        panels.forEach((p, k) => p.classList.toggle("is-shown", k === n));
        tabs.forEach((t, k) => t.classList.toggle("is-active", k === n));
        if (counter) counter.textContent = String(n + 1).padStart(2, "0") + " / " + total();
      };
      tabs.forEach((t, k) => t.addEventListener("click", () => show(k)));
      show(0);
      return null;
    }

    // Clic sur un onglet : scroll jusqu'au segment de la marque visée.
    tabs.forEach((t, k) => t.addEventListener("click", () => {
      const top = root.getBoundingClientRect().top + window.scrollY;
      const dist = root.offsetHeight - window.innerHeight;
      const target = top + (N > 1 ? k / (N - 1) : 0) * dist;
      if (lenis) lenis.scrollTo(target); else window.scrollTo({ top: target, behavior: "smooth" });
    }));

    let lastActive = -1;
    function update() {
      const rect = root.getBoundingClientRect();
      const dist = root.offsetHeight - window.innerHeight;
      const p = dist > 0 ? clamp01(-rect.top / dist) : 0;
      const f = p * (N - 1);                       // index continu 0..N-1
      panels.forEach((panel, i) => {
        const rev = smooth(clamp01(f - (i - 1)));  // marque 0 visible dès le départ
        panel.style.clipPath = "inset(" + (1 - rev) * 100 + "% 0 0 0)";
        panel.style.zIndex = String(i);
        const img = panel.querySelector("img");
        if (img) img.style.transform = "scale(" + lerp(1.08, 1, rev) + ")";
        // L'encadré n'apparaît que dans la 2e moitié de la révélation : évite de voir
        // le texte de la marque entrante par-dessus le nom de la marque sortante.
        const info = panel.querySelector(".brands-stage__info");
        if (info) info.style.opacity = clamp01((rev - 0.5) / 0.35);
      });
      const active = Math.min(N - 1, Math.round(f));
      if (active !== lastActive) {
        lastActive = active;
        tabs.forEach((t, k) => t.classList.toggle("is-active", k === active));
        if (counter) counter.textContent = String(active + 1).padStart(2, "0") + " / " + total();
      }
    }
    update();
    return update; // tick ajouté à la boucle rAF
  }

  /* --------------------------------------------------------------- */
  /* 16b. ONGLETS GÉNÉRIQUES [data-tabs]                             */
  /* --------------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach((root) => {
      const tabs = Array.from(root.querySelectorAll("[data-tab]"));
      const panels = Array.from(root.querySelectorAll("[data-panel]"));
      if (!tabs.length) return;
      tabs.forEach((t) => t.setAttribute("role", "tab"));
      panels.forEach((p) => p.setAttribute("role", "tabpanel"));
      function activate(n) {
        tabs.forEach((t, k) => { t.classList.toggle("is-active", k === n); t.setAttribute("aria-selected", k === n ? "true" : "false"); });
        panels.forEach((p, k) => { p.classList.toggle("is-active", k === n); p.hidden = k !== n; });
      }
      tabs.forEach((t, k) => t.addEventListener("click", () => activate(k)));
      activate(0);
    });
  }

  /* --------------------------------------------------------------- */
  /* 16c. FICHES DIRIGEANTS DÉPLIABLES (bio au clic)                 */
  /* --------------------------------------------------------------- */
  function initTeamCards() {
    const tiles = Array.from(document.querySelectorAll(".team-tile[data-bio]"));
    if (!tiles.length) return;
    const close = (except) => tiles.forEach((t) => { if (t !== except) t.classList.remove("is-open"); });
    tiles.forEach((tile) => {
      const toggle = () => { const open = tile.classList.contains("is-open"); close(tile); tile.classList.toggle("is-open", !open); };
      tile.addEventListener("click", toggle);
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
        if (e.key === "Escape") tile.classList.remove("is-open");
      });
    });
  }

  /* --------------------------------------------------------------- */
  /* 16d. FILTRES ÉVÉNEMENTS (à venir / passés / type)               */
  /* --------------------------------------------------------------- */
  function initEventFilters() {
    const root = document.querySelector("[data-events]");
    if (!root) return;
    const buttons = Array.from(root.querySelectorAll(".event-filters button"));
    const rows = Array.from(root.querySelectorAll(".event-row"));
    const months = Array.from(root.querySelectorAll(".event-month"));
    function apply(filter) {
      rows.forEach((row) => {
        const match = filter === "all" || (row.dataset.filter || "").split(" ").includes(filter);
        row.style.display = match ? "" : "none";
      });
      // Masque les en-têtes de mois qui n'ont plus aucun événement visible.
      months.forEach((m) => {
        let sib = m.nextElementSibling, any = false;
        while (sib && !sib.classList.contains("event-month")) {
          if (sib.classList.contains("event-row") && sib.style.display !== "none") any = true;
          sib = sib.nextElementSibling;
        }
        m.style.display = any ? "" : "none";
      });
    }
    buttons.forEach((b) => b.addEventListener("click", () => {
      buttons.forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      apply(b.dataset.filter || "all");
    }));
    const initial = buttons.find((b) => b.classList.contains("is-active")) || buttons[0];
    if (initial) apply(initial.dataset.filter || "all");
  }

  /* --------------------------------------------------------------- */
  /* 16f. GALERIE 3D INCURVÉE (page événements)                      */
  /* Arc + drag + molette + flèches + boutons ; boucle infinie.      */
  /* --------------------------------------------------------------- */
  function initGallery3d() {
    const root = document.querySelector("[data-gallery3d]");
    if (!root) return null;
    const track = root.querySelector(".gallery3d__track");
    const cards = Array.from(track.children);
    const N = cards.length;
    if (!N) return null;
    const scope = root.closest("section") || document;
    const prevBtn = scope.querySelector("[data-g3d-prev]");
    const nextBtn = scope.querySelector("[data-g3d-next]");

    let W = root.clientWidth, step = 320, current = 0, target = 0;
    function measure() {
      W = root.clientWidth || 1;
      const cw = cards[0].offsetWidth || 300;
      step = cw + Math.min(90, W * 0.06);
    }
    measure();
    window.addEventListener("resize", measure);
    const total = () => step * N;
    function wrap(x) { const t = total(); x = ((x % t) + t) % t; if (x > t / 2) x -= t; return x; }
    const nearest = () => Math.round(target / step) * step;

    let snapT;
    function snapSoon() { clearTimeout(snapT); snapT = setTimeout(() => { target = nearest(); }, 130); }

    root.addEventListener("wheel", (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      target += d * 0.6; snapSoon();
    }, { passive: false });

    let dragging = false, startX = 0, startTarget = 0;
    const down = (x) => { dragging = true; startX = x; startTarget = target; root.classList.add("is-grab"); };
    const move = (x) => { if (dragging) target = startTarget - (x - startX); };
    const upd = () => { if (!dragging) return; dragging = false; root.classList.remove("is-grab"); target = nearest(); };
    root.addEventListener("mousedown", (e) => { e.preventDefault(); down(e.clientX); });
    window.addEventListener("mousemove", (e) => move(e.clientX));
    window.addEventListener("mouseup", upd);
    root.addEventListener("touchstart", (e) => down(e.touches[0].clientX), { passive: true });
    root.addEventListener("touchmove", (e) => { if (dragging) move(e.touches[0].clientX); }, { passive: true });
    root.addEventListener("touchend", upd);

    nextBtn && nextBtn.addEventListener("click", () => { target = nearest() + step; });
    prevBtn && prevBtn.addEventListener("click", () => { target = nearest() - step; });
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); target += step; }
      else if (e.key === "ArrowLeft") { e.preventDefault(); target -= step; }
    });

    let activeIdx = -1;
    return function tickGallery() {
      current = reduced ? target : lerp(current, target, 0.09);
      const H = Math.max(W / 2, 1);
      const B = Math.max(60, W * 0.18);              // profondeur d'arc
      const R = (H * H + B * B) / (2 * B);
      let best = Infinity, bestI = 0;
      cards.forEach((card, i) => {
        const x = wrap(i * step - current);
        const ax = Math.min(Math.abs(x), H);
        const arc = R - Math.sqrt(Math.max(0, R * R - ax * ax));
        const rot = Math.sign(x) * Math.asin(Math.min(1, ax / R)) * (180 / Math.PI) * 0.55;
        const t = Math.min(1, Math.abs(x) / (H + step));
        const scale = 1 - t * 0.14;
        const z = -Math.abs(x) * 0.25;
        card.style.transform =
          "translate(-50%,-50%) translate3d(" + x + "px," + (-arc) + "px," + z + "px) rotateZ(" + (-rot) + "deg) scale(" + scale + ")";
        card.style.opacity = String(1 - t * 0.45);
        card.style.zIndex = String(1000 - Math.round(Math.abs(x)));
        if (Math.abs(x) < best) { best = Math.abs(x); bestI = i; }
      });
      if (bestI !== activeIdx) {
        activeIdx = bestI;
        cards.forEach((c, i) => c.classList.toggle("is-active", i === bestI));
      }
    };
  }

  /* --------------------------------------------------------------- */
  /* 16g. CHROMA GRID (page intervenants) — spotlight curseur          */
  /* --------------------------------------------------------------- */
  function initChromaGrid() {
    const grid = document.querySelector("[data-chroma]");
    if (!grid) return null;
    const cards = Array.from(grid.querySelectorAll(".chroma-card"));
    let tx = grid.clientWidth / 2, ty = grid.clientHeight / 2, cx = tx, cy = ty;
    grid.addEventListener("pointermove", (e) => {
      const r = grid.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      grid.classList.add("is-hovering");
      cards.forEach((card) => {
        const cr = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", (e.clientX - cr.left) + "px");
        card.style.setProperty("--mouse-y", (e.clientY - cr.top) + "px");
      });
    });
    grid.addEventListener("pointerleave", () => grid.classList.remove("is-hovering"));
    if (reduced) return null;
    return function tickChroma() {
      cx = lerp(cx, tx, 0.15); cy = lerp(cy, ty, 0.15);
      grid.style.setProperty("--x", cx + "px");
      grid.style.setProperty("--y", cy + "px");
    };
  }

  /* --------------------------------------------------------------- */
  /* 16e. FORMULAIRE BOOK A CALL (validation + retour visuel)        */
  /* --------------------------------------------------------------- */
  function initForm() {
    const form = document.querySelector("[data-form]");
    if (!form) return;
    const feedback = form.querySelector(".form__feedback");
    const emailField = form.querySelector('[data-field="email"]');

    const setInvalid = (field, invalid) => field && field.classList.toggle("is-invalid", invalid);
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    // Validation à la sortie du champ (blur), pas à chaque frappe.
    form.querySelectorAll(".field__input, .field__textarea").forEach((input) => {
      input.addEventListener("blur", () => {
        const field = input.closest(".field");
        if (input.required && !input.value.trim()) return setInvalid(field, true);
        if (input.type === "email" && input.value && !emailOk(input.value)) return setInvalid(field, true);
        setInvalid(field, false);
      });
      input.addEventListener("input", () => { const f = input.closest(".field"); if (f && f.classList.contains("is-invalid")) setInvalid(f, false); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let firstInvalid = null;
      form.querySelectorAll(".field__input, .field__textarea").forEach((input) => {
        if (input.disabled) return; // champ d'une branche masquée : ignoré
        const field = input.closest(".field");
        let bad = false;
        if (input.required && !input.value.trim()) bad = true;
        if (input.type === "email" && input.value && !emailOk(input.value)) bad = true;
        setInvalid(field, bad);
        if (bad && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }
      // Démo : pas de backend branché. On confirme visuellement et on réinitialise.
      // (Le branchement Supabase/email se fait en v2, voir README de la webapp.)
      if (feedback) {
        feedback.classList.add("is-shown", "form__feedback--ok");
        feedback.textContent = "Merci, votre demande est bien notée. L'équipe SSB vous recontacte sous 48 h.";
        feedback.setAttribute("role", "status");
      }
      form.reset();
    });
  }

  /* --------------------------------------------------------------- */
  /* 16h. BOOK A CALL — sélecteur de profil + branches + copy dynamique */
  /* Le formulaire adapte ses champs, ses textes et son message de     */
  /* confirmation selon le profil (partenaire / adhérent / speaker).   */
  /* Les champs des branches masquées sont `disabled` : initForm() les  */
  /* ignore donc à la validation (voir garde `input.disabled`).        */
  /* --------------------------------------------------------------- */
  function initBookCall() {
    const form = document.querySelector("[data-bookcall]");
    if (!form) return;
    const typeSelect = form.querySelector('[name="type"]');
    if (!typeSelect) return;

    const COPY = {
      partenaire: {
        cta: "Envoyer ma demande",
        micro: "Réponse sous 48 h ouvrées. Aucune donnée partagée.",
        msg: "Dites-nous en quelques mots ce que vous avez en tête.",
        feedback: "Merci ! Le bureau vous recontacte sous 48 h ouvrées pour caler votre partenariat.",
      },
      adherent: {
        cta: "Envoyer ma demande",
        micro: "Réponse sous 48 h ouvrées. Aucune donnée partagée.",
        msg: "Dis-nous en quelques mots ce qui t'amène.",
        feedback: "Merci ! On te recontacte sous 48 h ouvrées pour répondre à toutes tes questions.",
      },
      speaker: {
        cta: "Envoyer ma demande",
        micro: "Réponse sous 48 h ouvrées. Aucune donnée partagée.",
        msg: "Décrivez le sujet que vous aimeriez aborder.",
        feedback: "Merci ! Le bureau revient vers vous sous 48 h ouvrées pour construire votre intervention.",
      },
    };

    const branches = Array.from(form.querySelectorAll("[data-branch]"));
    const ctaEl = form.querySelector("[data-form-cta]");
    const microEl = form.querySelector("[data-form-micro]");
    const msgEl = form.querySelector("[data-msg]");

    function activate(profile) {
      const c = COPY[profile] || COPY.partenaire;
      branches.forEach((b) => {
        const on = b.dataset.branch === profile;
        b.classList.toggle("is-active", on);
        // Active/désactive les champs pour que la validation ignore les branches masquées
        b.querySelectorAll("input, textarea, select").forEach((el) => { el.disabled = !on; });
      });
      if (ctaEl) ctaEl.textContent = c.cta;
      if (microEl) microEl.textContent = c.micro;
      if (msgEl) msgEl.setAttribute("placeholder", c.msg);
    }

    // Changement de profil via le select "Vous êtes"
    typeSelect.addEventListener("change", () => activate(typeSelect.value));

    // Pré-routage depuis les liens de la page (data-profile)
    document.querySelectorAll("[data-profile]").forEach((el) => {
      el.addEventListener("click", () => {
        const p = el.getAttribute("data-profile");
        typeSelect.value = p;
        activate(p);
      });
    });

    // Feedback personnalisé après un envoi valide (capture avant initForm, override en microtâche)
    form.addEventListener("submit", () => {
      const c = COPY[typeSelect.value] || COPY.partenaire;
      queueMicrotask(() => {
        const fb = form.querySelector(".form__feedback");
        if (fb && fb.classList.contains("is-shown")) {
          fb.textContent = c.feedback;
          activate(typeSelect.value || "partenaire"); // resync après le reset()
        }
      });
    }, true);

    // État initial : profil sélectionné, ou hash entrant (#partenaire / #adherent / #speaker)
    const hash = (window.location.hash || "").replace("#", "");
    let start = typeSelect.value || "partenaire";
    if (["partenaire", "adherent", "speaker"].indexOf(hash) !== -1) {
      typeSelect.value = hash;
      start = hash;
      const target = document.getElementById("reserver");
      if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
    activate(start);
  }

  /* --------------------------------------------------------------- */
  /* 17. INTRO HERO HOME (titre ligne par ligne + carte, au load)    */
  /* --------------------------------------------------------------- */
  function initHomeHero() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const title = hero.querySelector(".hero__title");
    const card = hero.querySelector(".hero__card");
    if (reduced) {
      if (title) title.classList.add("is-inview");
      if (card) card.classList.add("is-revealed");
      return;
    }
    // Séquence courte au chargement : titre, puis carte
    setTimeout(() => { if (title) title.classList.add("is-inview"); }, 200);
    setTimeout(() => { if (card) card.classList.add("is-revealed"); }, 500);
  }

  /* --------------------------------------------------------------- */
  /* BOUCLE rAF UNIQUE (Lenis + particules + carrousel)              */
  /* --------------------------------------------------------------- */
  function startLoop(ticks) {
    // On ne démarre la boucle rAF que s'il y a réellement quelque chose à animer :
    // Lenis actif OU au moins un tick de composant. Sinon (page statique, ou Lenis
    // absent + reduced-motion), inutile de tourner à 60 fps pour rien.
    const hasWork = lenis || ticks.some((fn) => typeof fn === "function");
    if (!hasWork) return;
    let lastT = performance.now();
    function raf(now) {
      const dt = Math.min(64, now - lastT); lastT = now;
      // Chaque étape est isolée : une erreur ponctuelle ne doit jamais tuer la
      // boucle (sinon le scroll Lenis se fige définitivement).
      try { if (lenis) lenis.raf(now); } catch (e) {}
      ticks.forEach((fn) => { try { fn && fn(dt); } catch (e) {} });
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* --------------------------------------------------------------- */
  /* MOTEUR : GSAP (ScrollTrigger) marié à Lenis, sinon fallback rAF */
  /* Un SEUL rAF (gsap.ticker) pilote lenis.raf + tous les ticks.    */
  /* --------------------------------------------------------------- */
  function startEngine(ticks) {
    const G = window.gsap, ST = window.ScrollTrigger;
    if (lenis && G && ST) {
      G.registerPlugin(ST);
      ST.config({ ignoreMobileResize: true });
      // Lenis -> ScrollTrigger : ST lit la position à chaque scroll Lenis
      lenis.on("scroll", ST.update);
      // gsap.ticker devient LA boucle (time en s -> lenis.raf attend des ms)
      let lastT = performance.now();
      G.ticker.add((time) => {
        const now = time * 1000;
        const dt = Math.min(64, now - lastT); lastT = now;
        try { lenis.raf(now); } catch (e) {}
        ticks.forEach((fn) => { try { fn && fn(dt); } catch (e) {} });
      });
      G.ticker.lagSmoothing(0);
      // Recalage après polices + images lazy (les triggers dépendent du layout)
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
      window.addEventListener("load", () => ST.refresh());
      return;
    }
    // Fallback inchangé : pas de GSAP, ou reduced-motion sans Lenis
    startLoop(ticks);
  }

  /* --------------------------------------------------------------- */
  /* SCÈNES GSAP (home) : light-trails, parallax, entrées de slabs.   */
  /* Tout vit dans matchMedia(no-preference) : revert auto en reduce. */
  /* Règle : jamais d'état masqué gated au scroll (translation seule).*/
  /* --------------------------------------------------------------- */
  function initGsapScenes() {
    const G = window.gsap, ST = window.ScrollTrigger;
    if (!G || !ST) return;
    const mm = G.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 2. Parallax de l'image du CTA final (aucune animation CSS concurrente dessus)
      const ctaImg = document.querySelector(".cta-push > img");
      if (ctaImg) G.to(ctaImg, { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".cta-push", start: "top bottom", end: "bottom top", scrub: true } });
      // 3. Entrée des sections Partenariat/Adhésion : translation seule (contenu jamais masqué)
      G.utils.toArray(".slab").forEach((slab) => {
        G.from(slab, { y: 44, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: slab, start: "top 84%", once: true } });
      });
      // 4. Parallax déterministe sur les CONTENEURS médias (les <img> gardent leur Ken Burns)
      G.utils.toArray(".partner__media, .reason__media").forEach((el) => {
        G.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
      return () => {};
    });
  }

  /* --------------------------------------------------------------- */
  /* 8b. BARRE DE PROGRESSION SCROLL (fine ligne dorée en haut)      */
  /* --------------------------------------------------------------- */
  function initScrollProgress() {
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    // Comme le header : Lenis n'émet pas l'event scroll natif, on branche les deux.
    const update = (e) => {
      const y = e && typeof e.scroll === "number" ? e.scroll : window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    if (lenis) lenis.on("scroll", update);
  }

  /* --------------------------------------------------------------- */
  /* 8d. STAGGERED MENU (navigation plein panneau)                   */
  /* --------------------------------------------------------------- */
  function initStaggeredMenu() {
    const root = document.querySelector("[data-smenu]");
    const toggle = document.querySelector("[data-smenu-toggle]");
    if (!root || !toggle) return;
    const panel = root.querySelector(".smenu__panel");
    let open = false;
    function setOpen(v) {
      open = v;
      root.classList.toggle("is-open", v);
      toggle.classList.toggle("is-open", v);
      toggle.setAttribute("aria-expanded", v ? "true" : "false");
      toggle.setAttribute("aria-label", v ? "Fermer le menu" : "Ouvrir le menu");
      if (panel) panel.setAttribute("aria-hidden", v ? "false" : "true");
      document.body.classList.toggle("smenu-open", v);
      if (lenis) { v ? lenis.stop() : lenis.start(); }
    }
    toggle.addEventListener("click", () => setOpen(!open));
    root.querySelectorAll("[data-smenu-close]").forEach((el) => el.addEventListener("click", () => setOpen(false)));
    root.querySelectorAll(".smenu__item").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { setOpen(false); toggle.focus(); } });
  }

  /* --------------------------------------------------------------- */
  /* 8c. BARRE MOBILE STICKY (CTA toujours accessible, levier 18)    */
  /* --------------------------------------------------------------- */
  function initMobileBar() {
    const bar = document.querySelector("[data-mobilebar]");
    if (!bar) return;
    const onScroll = (e) => {
      const y = e && typeof e.scroll === "number" ? e.scroll : window.scrollY;
      // Apparaît une fois le hero passé (~60% de la hauteur d'écran).
      bar.classList.toggle("is-visible", y > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (lenis) lenis.on("scroll", onScroll);
  }

  /* --------------------------------------------------------------- */
  /* INIT                                                            */
  /* --------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    let particlesTick = null, carouselTicks = [], masonryTick = null, brandsTick = null, gallery3dTick = null, chromaTick = null;
    // Init isolé : si un composant échoue, on n'empêche jamais le démarrage de la
    // boucle d'animation. Sinon Lenis intercepterait la molette sans jamais
    // l'appliquer = page totalement bloquée. startLoop() est donc toujours appelé.
    try {
      initLenis();
      initSplitText();
      initGalaxyTitle();
      initReveals();
      particlesTick = initParticles();
      carouselTicks = initCarousels();
      masonryTick = initMasonryParallax();
      initCountUp();
      initGlowCards();
      initHeader();
      initAccount();
      initStaggeredMenu();
      initScrollProgress();
      initMobileBar();
      initYear();
      initInlineVideo();
      initAccordions();
      initAnchorNav();
      initAutoCarousels();
      initBrandTabs();
      brandsTick = initBrandsScroll();
      initTabs();
      initTeamCards();
      initEventFilters();
      gallery3dTick = initGallery3d();
      chromaTick = initChromaGrid();
      initForm();
      initBookCall();
      initHomeHero();
      initGsapScenes();
    } catch (e) {
      console.error("[init] composant en échec (non bloquant) :", e);
    }
    startEngine([particlesTick, masonryTick, brandsTick, gallery3dTick, chromaTick].concat(carouselTicks));
  });
})();
