import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

const INACTIVITY_TIMEOUT = 14 * 60 * 1000; // 14 mins (JWT expires in 15)
const WARNING_AT = 13 * 60 * 1000; // Warn after 13 mins

export function useSessionManager() {
  const { isAuthenticated, logout } = useAuthStore();

  const handleLogout = useCallback(() => {
    toast.error('Session expired due to inactivity');
    logout();
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let warningTimer: ReturnType<typeof setTimeout>;
    let logoutTimer: ReturnType<typeof setTimeout>;

    const resetTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      warningTimer = setTimeout(() => {
        toast('Your session will expire in 1 minute due to inactivity.', { icon: '⚠️' });
      }, WARNING_AT);

      logoutTimer = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimers));

    resetTimers();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimers));
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
    };
  }, [isAuthenticated, handleLogout]);
}
