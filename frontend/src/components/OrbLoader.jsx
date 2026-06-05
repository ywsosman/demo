import { useEffect, useRef } from 'react';
import { useLoadingOverlay } from '../contexts/LoadingOverlayContext';

const OrbLoader = () => {
  const { show, hide } = useLoadingOverlay();
  const sourceId = useRef(`orb-loader-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const id = sourceId.current;
    show(id);
    return () => hide(id);
  }, [show, hide]);

  return null;
};

export default OrbLoader;
