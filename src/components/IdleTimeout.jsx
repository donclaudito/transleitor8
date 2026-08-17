import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Clock } from 'lucide-react';

const IDLE_MS = 14 * 60 * 1000;        // aviso aos 14 min
const WARNING_MS = 60 * 1000;          // 60s para decidir
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export default function IdleTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const idleTimer = useRef(null);
  const warningTimer = useRef(null);
  const lastReset = useRef(0);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_MS / 1000);

  const clearTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearInterval(warningTimer.current);
    idleTimer.current = null;
    warningTimer.current = null;
  };

  const startIdleWatch = useCallback(() => {
    setShowWarning(false);
    clearTimers();
    idleTimer.current = setTimeout(() => {
      // Inicia contagem regressiva de aviso
      setShowWarning(true);
      setCountdown(WARNING_MS / 1000);
      warningTimer.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            if (warningTimer.current) clearInterval(warningTimer.current);
            logout(true);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, IDLE_MS);
  }, [logout]);

  const stayLoggedIn = useCallback(() => {
    lastReset.current = Date.now();
    startIdleWatch();
  }, [startIdleWatch]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset.current < 10000) return;
      lastReset.current = now;
      startIdleWatch();
    };

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));
    lastReset.current = Date.now();
    startIdleWatch();

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, onActivity));
      clearTimers();
    };
  }, [isAuthenticated, startIdleWatch]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="text-lg font-bold">Sessão expirando</h3>
        <p className="text-sm text-muted-foreground">
          Por segurança, você será deslogado em <strong className="text-foreground">{countdown}s</strong> por inatividade.
        </p>
        <button
          onClick={stayLoggedIn}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
        >
          Continuar sessão
        </button>
      </div>
    </div>
  );
}