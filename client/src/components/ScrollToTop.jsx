import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function scrollToTop(smooth = false) {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

/** Scrolls to top whenever the route pathname changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
}
