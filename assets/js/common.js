$(document).ready(function () {
  // Keep publication disclosures mutually exclusive and expose their state
  // to keyboard and assistive-technology users.
  $(".publication-toggle").on("click", function () {
    const entry = this.closest(".publication-entry");
    const targetId = this.getAttribute("aria-controls");
    const target = document.getElementById(targetId);

    if (!entry || !target) return;

    const willOpen = target.hidden;

    entry.querySelectorAll(".publication-disclosure").forEach((panel) => {
      panel.hidden = true;
    });
    entry.querySelectorAll(".publication-toggle").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });

    if (willOpen) {
      target.hidden = false;
      this.setAttribute("aria-expanded", "true");
    }
  });

  $(".more-authors").on("click", function () {
    const isExpanded = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", String(!isExpanded));
    this.innerHTML = isExpanded ? this.dataset.collapsedLabel : this.dataset.expandedLabel;
  });

  $("a").removeClass("waves-effect waves-light");

  // bootstrap-toc
  if ($("#toc-sidebar").length) {
    // remove related publications years from the TOC
    $(".publications h2").each(function () {
      $(this).attr("data-toc-skip", "");
    });
    var navSelector = "#toc-sidebar";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
      offset: 100,
    });
  }

  // add css to jupyter notebooks
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  let jupyterTheme = determineComputedTheme();

  $(".jupyter-notebook-iframe-container iframe").each(function () {
    $(this).contents().find("head").append(cssLink);

    if (jupyterTheme == "dark") {
      $(this).bind("load", function () {
        $(this).contents().find("body").attr({
          "data-jp-theme-light": "false",
          "data-jp-theme-name": "JupyterLab Dark",
        });
      });
    }
  });

  // trigger popovers
  $('[data-toggle="popover"]').popover({
    trigger: "hover",
  });
});
