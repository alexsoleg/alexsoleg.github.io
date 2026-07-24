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
  const saveData = navigator.connection && navigator.connection.saveData;
  const revealItems = [];
  const parallaxItems = home ? Array.from(home.querySelectorAll("[data-parallax-speed]")) : [];

  let observer;
  let animationFrame;
  let parallaxEnabled = false;

  const registerReveal = (element, variant = "soft", delay = 0) => {
    if (!element || revealItems.includes(element)) return;

    element.dataset.motionReveal = variant;
    element.style.setProperty("--reveal-delay", `${delay}ms`);
    revealItems.push(element);
  };

  const registerSequence = (elements, variant, delayStep = 60) => {
    Array.from(elements).forEach((element, index) => {
      registerReveal(element, variant, Math.min(index, 5) * delayStep);
    });
  };

  if (home) {
    registerReveal(home.querySelector(".home-portrait"), "portrait");
    registerSequence(home.querySelectorAll(".home-hero__copy [data-reveal]"), "soft", 70);
    registerReveal(home.querySelector(".selected-research .editorial-section-header"), "heading");
    registerSequence(home.querySelectorAll(".research-strip > li"), "card", 75);
    registerReveal(home.querySelector(".home-about"), "section");
    registerReveal(home.querySelector(".home-publications"), "section");
    registerSequence(home.querySelectorAll(".home-publications .publication-entry"), "list", 55);
    registerReveal(home.querySelector(".home-contact"), "section");
  }

  if (projectsPage) {
    registerReveal(projectsPage.querySelector(".post-header"), "soft");
    projectsPage.querySelectorAll(".project-section").forEach((section) => {
      registerReveal(section.querySelector(".project-section__header"), "heading");
      registerSequence(section.querySelectorAll(".project-card"), "card", 85);
    });
  }

  if (publicationsPage) {
    registerReveal(publicationsPage.querySelector(".post-header"), "soft");
    registerReveal(publicationsPage.querySelector(".bibsearch-form-input"), "soft", 60);
    registerSequence(publicationsPage.querySelectorAll("h2.bibliography"), "heading");
    publicationsPage.querySelectorAll("ol.bibliography").forEach((list) => {
      registerSequence(list.querySelectorAll(".publication-entry"), "list", 55);
    });
  }

  if (cvPage) {
    registerReveal(cvPage.querySelector(".post-header"), "soft");
    cvPage.querySelectorAll(".cv-section").forEach((section) => {
      registerReveal(section.querySelector(".cv-section__title"), "heading");
      registerReveal(section.querySelector(".cv-section__content"), "list", 70);
    });
  }

  const resetReveals = () => {
    if (observer) {
      observer.disconnect();
      observer = undefined;
    }

    motionScopes.forEach((scope) => scope.classList.remove("motion-ready"));
    revealItems.forEach((item) => item.classList.remove("is-visible"));
  };

  const startReveals = () => {
    resetReveals();
    if (reducedMotion.matches) return;

    motionScopes.forEach((scope) => scope.classList.add("motion-ready"));

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -9% 0px", threshold: 0.08 },
    );
    revealItems.forEach((item) => observer.observe(item));
  };

  const updateParallax = () => {
    animationFrame = undefined;
    const offset = Math.min(window.scrollY, window.innerHeight);

    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallaxSpeed || 0);
      const translateY = Math.max(-20, Math.min(20, offset * speed));
      item.style.transform = `translate3d(0, ${translateY}px, 0)`;
    });
  };

  const requestParallaxUpdate = () => {
    if (parallaxEnabled && !animationFrame) animationFrame = requestAnimationFrame(updateParallax);
  };

  const stopParallax = () => {
    parallaxEnabled = false;
    window.removeEventListener("scroll", requestParallaxUpdate);
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    }
    parallaxItems.forEach((item) => item.style.removeProperty("transform"));
  };

  const configureParallax = () => {
    stopParallax();
    if (!home || reducedMotion.matches || narrowViewport.matches || coarsePointer.matches || saveData) return;

    parallaxEnabled = true;
    updateParallax();
    window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
  };

  const restartForMotionPreference = () => {
    startReveals();
    configureParallax();
  };

  reducedMotion.addEventListener("change", restartForMotionPreference);
  narrowViewport.addEventListener("change", configureParallax);
  coarsePointer.addEventListener("change", configureParallax);
  startReveals();
  configureParallax();
})();
