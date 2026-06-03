/* ── motion.js ── optional GSAP-powered motion layer ──
   Fully progressive: if GSAP (CDN) is unavailable or the user prefers reduced
   motion, this no-ops and the existing CSS + IntersectionObserver reveals take
   over. It never touches the scoring pipeline. */

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {Object} opts
 * @param {boolean} [opts.revealScroll]  Let GSAP own the `.reveal` scroll
 *   animations. Only safe on pages with no display:none reveal targets
 *   (i.e. the Explore page, not the tool's result column).
 * @returns {{handledReveal:boolean}}  handledReveal=true means the caller
 *   should NOT also run its IntersectionObserver reveal fallback.
 */
export function initMotion({ revealScroll = false } = {}){
  const gsap = window.gsap;
  if(!gsap || reduce) return { handledReveal: false };

  const ST = window.ScrollTrigger;
  if(ST) gsap.registerPlugin(ST);

  // 1. Hero entrance (hero band only — the sticky top bar and its toggles are
  //    persistent chrome, so we deliberately leave them static to avoid the
  //    re-animate "flash" every time the user switches pages.)
  const heroBits = [
    ".hero-eyebrow",
    ".hero .hero-title",
    ".hero .context-desc"
  ].map(s => document.querySelector(s)).filter(Boolean);
  if(heroBits.length){
    gsap.from(heroBits, {
      y: 18, opacity: 0, duration: 0.7, ease: "power3.out",
      stagger: 0.08, delay: 0.05, clearProps: "all"
    });
  }

  // 3. Optional scroll-reveal takeover (staggered, smoother than the IO version)
  let handledReveal = false;
  if(revealScroll && ST){
    const reveals = gsap.utils.toArray(".reveal");
    if(reveals.length){
      reveals.forEach(el => { el.style.transition = "none"; });
      gsap.set(reveals, { opacity: 0, y: 26 });
      ST.batch(reveals, {
        start: "top 88%",
        onEnter: batch => gsap.to(batch, {
          opacity: 1, y: 0, duration: 0.6, ease: "power2.out",
          stagger: 0.09, overwrite: true
        })
      });
      handledReveal = true;
    }
  }

  return { handledReveal };
}
