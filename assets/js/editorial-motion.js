(() => {
  const home = document.querySelector("[data-editorial-home]");
  const projectsPage = document.querySelector(".projects-page .editorial-page");
  const publicationsPage = document.querySelector(".publications-page .editorial-page");
  const cvPage = document.querySelector(".cv-page .editorial-cv");
  const motionScopes = [home, projectsPage, publicationsPage, cvPage].filter(Boolean);

  if (!motionScopes.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const narrowViewport = window.matchMedia("(max-width: 767px)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const revealItems = [];
  const depthItems = [];

  const homeScenes = home
    ? {
        hero: home.querySelector('[data-scroll-scene="hero"]'),
        heroStage: home.querySelector(".home-hero__stage"),
        flow: home.querySelector(".home-hero__flow img"),
        portrait: home.querySelector(".home-portrait"),
        copy: home.querySelector(".home-hero__copy"),
        accent: home.querySelector(".home-accent"),
        words: Array.from(home.querySelectorAll(".home-hero__word")),
        research: home.querySelector('[data-scroll-scene="research"]'),
        researchHeader: home.querySelector(".selected-research .editorial-section-header"),
        researchStrip: home.querySelector(".research-strip"),
        researchItems: Array.from(home.querySelectorAll(".research-strip > li")),
        about: home.querySelector('[data-scroll-scene="about"]'),
        aboutHeader: home.querySelector(".home-about .editorial-section-header"),
        aboutParagraphs: Array.from(home.querySelectorAll(".home-about__copy > p")),
        aboutLink: home.querySelector(".home-about .editorial-text-link"),
        publications: home.querySelector('[data-scroll-scene="publications"]'),
        publicationsHeader: home.querySelector(".home-publications .editorial-section-header"),
        publicationEntries: Array.from(home.querySelectorAll(".home-publications .publication-entry")),
        contact: home.querySelector('[data-scroll-scene="contact"]'),
        contactHeader: home.querySelector(".home-contact .editorial-section-header"),
        contactText: home.querySelector(".home-contact > p"),
        contactSocial: home.querySelector(".home-contact .social"),
        contactIcons: Array.from(home.querySelectorAll(".home-contact .contact-icons a")),
        contactNote: home.querySelector(".home-contact .contact-note"),
      }
    : null;

  let revealObserver;
  let contactMotionObserver;
  let animationFrame;
  let ambientMotionEnabled = false;
  const homeSceneZones = new Map();

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, progress) => start + (end - start) * progress;
  const smoothstep = (progress) => progress * progress * (3 - 2 * progress);
  const range = (progress, start, end) => smoothstep(clamp((progress - start) / Math.max(end - start, 0.0001)));
  const pulse = (progress, start, peak, end) => range(progress, start, peak) * (1 - range(progress, peak, end));
  const saveDataEnabled = () => Boolean(connection && connection.saveData);
  const liteMotionEnabled = () => narrowViewport.matches || coarsePointer.matches;
  const setNumber = (element, property, value) => element?.style.setProperty(property, value.toFixed(4));
  const setPixels = (element, property, value) => element?.style.setProperty(property, `${value.toFixed(2)}px`);
  const setDegrees = (element, property, value) => element?.style.setProperty(property, `${value.toFixed(3)}deg`);
  const setPercent = (element, property, value) => element?.style.setProperty(property, `${value.toFixed(2)}%`);

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

  const viewportProgress = (bounds, viewportHeight, entryPoint = 0.94, settlePoint = 0.34) => {
    if (!bounds) return 1;
    return clamp((viewportHeight * entryPoint - bounds.top) / (viewportHeight * (entryPoint - settlePoint)));
  };

  const sceneZone = (bounds, viewportHeight) => {
    if (!bounds) return "missing";
    if (bounds.bottom < viewportHeight * -0.35) return "after";
    if (bounds.top > viewportHeight * 1.35) return "before";
    return "near";
  };

  const shouldUpdateScene = (key, bounds, viewportHeight) => {
    const zone = sceneZone(bounds, viewportHeight);
    const previousZone = homeSceneZones.get(key);
    homeSceneZones.set(key, zone);
    return zone === "near" || zone !== previousZone;
  };

  const updateHeroScene = (viewportWidth, viewportHeight, geometry) => {
    const { hero, flow, portrait, copy, accent, words } = homeScenes;
    if (!hero) return;

    const bounds = geometry.hero;
    const progress = liteMotionEnabled()
      ? clamp(-bounds.top / Math.max(bounds.height - viewportHeight * 0.38, viewportHeight * 0.62))
      : clamp(-bounds.top / Math.max(bounds.height * 0.74, viewportHeight * 0.58));
    const distanceScale = liteMotionEnabled() ? 0.76 : 1;

    setNumber(home, "--hero-progress", progress);

    const flowProgress = range(progress, 0, 1);
    setPixels(flow, "--flow-x", -viewportWidth * 0.065 * flowProgress * distanceScale);
    setPixels(flow, "--flow-y", 88 * flowProgress * distanceScale);
    setDegrees(flow, "--flow-rotate", 0.35 * flowProgress * distanceScale);
    setNumber(flow, "--flow-scale", 1.02 + 0.05 * flowProgress * distanceScale);
    setNumber(flow, "--flow-opacity", 0.88 - 0.46 * flowProgress);

    const machineLearning = words[0];
    const graphs = words[1];
    const dynamics = words[2];
    const machineIn = range(progress, 0, 0.18);
    const machineOut = range(progress, 0.3, 0.48);
    const graphIn = range(progress, 0.18, 0.44);
    const graphOut = range(progress, 0.55, 0.72);
    const dynamicsIn = range(progress, 0.46, 0.74);
    const dynamicsSettle = range(progress, 0.86, 1);

    setPixels(machineLearning, "--word-x", -viewportWidth * 0.18 * progress * distanceScale);
    setPixels(machineLearning, "--word-y", lerp(20, -56, progress) * distanceScale);
    setDegrees(machineLearning, "--word-rotate", lerp(0.8, -0.45, progress) * distanceScale);
    setNumber(machineLearning, "--word-opacity", clamp(0.58 + 0.22 * machineIn - 0.18 * machineOut, 0.42, 0.8));

    setPixels(graphs, "--word-x", -viewportWidth * 0.12 * progress * distanceScale);
    setPixels(graphs, "--word-y", lerp(30, -20, progress) * distanceScale);
    setDegrees(graphs, "--word-rotate", lerp(-1, 0.6, progress) * distanceScale);
    setNumber(graphs, "--word-opacity", clamp(0.42 + 0.38 * graphIn - 0.2 * graphOut, 0.38, 0.8));

    setPixels(dynamics, "--word-x", -viewportWidth * 0.08 * progress * distanceScale);
    setPixels(dynamics, "--word-y", lerp(10, -64, progress) * distanceScale);
    setDegrees(dynamics, "--word-rotate", lerp(0.9, -0.5, progress) * distanceScale);
    setNumber(dynamics, "--word-opacity", clamp(0.42 + 0.38 * dynamicsIn - 0.15 * dynamicsSettle, 0.38, 0.8));

    const portraitLift = range(progress, 0.08, 0.6);
    const portraitExit = range(progress, 0.66, 0.95);
    setPixels(portrait, "--portrait-x", -52 * portraitExit * distanceScale);
    setPixels(portrait, "--portrait-y", -44 * portraitLift * distanceScale);
    setDegrees(portrait, "--portrait-rotate", -1.4 * portraitLift * distanceScale);
    setNumber(portrait, "--portrait-opacity", 1 - 0.72 * portraitExit);
    setPercent(portrait, "--portrait-clip-right", 18 * portraitExit);

    const copyLift = range(progress, 0.12, 0.72);
    const copyExit = range(progress, 0.58, 0.88);
    setPixels(copy, "--copy-x", 36 * copyExit * distanceScale);
    setPixels(copy, "--copy-y", -92 * copyLift * distanceScale);
    setNumber(copy, "--copy-opacity", 1 - 0.72 * copyExit);

    const accentStretch = range(progress, 0.18, 0.5);
    const accentExit = range(progress, 0.62, 0.82);
    setNumber(accent, "--accent-scale", 1 + 5 * accentStretch);
    setNumber(accent, "--accent-opacity", 1 - accentExit);
  };

  const updateResearchScene = (viewportWidth, viewportHeight, geometry) => {
    const { research, researchHeader, researchStrip, researchItems } = homeScenes;
    if (!research) return;

    const lite = liteMotionEnabled();
    const progress = viewportProgress(geometry.research, viewportHeight, lite ? 0.98 : 1.02, lite ? 0.3 : 0.22);
    const distanceScale = lite ? 0.72 : 1;
    const headerProgress = range(progress, 0, 0.22);
    const morphEnabled = viewportWidth >= 992 && !lite;
    const layoutProgress = morphEnabled ? viewportProgress(geometry.researchStrip, viewportHeight, 0.82, 0.22) : 1;
    const rowDropProgress = morphEnabled ? range(layoutProgress, 0, 0.44) : 1;
    const rowReflowProgress = morphEnabled ? range(layoutProgress, 0.44, 1) : 1;
    const stripWidth = geometry.researchStrip?.width || 0;
    const layoutGap = clamp(viewportWidth * 0.009, 10, 16);
    const cardHeight = clamp(viewportWidth * 0.105, 138, 164);
    const rowWidth = Math.max((stripWidth - layoutGap * 3) / 4, 0);
    const gridWidth = Math.max((stripWidth - layoutGap) / 2, 0);

    setNumber(research, "--research-progress", progress);
    setNumber(research, "--research-rail-progress", range(progress, 0.03, 0.9));
    setNumber(researchStrip, "--research-layout-progress", layoutProgress);
    setPixels(researchStrip, "--research-layout-gap", layoutGap);
    setPixels(researchStrip, "--research-card-height", cardHeight);
    setPixels(researchStrip, "--research-strip-height", cardHeight * 2 + layoutGap);
    setPixels(researchHeader, "--research-header-x", 0);
    setPixels(researchHeader, "--research-header-y", 0);
    setNumber(researchHeader, "--research-header-opacity", 1);
    setNumber(researchHeader, "--research-rule-scale", 0.3 + 0.7 * headerProgress);

    researchItems.forEach((item, index) => {
      const start = 0.02 + index * 0.11;
      const peak = 0.18 + index * 0.11;
      const end = 0.4 + index * 0.11;
      const focus = pulse(progress, start, peak, end);
      const direction = index % 2 === 0 ? -1 : 1;
      const rowX = index * (rowWidth + layoutGap);
      const gridX = (index % 2) * (gridWidth + layoutGap);
      const gridY = Math.floor(index / 2) * (cardHeight + layoutGap);

      setNumber(item, "--research-focus", focus);
      setNumber(item, "--research-halo-opacity", 0.82 * focus);
      setNumber(item, "--research-halo-scale", 0.9 + 0.1 * focus);
      setPixels(item, "--research-layout-x", lerp(rowX, gridX, rowReflowProgress));
      setPixels(item, "--research-layout-y", lerp(0, gridY, rowDropProgress));
      setPixels(item, "--research-layout-width", lerp(rowWidth, gridWidth, rowReflowProgress));
      setPixels(item, "--research-logo-y", -6 * focus * distanceScale);
      setDegrees(item, "--research-logo-rotate", direction * 2 * focus * distanceScale);
      setNumber(item, "--research-logo-scale", 1 + 0.06 * focus);
      setNumber(item, "--research-divider-scale", 1);
    });
  };

  const updateAboutScene = (viewportHeight, geometry) => {
    const { about, aboutHeader, aboutParagraphs, aboutLink } = homeScenes;
    if (!about) return;

    const lite = liteMotionEnabled();
    const progress = viewportProgress(geometry.about, viewportHeight, lite ? 0.98 : 1.02, lite ? 0.28 : 0.18);
    const distanceScale = lite ? 0.72 : 1;
    const headerProgress = range(progress, 0, 0.2);
    const firstFocus = pulse(progress, 0.1, 0.3, 0.52);
    const secondFocus = pulse(progress, 0.36, 0.58, 0.8);
    const linkFocus = pulse(progress, 0.62, 0.8, 0.96);
    const sceneGlow = Math.sin(Math.PI * progress);

    setNumber(about, "--about-progress", progress);
    setNumber(about, "--about-glow-opacity", 0.28 * sceneGlow);
    setPercent(about, "--about-glow-x", lerp(18, 82, progress));
    setPixels(aboutHeader, "--about-header-x", 0);
    setNumber(aboutHeader, "--about-header-opacity", 1);
    setNumber(aboutHeader, "--about-rule-scale", 0.3 + 0.7 * headerProgress);

    if (aboutParagraphs[0]) {
      setPixels(aboutParagraphs[0], "--about-copy-y", -4 * firstFocus * distanceScale);
      setNumber(aboutParagraphs[0], "--about-copy-opacity", 1);
      setNumber(aboutParagraphs[0], "--about-copy-focus", firstFocus);
      setPercent(aboutParagraphs[0], "--about-copy-clip", 0);
    }

    if (aboutParagraphs[1]) {
      setPixels(aboutParagraphs[1], "--about-copy-y", -4 * secondFocus * distanceScale);
      setNumber(aboutParagraphs[1], "--about-copy-opacity", 1);
      setNumber(aboutParagraphs[1], "--about-copy-focus", secondFocus);
      setPercent(aboutParagraphs[1], "--about-copy-clip", 0);
    }

    setPixels(aboutLink, "--about-link-y", -3 * linkFocus * distanceScale);
    setPixels(aboutLink, "--about-link-arrow-x", 6 * linkFocus * distanceScale);
    setNumber(aboutLink, "--about-link-opacity", 1);
    setNumber(aboutLink, "--about-link-line-scale", 0.3 + 0.7 * range(progress, 0.55, 0.86));
  };

  const updatePublicationsScene = (viewportHeight, geometry) => {
    const { publications, publicationsHeader, publicationEntries } = homeScenes;
    if (!publications) return;

    const sectionProgress = viewportProgress(geometry.publications, viewportHeight, 1.02, 0.16);
    const headerProgress = range(sectionProgress, 0, 0.18);
    const distanceScale = liteMotionEnabled() ? 0.68 : 1;

    setNumber(publications, "--publications-progress", sectionProgress);
    setPixels(publicationsHeader, "--publications-header-y", 0);
    setNumber(publicationsHeader, "--publications-header-opacity", 1);

    publicationEntries.forEach((entry, index) => {
      const start = 0.08 + index * 0.14;
      const peak = 0.26 + index * 0.14;
      const end = 0.5 + index * 0.14;
      const focus = pulse(sectionProgress, start, peak, end);
      const direction = index % 2 === 0 ? -1 : 1;

      setNumber(entry, "--publication-progress", sectionProgress);
      setNumber(entry, "--publication-focus", focus);
      setPixels(entry, "--publication-x", direction * 7 * focus * distanceScale);
      setPixels(entry, "--publication-y", -4 * focus * distanceScale);
      setDegrees(entry, "--publication-rotate", direction * 0.35 * focus * distanceScale);
      setNumber(entry, "--publication-opacity", 1);
      setNumber(entry, "--publication-line-scale", 0.35 + 0.65 * headerProgress);
      setPixels(entry, "--publication-title-y", 0);
      setNumber(entry, "--publication-title-opacity", 1);
      setPixels(entry, "--publication-meta-y", 0);
      setNumber(entry, "--publication-meta-opacity", 1);
      setPixels(entry, "--publication-links-y", 0);
      setNumber(entry, "--publication-links-opacity", 1);
    });
  };

  const updateContactScene = (viewportHeight, geometry) => {
    const { contact, contactHeader, contactText, contactSocial, contactNote } = homeScenes;
    if (!contact) return;

    const progress = viewportProgress(geometry.contact, viewportHeight, 1.02, 0.55);
    const sectionGlow = Math.sin(Math.PI * progress);

    setNumber(contact, "--contact-progress", progress);
    setNumber(contact, "--contact-border-scale", 0.3 + 0.7 * range(progress, 0, 0.28));
    setNumber(contact, "--contact-glow-opacity", 0.3 * sectionGlow);
    setPixels(contactHeader, "--contact-header-x", 0);
    setNumber(contactHeader, "--contact-header-opacity", 1);
    setPixels(contactText, "--contact-text-y", 0);
    setNumber(contactText, "--contact-text-opacity", 1);
    setPixels(contactSocial, "--contact-social-y", 0);
    setNumber(contactSocial, "--contact-social-opacity", 1);
    setPixels(contactNote, "--contact-note-y", 0);
    setNumber(contactNote, "--contact-note-opacity", 1);
  };

  const updateHomeMotion = (viewportWidth, viewportHeight) => {
    if (!homeScenes) return;

    const geometry = {
      hero: homeScenes.hero?.getBoundingClientRect(),
      research: homeScenes.research?.getBoundingClientRect(),
      about: homeScenes.about?.getBoundingClientRect(),
      publications: homeScenes.publications?.getBoundingClientRect(),
      contact: homeScenes.contact?.getBoundingClientRect(),
    };
    const updates = {
      hero: shouldUpdateScene("hero", geometry.hero, viewportHeight),
      research: shouldUpdateScene("research", geometry.research, viewportHeight),
      about: shouldUpdateScene("about", geometry.about, viewportHeight),
      publications: shouldUpdateScene("publications", geometry.publications, viewportHeight),
      contact: shouldUpdateScene("contact", geometry.contact, viewportHeight),
    };

    if (updates.research) {
      geometry.researchStrip = homeScenes.researchStrip?.getBoundingClientRect();
    }

    homeScenes.hero?.classList.toggle("is-motion-near", sceneZone(geometry.hero, viewportHeight) === "near");

    if (updates.hero) updateHeroScene(viewportWidth, viewportHeight, geometry);
    if (updates.research) updateResearchScene(viewportWidth, viewportHeight, geometry);
    if (updates.about) updateAboutScene(viewportHeight, geometry);
    if (updates.publications) updatePublicationsScene(viewportHeight, geometry);
    if (updates.contact) updateContactScene(viewportHeight, geometry);
  };

  const updateAmbientMotion = () => {
    animationFrame = undefined;
    if (!ambientMotionEnabled || document.hidden) return;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const viewportCenter = viewportHeight / 2;

    updateHomeMotion(viewportWidth, viewportHeight);

    if (!liteMotionEnabled()) {
      depthItems.forEach(({ element, strength }) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom < -120 || bounds.top > viewportHeight + 120) return;

        const elementCenter = bounds.top + bounds.height / 2;
        const depth = clamp((viewportCenter - elementCenter) / viewportHeight, -1, 1) * strength;
        element.style.setProperty("--scroll-depth-y", `${(depth * -7).toFixed(2)}px`);
      });
    }
  };

  const requestAmbientUpdate = () => {
    if (ambientMotionEnabled && !animationFrame) {
      animationFrame = requestAnimationFrame(updateAmbientMotion);
    }
  };

  const disconnectContactMotionObserver = () => {
    if (!contactMotionObserver) return;
    contactMotionObserver.disconnect();
    contactMotionObserver = undefined;
  };

  const startContactMotion = () => {
    const { contact, contactIcons } = homeScenes || {};
    if (!contact) return;

    disconnectContactMotionObserver();
    contact.classList.remove("is-contact-animated");
    contactIcons.forEach((icon, index) => icon.style.setProperty("--contact-delay", `${index * 70}ms`));

    if (!("IntersectionObserver" in window)) {
      contact.classList.add("is-contact-animated");
      return;
    }

    contactMotionObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        contact.classList.add("is-contact-animated");
        disconnectContactMotionObserver();
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      }
    );
    contactMotionObserver.observe(contact);
  };

  const stopAmbientMotion = () => {
    ambientMotionEnabled = false;
    window.removeEventListener("scroll", requestAmbientUpdate);
    window.removeEventListener("resize", requestAmbientUpdate);
    disconnectContactMotionObserver();

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    }

    motionScopes.forEach((scope) => scope.classList.remove("motion-ambient"));
    home?.classList.remove("motion-home-active", "motion-home-lite");
    homeScenes?.contact?.classList.remove("is-contact-animated");
    homeScenes?.hero?.classList.remove("is-motion-near");
    document.documentElement.classList.remove("home-motion-prepared");
    homeSceneZones.clear();
    depthItems.forEach(({ element }) => element.style.removeProperty("--scroll-depth-y"));
  };

  const configureAmbientMotion = () => {
    stopAmbientMotion();
    if (reducedMotion.matches || saveDataEnabled()) return;

    ambientMotionEnabled = true;
    motionScopes.forEach((scope) => scope.classList.add("motion-ambient"));
    home?.classList.add("motion-home-active");
    home?.classList.toggle("motion-home-lite", liteMotionEnabled());
    if (home) window.__editorialHomeMotionReady = true;
    updateAmbientMotion();
    startContactMotion();
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
  window.addEventListener("pagehide", () => {
    disconnectRevealObserver();
    stopAmbientMotion();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) restartMotion();
  });

  startReveals();
  configureAmbientMotion();
})();
