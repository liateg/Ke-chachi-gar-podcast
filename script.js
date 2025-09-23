document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu elements
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!mobileMenuButton || !mobileMenu) return;

  // Ensure initial state
  mobileMenu.classList.add("hidden");
  mobileMenu.setAttribute("data-open", "false");
  mobileMenu.setAttribute("aria-hidden", "true");
  mobileMenuButton.setAttribute("aria-expanded", "false");
  mobileMenuButton.setAttribute("aria-label", "Open menu");

  const openMenu = () => {
    mobileMenu.classList.remove("hidden");
    mobileMenu.setAttribute("data-open", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
    mobileMenuButton.setAttribute("aria-expanded", "true");
    mobileMenuButton.setAttribute("aria-label", "Close menu");
    // focus first focusable child for accessibility
    const first = mobileMenu.querySelector(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    if (first) first.focus();
    // Optional: prevent background scroll while menu open
    document.documentElement.style.overflow = "hidden";
  };

  const closeMenu = () => {
    mobileMenu.classList.add("hidden");
    mobileMenu.setAttribute("data-open", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenuButton.setAttribute("aria-expanded", "false");
    mobileMenuButton.setAttribute("aria-label", "Open menu");
    document.documentElement.style.overflow = "";
    // return focus to button
    mobileMenuButton.focus();
  };

  mobileMenuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = mobileMenu.getAttribute("data-open") === "true";
    if (isOpen) closeMenu();
    else openMenu();
  });

  // Close if clicking outside (only when open)
  document.addEventListener("click", (e) => {
    const isOpen = mobileMenu.getAttribute("data-open") === "true";
    if (!isOpen) return;
    if (
      !mobileMenu.contains(e.target) &&
      !mobileMenuButton.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const isOpen = mobileMenu.getAttribute("data-open") === "true";
      if (isOpen) closeMenu();
    }
  });
});

// Section reveal animations using IntersectionObserver
(() => {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) {
    // If user prefers reduced motion, make reveal elements visible immediately
    document
      .querySelectorAll(".reveal")
      .forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const STAGGER_MS = 80;

  // Auto-add reveal-child to common elements inside .reveal sections
  const AUTO_CHILD_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,button,a,img";
  document.querySelectorAll(".reveal").forEach((section) => {
    AUTO_CHILD_SELECTOR.split(",").forEach((sel) => {
      section.querySelectorAll(sel).forEach((el) => {
        if (!el.classList.contains("reveal-child"))
          el.classList.add("reveal-child");
      });
    });
  });
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const children = Array.from(el.querySelectorAll(".reveal-child"));
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          if (children.length) {
            children.forEach((child, i) => {
              child.style.transitionDelay = `${i * STAGGER_MS}ms`;
              // Force reflow to ensure transitionDelay is applied
              // eslint-disable-next-line no-unused-expressions
              child.offsetHeight;
              child.classList.add("is-visible");
            });
          }
        } else {
          // remove visibility so animation can replay
          el.classList.remove("is-visible");
          if (children.length) {
            children.forEach((child) => {
              child.classList.remove("is-visible");
              child.style.transitionDelay = "";
            });
          }
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();

// Intro / Outro overlay control
(function () {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const intro = document.getElementById("site-intro");
  const outro = document.getElementById("site-outro");
  const introSkip = document.getElementById("intro-skip");
  const outroClose = document.getElementById("outro-close");

  if (!intro || !outro) return;

  function showOverlay(el) {
    el.setAttribute("aria-hidden", "false");
    // trap focus minimally
    const focusable = el.querySelector("button, a, [tabindex]");
    if (focusable) focusable.focus();
  }
  function hideOverlay(el) {
    el.setAttribute("aria-hidden", "true");
  }

  // Show intro on first load (unless reduced motion)
  if (!prefersReduced) {
    // small delay so page paints first
    setTimeout(() => showOverlay(intro), 350);
  }

  // Intro skip button
  if (introSkip) introSkip.addEventListener("click", () => hideOverlay(intro));

  // Outro close
  if (outroClose)
    outroClose.addEventListener("click", () => hideOverlay(outro));

  // When footer comes into view, show outro once
  const footer = document.querySelector("footer");
  if (footer) {
    const obs = new IntersectionObserver(
      (entries, o) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            showOverlay(outro);
            o.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    obs.observe(footer);
  }

  // Intercept external watch links to show outro before opening in new tab
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      // target external youtube channel / watch links
      if (href.includes("youtube.com") || href.includes("youtu.be")) {
        // if link opens in new tab already, show outro briefly then allow
        if (a.target === "_blank") {
          e.preventDefault();
          // show outro, then open
          showOverlay(outro);
          setTimeout(
            () => {
              window.open(href, "_blank", "noopener");
            },
            prefersReduced ? 0 : 700
          );
        } else {
          // same-tab navigation: show outro then navigate
          e.preventDefault();
          showOverlay(outro);
          setTimeout(
            () => {
              window.location.href = href;
            },
            prefersReduced ? 0 : 700
          );
        }
      }
    },
    { capture: true }
  );
})();
