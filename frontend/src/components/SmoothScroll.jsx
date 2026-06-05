import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

/**
 * Lenis only on the landing page (scroll-stack section).
 * Other routes use native scroll for snappy forms and dashboards.
 */
const SmoothScroll = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (pathname !== '/' || prefersReducedMotion) {
      return undefined;
    }

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.14,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('resize', refresh);

    return () => {
      window.removeEventListener('resize', refresh);
      lenis.destroy();
      ScrollTrigger.refresh();
    };
  }, [pathname]);

  return children;
};

export default SmoothScroll;
