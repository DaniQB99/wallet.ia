import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ROUTES = ['/', '/transactions', '/goals', '/settings'];

export default function SwipeWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = ROUTES.indexOf(location.pathname);
      if (currentIndex !== -1) {
        if (isLeftSwipe && currentIndex < ROUTES.length - 1) {
          navigate(ROUTES[currentIndex + 1]);
        }
        if (isRightSwipe && currentIndex > 0) {
          navigate(ROUTES[currentIndex - 1]);
        }
      }
    }
  };

  return (
    <div 
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd} 
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
    >
      {children}
    </div>
  );
}
