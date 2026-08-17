import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';

const IDLE_MS = 15 * 60 * 1000; // 15 minutos
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export default function IdleTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout(true);
      }, IDLE_MS);
    };

    // Throttle para não recriar o timer a cada pixel de mousemove
    let lastReset = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset < 10000) return;
      lastReset = now;
      resetTimer();
    };

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, logout]);

  return null;
}