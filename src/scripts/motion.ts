/**
 * Global motion engine — Lenis smooth scrolling + GSAP scroll choreography.
 * Declarative via data attributes:
 *   data-reveal            fade + rise on enter (data-reveal-delay="0.15")
 *   data-reveal-line       staggered line mask reveal (.line-mask > .line-inner)
 *   data-counter           animated number (data-counter="12000" data-decimals="1")
 *   data-parallax          vertical drift (data-parallax="-80" px over scroll)
 *   data-magnetic          cursor-magnetic hover
 *   data-progress-line     scaleX 0→1 while its section scrolls
 */
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reducedMotion) {
  document.documentElement.classList.add("no-motion");
} else {
  init();
}

function init() {
  // -- Lenis ----------------------------------------------------------------
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor links scroll through Lenis
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.hash);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -90 });
      }
    });
  });

  // -- Reveals ----------------------------------------------------------------
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      delay: parseFloat(el.dataset.revealDelay ?? "0"),
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  document.querySelectorAll<HTMLElement>("[data-reveal-line]").forEach((el) => {
    const lines = el.querySelectorAll(".line-inner");
    gsap.to(lines, {
      y: 0,
      duration: 1.2,
      stagger: 0.09,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });

  // -- Counters ---------------------------------------------------------------
  document.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => {
    const target = parseFloat(el.dataset.counter ?? "0");
    const decimals = parseInt(el.dataset.decimals ?? "0", 10);
    const state = { v: 0 };
    gsap.to(state, {
      v: target,
      duration: 2,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
      onUpdate: () => {
        el.textContent = state.v.toLocaleString("es-MX", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      },
    });
  });

  // -- Parallax ---------------------------------------------------------------
  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
    gsap.fromTo(
      el,
      { y: 0 },
      {
        y: parseFloat(el.dataset.parallax ?? "-60"),
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("[data-parallax-root]") ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      }
    );
  });

  // -- Progress lines -----------------------------------------------------------
  document.querySelectorAll<HTMLElement>("[data-progress-line]").forEach((el) => {
    gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        transformOrigin: "left center",
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") ?? el,
          start: "top 70%",
          end: "bottom 60%",
          scrub: 0.8,
        },
      }
    );
  });

  // -- Magnetic buttons (pointer devices only) ----------------------------------
  if (window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
      const strength = 22;
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - 0.5) * strength);
        yTo(((e.clientY - r.top) / r.height - 0.5) * strength);
      });
      el.addEventListener("mouseleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  // -- Header shrink on scroll ----------------------------------------------------
  const header = document.getElementById("site-header");
  if (header) {
    ScrollTrigger.create({
      start: "top -64",
      onUpdate: (self) => header.classList.toggle("is-scrolled", self.progress > 0),
      onToggle: (self) => header.classList.toggle("is-scrolled", self.isActive),
    });
  }

  // -- Sticky CTA appears after first viewport ------------------------------------
  const sticky = document.getElementById("sticky-cta");
  if (sticky) {
    ScrollTrigger.create({
      start: () => window.innerHeight * 1.2,
      onToggle: (self) => sticky.classList.toggle("is-visible", self.isActive),
    });
  }
}
