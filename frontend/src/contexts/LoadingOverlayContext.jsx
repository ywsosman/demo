import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import Orb from '../components/Orb';
import '../components/LoadingOverlay.css';

const LoadingOverlayContext = createContext(null);

const FADE_MS = 450;
const NAV_HOLD_MS = 520;

export const LoadingOverlayProvider = ({ children }) => {
  const [phase, setPhase] = useState('hidden');
  const activeSources = useRef(new Set());
  const fadeTimer = useRef(null);
  const navTimer = useRef(null);
  const location = useLocation();
  const isFirstNav = useRef(true);

  const syncPhase = useCallback(() => {
    clearTimeout(fadeTimer.current);

    if (activeSources.current.size > 0) {
      setPhase('visible');
      return;
    }

    fadeTimer.current = setTimeout(() => {
      if (activeSources.current.size > 0) return;

      setPhase('fading');
      fadeTimer.current = setTimeout(() => {
        if (activeSources.current.size === 0) {
          setPhase('hidden');
        }
      }, FADE_MS);
    }, 80);
  }, []);

  const show = useCallback(
    (sourceId) => {
      activeSources.current.add(sourceId);
      syncPhase();
    },
    [syncPhase]
  );

  const hide = useCallback(
    (sourceId) => {
      activeSources.current.delete(sourceId);
      syncPhase();
    },
    [syncPhase]
  );

  useEffect(() => {
    if (isFirstNav.current) {
      isFirstNav.current = false;
      return undefined;
    }

    const sourceId = `nav-${location.key}`;
    show(sourceId);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    clearTimeout(navTimer.current);
    navTimer.current = setTimeout(() => hide(sourceId), NAV_HOLD_MS);

    return () => {
      clearTimeout(navTimer.current);
      hide(sourceId);
    };
  }, [location.key, show, hide]);

  useEffect(
    () => () => {
      clearTimeout(fadeTimer.current);
      clearTimeout(navTimer.current);
    },
    []
  );

  return (
    <LoadingOverlayContext.Provider value={{ show, hide, phase }}>
      {children}
      <div
        className={`loading-overlay loading-overlay--${phase}`}
        aria-hidden={phase === 'hidden'}
        aria-live="polite"
        role="status"
      >
        <div className="loading-overlay__orb">
          <Orb hoverIntensity={0.6} rotateOnHover={false} forceHoverState />
        </div>
      </div>
    </LoadingOverlayContext.Provider>
  );
};

export const useLoadingOverlay = () => {
  const context = useContext(LoadingOverlayContext);
  if (!context) {
    throw new Error('useLoadingOverlay must be used within LoadingOverlayProvider');
  }
  return context;
};

export const usePageLoading = (loading) => {
  const { show, hide } = useLoadingOverlay();
  const sourceId = useRef(`page-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const id = sourceId.current;
    if (loading) {
      show(id);
    } else {
      hide(id);
    }
    return () => hide(id);
  }, [loading, show, hide]);
};
