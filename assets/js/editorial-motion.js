(() => {
  const home = document.querySelector("[data-editorial-home]");
  const projectsPage = document.querySelector(".projects-page .editorial-page");
  const publicationsPage = document.querySelector(".publications-page .editorial-page");
  const cvPage = document.querySelector(".cv-page .editorial-cv");
  const motionScopes = [home, projectsPage, publicationsPage, cvPage].filter(Boolean);

  if (!motionScopes.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const narrowViewport = window.matchMedia("(max-width: 768px)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const revealItems = [];
  const depthItems = [];
  const parallaxItems = home ? Array.from(home.querySelectorAll("[data-parallax-speed]")) : [];

  let revealObserver;
  let animationFrame;
  let ambientMotionEnabled = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const saveDataEnabled = () => Boolean(connection && connection.saveData);
  const liteMotionEnabled = () => narrowViewport.matches || coarsePointer.matches || saveDataEnabled();

  const registerReveal = (element, variant = "soft", delay = 0, direction = 1) => {
    if (!element || revealItems.includes(element)) return;

    element.dataset.motionReveal = variant;
    element.dataset.motionDirection = direction > 0 ? "forward" : "reverse";
    element.style.setProperty("--reveal-delay", `${delay}ms`);
    revealItems.push(element);
  };

  const registerSequence = (elements, variant, delayStep = 70) => {
    Array.from(elements).forEach((element, index) => {
      const delay = Math.min(index, 6) * delayStep;
      const direction = index % 2 === 0 ? 1 : -1;
      registerReveal(element, variant, delay, direction);
    });
  };

  const registerDepth = (element, strength = 1) => {
    if (!element || depthItems.some((item) => item.element === element)) return;
    element.dataset.motionDepth = "";
    depthItems.push({ element, strength });
  };

  if (home) {
    registerReveal(home.querySelector(".home-portrait"), "portrait", 0);

    const heroCopy = Array.from(home.querySelectorAll(".home-hero__copy [data-reveal]"));
    heroCopy.forEach((element, index) => {
      let variant = "hero-copy";
      if (element.classList.contains("home-accent")) variant = "accent";
      if (element.classList.contains("editorial-cta")) variant = "cta";
      registerReveal(element, variant, 90 + index * 85);
    });

    registerReveal(home.querySelector(".selected-research .editorial-section-header"), "heading");
    registerSequence(home.querySelectorAll(".research-strip > li"), "tile", 95);

    const homeAbout = home.querySelector(".home-about");
    registerReveal(homeAbout && homeAbout.querySelector(".editorial-section-header"), "heading");
    registerReveal(homeAbout && homeAbout.querySelector(".home-about__copy"), "section", 80);
    registerReveal(homeAbout && homeAbout.querySelector(".editorial-text-link"), "cta", 150);

    const homePublications = home.querySelector(".home-publications");
    registerReveal(homePublications && homePublications.querySelector(".editorial-section-header"), "heading");
    registerSequence(home.querySelectorAll(".home-publications .publication-entry"), "publication", 65);

    const homeContact = home.querySelector(".home-contact");
    registerReveal(homeContact && homeContact.querySelector(".editorial-section-header"), "heading");
    registerReveal(homeContact && homeContact.querySelector(":scope > p"), "soft", 80);
    registerReveal(homeContact && homeContact.querySelector(".social"), "section", 145);

    registerDepth(home.querySelector(".home-hero"), 0.8);
    home.querySelectorAll(".research-strip > li").forEach((item) => registerDepth(item, 0.45));
  }

  if (projectsPage) {
    registerReveal(projectsPage.querySelector(".post-header"), "page-intro");

    projectsPage.querySelectorAll(".project-section").forEach((section, sectionIndex) => {
      const header = section.querySelector(".project-section__header");
      registerReveal(header && header.querySelector("h2"), "heading", 0, sectionIndex % 2 === 0 ? 1 : -1);
      registerReveal(header && header.querySelector("p"), "soft", 90);
      registerSequence(section.querySelectorAll(".project-card"), "project-card", 100);
    });

    projectsPage.querySelectorAll(".project-card--fun").forEach((card) => registerDepth(card, 0.7));
  }

  if (publicationsPage) {
    registerReveal(publicationsPage.querySelector(".post-header"), "page-intro");
    registerReveal(publicationsPage.querySelector(".bibsearch-form-input"), "search", 100);
    registerSequence(publicationsPage.querySelectorAll("h2.bibliography"), "year", 0);

    publicationsPage.querySelectorAll("ol.bibliography").forEach((list) => {
      registerSequence(list.querySelectorAll(".publication-entry"), "publication", 65);
    });
  }

  if (cvPage) {
    registerReveal(cvPage.querySelector(".post-header"), "page-intro");

    cvPage.querySelectorAll(".cv-section").forEach((section, sectionIndex) => {
      const direction = sectionIndex % 2 === 0 ? 1 : -1;
      registerReveal(section.querySelector(".cv-section__title"), "cv-heading", 0, direction);

      const entries = section.querySelectorAll(".cv-section__content .list-group-item");
      if (entries.length) {
        registerSequence(entries, "cv-entry", 70);
      } else {
        registerReveal(section.querySelector(".cv-section__content"), "cv-entry", 80, direction);
      }
    });
  }

  const disconnectRevealObserver = () => {
    if (!revealObserver) return;
    revealObserver.disconnect();
    revealObserver = undefined;
  };

  const showAllReveals = () => {
    motionScopes.forEach((scope) => scope.classList.remove("motion-ready", "motion-lite"));
    revealItems.forEach((item) => item.classList.remove("is-visible"));
  };

  const startReveals = () => {
    disconnectRevealObserver();
    showAllReveals();

    if (reducedMotion.matches) return;

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -7% 0px",
        threshold: 0.06,
      }
    );

    motionScopes.forEach((scope) => {
      scope.classList.add("motion-ready");
      scope.classList.toggle("motion-lite", liteMotionEnabled());
    });
    revealItems.forEach((item) => revealObserver.observe(item));
  };

  const updateAmbientMotion = () => {
    animationFrame = undefined;
    if (!ambientMotionEnabled || document.hidden) return;

    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight / 2;

    if (home) {
      const hero = home.querySelector(".home-hero");
      const heroHeight = hero ? hero.offsetHeight : viewportHeight;
      const heroProgress = clamp(window.scrollY / Math.max(heroHeight, 1), 0, 1);
      home.style.setProperty("--hero-flow-y", `${(heroProgress * 18).toFixed(2)}px`);
      home.style.setProperty("--hero-copy-y", `${(heroProgress * -14).toFixed(2)}px`);
      home.style.setProperty("--hero-portrait-y", `${(heroProgress * 8).toFixed(2)}px`);

      parallaxItems.forEach((item, index) => {
        const speed = Number(item.dataset.parallaxSpeed || 0);
        const translateY = clamp(window.scrollY * speed, -46, 46);
        const translateX = translateY * (index % 2 === 0 ? -0.18 : 0.14);
        const rotation = clamp(translateY * 0.008, -0.32, 0.32);
        item.style.setProperty("--parallax-x", `${translateX.toFixed(2)}px`);
        item.style.setProperty("--parallax-y", `${translateY.toFixed(2)}px`);
        item.style.setProperty("--parallax-rotation", `${rotation.toFixed(3)}deg`);
      });
    }

    depthItems.forEach(({ element, strength }) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom < -120 || bounds.top > viewportHeight + 120) return;

      const elementCenter = bounds.top + bounds.height / 2;
      const depth = clamp((viewportCenter - elementCenter) / viewportHeight, -1, 1) * strength;
      element.style.setProperty("--scroll-depth-y", `${(depth * -7).toFixed(2)}px`);
    });
  };

  const requestAmbientUpdate = () => {
    if (ambientMotionEnabled && !animationFrame) {
      animationFrame = requestAnimationFrame(updateAmbientMotion);
    }
  };

  const stopAmbientMotion = () => {
    ambientMotionEnabled = false;
    window.removeEventListener("scroll", requestAmbientUpdate);
    window.removeEventListener("resize", requestAmbientUpdate);

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    }

    motionScopes.forEach((scope) => scope.classList.remove("motion-ambient"));
    if (home) {
      home.style.removeProperty("--hero-flow-y");
      home.style.removeProperty("--hero-copy-y");
      home.style.removeProperty("--hero-portrait-y");
    }
    parallaxItems.forEach((item) => {
      item.style.removeProperty("--parallax-x");
      item.style.removeProperty("--parallax-y");
      item.style.removeProperty("--parallax-rotation");
    });
    depthItems.forEach(({ element }) => element.style.removeProperty("--scroll-depth-y"));
  };

  const configureAmbientMotion = () => {
    stopAmbientMotion();
    if (reducedMotion.matches || liteMotionEnabled()) return;

    ambientMotionEnabled = true;
    motionScopes.forEach((scope) => scope.classList.add("motion-ambient"));
    updateAmbientMotion();
    window.addEventListener("scroll", requestAmbientUpdate, { passive: true });
    window.addEventListener("resize", requestAmbientUpdate, { passive: true });
  };

  const restartMotion = () => {
    startReveals();
    configureAmbientMotion();
  };

  const handleVisibilityChange = () => {
    if (!document.hidden) requestAmbientUpdate();
  };

  reducedMotion.addEventListener("change", restartMotion);
  narrowViewport.addEventListener("change", restartMotion);
  coarsePointer.addEventListener("change", restartMotion);
  if (connection && typeof connection.addEventListener === "function") {
    connection.addEventListener("change", restartMotion);
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener(
    "pagehide",
    () => {
      disconnectRevealObserver();
      stopAmbientMotion();
    },
    { once: true }
  );

  startReveals();
  configureAmbientMotion();
})();
