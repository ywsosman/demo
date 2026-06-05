import { useEffect, useRef, Children } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollStack.css';

gsap.registerPlugin(ScrollTrigger);

/** Passthrough wrapper — ScrollStack maps children into pinned cards */
export const ScrollStackItem = ({ children }) => children;

const ScrollStack = ({ children, className = '' }) => {
  const scrollStackRef = useRef(null);

  useEffect(() => {
    const el = scrollStackRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 1000px)', () => {
        const stackCards = el.querySelectorAll('.scroll-stack-card');
        const cardContainers = el.querySelectorAll('.scroll-stack-card-container');

        stackCards.forEach((card, index) => {
          card.style.zIndex = String(index + 1);
        });

        cardContainers.forEach((cardContainer, index) => {
          const rotation = index % 2 === 0 ? 3 : -3;
          gsap.set(cardContainer, { rotation, opacity: 1 });
        });

        const scrollTriggerInstances = [];

        gsap.delayedCall(0.1, () => {
          stackCards.forEach((card, index) => {
            if (index < stackCards.length - 1) {
              const pinTrigger = ScrollTrigger.create({
                trigger: card,
                start: 'top top',
                endTrigger: stackCards[stackCards.length - 1],
                end: 'top top',
                pin: true,
                pinSpacing: false,
                scrub: 1,
                anticipatePin: 1,
              });
              scrollTriggerInstances.push(pinTrigger);
            }

            if (index < stackCards.length - 1) {
              const fadeTrigger = ScrollTrigger.create({
                trigger: stackCards[index + 1],
                start: 'top bottom',
                end: 'top top',
              });
              scrollTriggerInstances.push(fadeTrigger);
            }
          });

          ScrollTrigger.refresh();
        });

        const refreshHandler = () => ScrollTrigger.refresh();
        window.addEventListener('orientationchange', refreshHandler);
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener('load', onLoad, { passive: true });

        return () => {
          scrollTriggerInstances.forEach((trigger) => trigger.kill());
          window.removeEventListener('orientationchange', refreshHandler);
          window.removeEventListener('load', onLoad);
        };
      });

      mm.add('(max-width: 999px)', () => {
        const stackCards = el.querySelectorAll('.scroll-stack-card');
        const cardContainers = el.querySelectorAll('.scroll-stack-card-container');

        stackCards.forEach((card, index) => {
          card.style.zIndex = '';
          if (card) gsap.set(card, { clearProps: 'all' });
        });
        cardContainers.forEach((cardContainer) => {
          if (cardContainer) gsap.set(cardContainer, { clearProps: 'all' });
        });

        ScrollTrigger.refresh();

        const refreshHandler = () => ScrollTrigger.refresh();
        window.addEventListener('orientationchange', refreshHandler);
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener('load', onLoad, { passive: true });

        return () => {
          window.removeEventListener('orientationchange', refreshHandler);
          window.removeEventListener('load', onLoad);
        };
      });

      return () => mm.revert();
    }, el);

    return () => ctx.revert();
  }, []);

  const items = Children.toArray(children);

  return (
    <div className={`scroll-stack ${className}`.trim()} ref={scrollStackRef}>
      {items.map((child, index) => (
        <div className="scroll-stack-card" key={index}>
          <div
            className="scroll-stack-card-container"
            id={`scroll-stack-card-${index + 1}`}
          >
            <div className="scroll-stack-card-content">
              <div className="scroll-stack-card-content-wrapper">{child}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScrollStack;
