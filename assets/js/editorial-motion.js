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
        researchStage: home.querySelector(".selected-research > .editorial-shell"),
        researchHeader: home.querySelector(".selected-research .editorial-section-header"),
        researchItems: Array.from(home.querySelectorAll(".research-strip > li")),
        about: home.querySelector('[data-scroll-scene="about"]'),
        aboutStage: home.querySelector(".home-about__stage"),
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
  let animationFrame;
  let ambientMotionEnabled = false;
  const homeSceneZones = new Map();

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, progress) => start + (end - start) * progress;
  const smoothstep = (progress) => progress * progress * (3 - 2 * progress);
  const range = (progress, start, end) => smoothstep(clamp((progress - start) / Math.max(end - start, 0.0001)));
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

  const sceneProgress = (bounds, viewportHeight, entryPoint = 0.92, exitPoint = 0.18) => {
    if (!bounds) return 1;
    const travel = Math.max(bounds.height - viewportHeight * exitPoint, viewportHeight * 0.62);
    return clamp((viewportHeight * entryPoint - bounds.top) / travel);
  };

  const stickyPreviewProgress = (sceneBounds, stageBounds, viewportHeight, stickyTop, entryPoint = 0.9) => {
    if (!sceneBounds || !stageBounds) return 1;
    const previewTop = viewportHeight * entryPoint;
    const stickyTravel = Math.max(sceneBounds.height - stageBounds.height, 1);
    const totalTravel = Math.max(previewTop - stickyTop + stickyTravel, 1);
    return clamp((previewTop - sceneBounds.top) / totalTravel);
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
    const stickyTop = narrowViewport.matches ? 64 : 72;
    const stageHeight = geometry.heroStage?.height || viewportHeight;
    const progress = liteMotionEnabled()
      ? clamp(-bounds.top / Math.max(bounds.height - viewportHeight * 0.38, viewportHeight * 0.62))
      : clamp((stickyTop - bounds.top) / Math.max(bounds.height - stageHeight, 1));
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
    setNumber(copy, "--copy-opacity", 1 - 0.86 * copyExit);

    const accentStretch = range(progress, 0.18, 0.5);
    const accentExit = range(progress, 0.62, 0.82);
    setNumber(accent, "--accent-scale", 1 + 5 * accentStretch);
    setNumber(accent, "--accent-opacity", 1 - accentExit);
  };

  const updateResearchScene = (viewportHeight, geometry) => {
    const { research, researchHeader, researchItems } = homeScenes;
    if (!research) return;

    const lite = liteMotionEnabled();
    const progress = lite
      ? viewportProgress(geometry.research, viewportHeight, 0.98, 0.26)
      : stickyPreviewProgress(geometry.research, geometry.researchStage, viewportHeight, 72);
    const distanceScale = lite ? 0.8 : 1;
    const headerProgress = lite ? viewportProgress(geometry.researchHeader, viewportHeight, 0.94, 0.6) : range(progress, 0.02, 0.22);

    setNumber(research, "--research-progress", progress);
    setPixels(researchHeader, "--research-header-x", -72 * (1 - headerProgress) * distanceScale);
    setPixels(researchHeader, "--research-header-y", 38 * (1 - headerProgress) * distanceScale);
    setNumber(researchHeader, "--research-header-opacity", 0.06 + 0.94 * headerProgress);
    setNumber(researchHeader, "--research-rule-scale", headerProgress);

    researchItems.forEach((item, index) => {
      const start = 0.1 + index * 0.11;
      const end = 0.39 + index * 0.11;
      const itemProgress = lite ? viewportProgress(geometry.researchItems[index], viewportHeight, 0.96, 0.42) : range(progress, start, end);
      const direction = index % 2 === 0 ? -1 : 1;

      setNumber(item, "--research-item-progress", itemProgress);
      setPixels(item, "--research-item-x", direction * 118 * (1 - itemProgress) * distanceScale);
      setPixels(item, "--research-item-y", 88 * (1 - itemProgress) * distanceScale);
      setDegrees(item, "--research-item-rotate", direction * -4.2 * (1 - itemProgress) * distanceScale);
      setNumber(item, "--research-item-scale", 0.78 + 0.22 * itemProgress);
      setNumber(item, "--research-item-opacity", 0.04 + 0.96 * itemProgress);
      setPixels(item, "--research-logo-y", 42 * (1 - itemProgress) * distanceScale);
      setDegrees(item, "--research-logo-rotate", direction * 10 * (1 - itemProgress) * distanceScale);
      setPixels(item, "--research-label-x", direction * -48 * (1 - itemProgress) * distanceScale);
      setNumber(item, "--research-divider-scale", lite ? itemProgress : range(progress, start + 0.06, end + 0.08));
    });
  };

  const updateAboutScene = (viewportHeight, geometry) => {
    const { about, aboutHeader, aboutParagraphs, aboutLink } = homeScenes;
    if (!about) return;

    const lite = liteMotionEnabled();
    const progress = lite
      ? viewportProgress(geometry.about, viewportHeight, 0.98, 0.22)
      : stickyPreviewProgress(geometry.about, geometry.aboutStage, viewportHeight, 72);
    const distanceScale = lite ? 0.8 : 1;
    const headerProgress = lite ? viewportProgress(geometry.aboutHeader, viewportHeight, 0.94, 0.62) : range(progress, 0.02, 0.2);
    const firstProgress = lite ? viewportProgress(geometry.aboutParagraphs[0], viewportHeight, 0.96, 0.5) : range(progress, 0.14, 0.44);
    const secondProgress = lite ? viewportProgress(geometry.aboutParagraphs[1], viewportHeight, 0.96, 0.5) : range(progress, 0.4, 0.7);
    const firstSettle = range(progress, 0.5, 0.72);
    const firstRestore = range(progress, 0.84, 1);
    const linkProgress = lite ? viewportProgress(geometry.aboutLink, viewportHeight, 0.96, 0.56) : range(progress, 0.68, 0.9);

    setNumber(about, "--about-progress", progress);
    setPixels(aboutHeader, "--about-header-x", -76 * (1 - headerProgress) * distanceScale);
    setNumber(aboutHeader, "--about-header-opacity", 0.05 + 0.95 * headerProgress);
    setNumber(aboutHeader, "--about-rule-scale", headerProgress);

    if (aboutParagraphs[0]) {
      setPixels(aboutParagraphs[0], "--about-copy-y", (74 * (1 - firstProgress) - 18 * firstSettle) * distanceScale);
      setNumber(aboutParagraphs[0], "--about-copy-opacity", clamp(0.06 + 0.94 * firstProgress - 0.3 * firstSettle + 0.15 * firstRestore, 0.06, 1));
      setPercent(aboutParagraphs[0], "--about-copy-clip", 46 * (1 - firstProgress));
    }

    if (aboutParagraphs[1]) {
      setPixels(aboutParagraphs[1], "--about-copy-y", 82 * (1 - secondProgress) * distanceScale);
      setNumber(aboutParagraphs[1], "--about-copy-opacity", 0.05 + 0.95 * secondProgress);
      setPercent(aboutParagraphs[1], "--about-copy-clip", 48 * (1 - secondProgress));
    }

    setPixels(aboutLink, "--about-link-y", 42 * (1 - linkProgress) * distanceScale);
    setPixels(aboutLink, "--about-link-arrow-x", -20 * (1 - linkProgress) * distanceScale);
    setNumber(aboutLink, "--about-link-opacity", 0.04 + 0.96 * linkProgress);
    setNumber(aboutLink, "--about-link-line-scale", linkProgress);
  };

  const updatePublicationsScene = (viewportHeight, geometry) => {
    const { publications, publicationsHeader, publicationEntries } = homeScenes;
    if (!publications) return;

    const sectionProgress = sceneProgress(geometry.publications, viewportHeight, 0.94, 0.08);
    const headerProgress = range(sectionProgress, 0, 0.18);
    const distanceScale = liteMotionEnabled() ? 0.68 : 1;

    setNumber(publications, "--publications-progress", sectionProgress);
    setPixels(publicationsHeader, "--publications-header-y", 54 * (1 - headerProgress) * distanceScale);
    setNumber(publicationsHeader, "--publications-header-opacity", 0.05 + 0.95 * headerProgress);

    publicationEntries.forEach((entry, index) => {
      const bounds = geometry.publicationEntries[index];
      const progress = clamp((viewportHeight * 0.94 - bounds.top) / (viewportHeight * 0.56));
      const direction = index % 2 === 0 ? -1 : 1;
      const titleProgress = range(progress, 0.08, 0.55);
      const metaProgress = range(progress, 0.28, 0.74);
      const linksProgress = range(progress, 0.5, 0.92);

      setNumber(entry, "--publication-progress", progress);
      setPixels(entry, "--publication-x", direction * 104 * (1 - progress) * distanceScale);
      setPixels(entry, "--publication-y", 38 * (1 - progress) * distanceScale);
      setDegrees(entry, "--publication-rotate", direction * -1.6 * (1 - progress) * distanceScale);
      setNumber(entry, "--publication-opacity", 0.04 + 0.96 * progress);
      setNumber(entry, "--publication-line-scale", range(progress, 0.08, 0.48));
      setPixels(entry, "--publication-title-y", 34 * (1 - titleProgress) * distanceScale);
      setNumber(entry, "--publication-title-opacity", 0.04 + 0.96 * titleProgress);
      setPixels(entry, "--publication-meta-y", 28 * (1 - metaProgress) * distanceScale);
      setNumber(entry, "--publication-meta-opacity", 0.04 + 0.96 * metaProgress);
      setPixels(entry, "--publication-links-y", 24 * (1 - linksProgress) * distanceScale);
      setNumber(entry, "--publication-links-opacity", 0.04 + 0.96 * linksProgress);
    });
  };

  const updateContactScene = (viewportHeight, geometry) => {
    const { contact, contactHeader, contactText, contactSocial, contactIcons, contactNote } = homeScenes;
    if (!contact) return;

    const progress = sceneProgress(geometry.contact, viewportHeight, 0.96, 0.12);
    const distanceScale = liteMotionEnabled() ? 0.68 : 1;
    const headerProgress = range(progress, 0.04, 0.32);
    const textProgress = range(progress, 0.18, 0.55);
    const socialProgress = range(progress, 0.38, 0.78);
    const noteProgress = range(progress, 0.66, 0.94);

    setNumber(contact, "--contact-progress", progress);
    setNumber(contact, "--contact-border-scale", range(progress, 0, 0.2));
    setPixels(contactHeader, "--contact-header-x", -68 * (1 - headerProgress) * distanceScale);
    setNumber(contactHeader, "--contact-header-opacity", 0.04 + 0.96 * headerProgress);
    setPixels(contactText, "--contact-text-y", 74 * (1 - textProgress) * distanceScale);
    setNumber(contactText, "--contact-text-opacity", 0.04 + 0.96 * textProgress);
    setPixels(contactSocial, "--contact-social-y", 34 * (1 - socialProgress) * distanceScale);
    setNumber(contactSocial, "--contact-social-opacity", 0.04 + 0.96 * socialProgress);
    setPixels(contactNote, "--contact-note-y", 28 * (1 - noteProgress) * distanceScale);
    setNumber(contactNote, "--contact-note-opacity", 0.04 + 0.96 * noteProgress);

    const center = (contactIcons.length - 1) / 2;
    contactIcons.forEach((icon, index) => {
      const iconProgress = range(progress, 0.4 + index * 0.055, 0.7 + index * 0.055);
      setPixels(icon, "--contact-icon-x", (center - index) * 44 * (1 - iconProgress) * distanceScale);
      setPixels(icon, "--contact-icon-y", 42 * (1 - iconProgress) * distanceScale);
      setDegrees(icon, "--contact-icon-rotate", (-14 + index * 5.5) * (1 - iconProgress) * distanceScale);
      setNumber(icon, "--contact-icon-opacity", 0.04 + 0.96 * iconProgress);
    });
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

    if (updates.hero) {
      geometry.heroStage = homeScenes.heroStage?.getBoundingClientRect();
    }
    if (updates.research) {
      geometry.researchStage = homeScenes.researchStage?.getBoundingClientRect();
      geometry.researchHeader = homeScenes.researchHeader?.getBoundingClientRect();
      geometry.researchItems = homeScenes.researchItems.map((item) => item.getBoundingClientRect());
    }
    if (updates.about) {
      geometry.aboutStage = homeScenes.aboutStage?.getBoundingClientRect();
      geometry.aboutHeader = homeScenes.aboutHeader?.getBoundingClientRect();
      geometry.aboutParagraphs = homeScenes.aboutParagraphs.map((paragraph) => paragraph.getBoundingClientRect());
      geometry.aboutLink = homeScenes.aboutLink?.getBoundingClientRect();
    }
    if (updates.publications) {
      geometry.publicationEntries = homeScenes.publicationEntries.map((entry) => entry.getBoundingClientRect());
    }

    homeScenes.hero?.classList.toggle("is-motion-near", sceneZone(geometry.hero, viewportHeight) === "near");

    if (updates.hero) updateHeroScene(viewportWidth, viewportHeight, geometry);
    if (updates.research) updateResearchScene(viewportHeight, geometry);
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

  const stopAmbientMotion = () => {
    ambientMotionEnabled = false;
    window.removeEventListener("scroll", requestAmbientUpdate);
    window.removeEventListener("resize", requestAmbientUpdate);

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    }

    motionScopes.forEach((scope) => scope.classList.remove("motion-ambient"));
    home?.classList.remove("motion-home-active", "motion-home-lite");
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
