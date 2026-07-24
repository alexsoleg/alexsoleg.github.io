// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-publications",
          title: "Publications",
          description: "Papers, preprints, conference work, and theses. Generated from BibTeX.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "Academic research projects, code, and personal creative work.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "Research focus, appointments, education, and skills.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "news-i-started-my-phd-in-machine-learning-at-universitat-politècnica-de-catalunya-upc-supervised-by-prof-javier-ruiz-hidalgo-and-prof-eliseo-ruiz",
          title: 'I started my PhD in Machine Learning at Universitat Politècnica de Catalunya (UPC),...',
          description: "",
          section: "News",},{id: "news-cartnet-was-published-in-digital-discovery-the-paper-introduces-a-cartesian-aware-graph-neural-network-for-crystal-property-prediction-with-a-first-application-to-thermal-ellipsoid-estimation",
          title: 'CartNet was published in Digital Discovery. The paper introduces a Cartesian-aware graph neural...',
          description: "",
          section: "News",},{id: "news-prism-was-published-in-npj-computational-materials-the-paper-studies-periodic-and-multiscale-graph-modelling-for-crystal-property-prediction",
          title: 'PRISM was published in npj Computational Materials. The paper studies periodic and multiscale...',
          description: "",
          section: "News",},{id: "news-two-new-preprints-are-online-machine-learning-multiscale-interactions-and-unate-both-continue-my-work-on-graph-learning-for-molecular-and-crystalline-systems",
          title: 'Two new preprints are online: Machine Learning Multiscale Interactions and UNATE. Both continue...',
          description: "",
          section: "News",},{id: "projects-cartnet",
          title: 'CartNet',
          description: "Cartesian-aware graph neural network for crystal property prediction and thermal ellipsoid estimation.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-prism",
          title: 'PRISM',
          description: "Periodic and multiscale graph modelling for crystal property prediction.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-muse",
          title: 'MuSE',
          description: "Hierarchical machine learning for multiscale interactions in molecules and materials.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{id: "projects-la-barraca-himnes-de-noticiari",
          title: 'La Barraca - Himnes de Noticiari',
          description: "Music video for La Barraca&#39;s &quot;Himnes de Noticiari&quot;.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/4_project/";
            },},{id: "projects-lomemefest",
          title: 'LoMemefest',
          description: "Festival de l&#39;humor de Ponent.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/5_project/";
            },},{id: "projects-river-debris-detection",
          title: 'River debris detection',
          description: "Deep learning and Sentinel-2 imagery for floating debris detection in rivers.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/6_project/";
            },},{id: "projects-l-entrevista-subt",
          title: 'L’Entrevista Subt',
          description: "Short film.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/7_lentrevista_subt/";
            },},{id: "projects-el-primer-dia",
          title: 'El Primer Dia',
          description: "Short film.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/8_el_primer_dia/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%61%6C%65%78%73%6F%6C%65%67@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/alexsoleg", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/alex-sole-gomez", "_blank");
        },
      },{
        id: 'social-orcid',
        title: 'ORCID',
        section: 'Socials',
        handler: () => {
          window.open("https://orcid.org/0000-0002-2071-9317", "_blank");
        },
      },{
        id: 'social-researchgate',
        title: 'ResearchGate',
        section: 'Socials',
        handler: () => {
          window.open("https://www.researchgate.net/profile/Alex-Sole-4/", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=Da_TlhIAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
