import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollBehaviour() {
  const { pathname } = useLocation();

  useEffect(() => {
    const startY = window.scrollY;
    const duration = 3000; // ms
    let startTime = null;

  
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);       
      const eased = ease(progress);

      window.scrollTo(0, startY * (1 - eased));               

      if (progress < 1) requestAnimationFrame(step);          
    };

    requestAnimationFrame(step);
  }, [pathname]);

  return null;
}