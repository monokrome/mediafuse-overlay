import { LOGO_HIDE_DELAY_MS, LOGO_IDLE_SHOW, LOGO_IDLE_INTERVAL } from "./constants.js";

export function clearTimers(s) {
  if (s.logoIdleTimer) clearInterval(s.logoIdleTimer);
  if (s.logoHideTimer) clearTimeout(s.logoHideTimer);
  if (s.expandTimer) clearTimeout(s.expandTimer);
  s.logoIdleTimer = null;
  s.logoHideTimer = null;
  s.expandTimer = null;
}

export function startLogoHide(s) {
  s.logoHideTimer = setTimeout(() => {
    s.logoRevealTarget = 0;
    startIdleCycle(s);
  }, LOGO_HIDE_DELAY_MS);
}

export function startIdleCycle(s) {
  s.logoIdleTimer = setInterval(() => {
    s.logoRevealTarget = 1;
    s.logoHideTimer = setTimeout(() => {
      s.logoRevealTarget = 0;
    }, LOGO_IDLE_SHOW);
  }, LOGO_IDLE_INTERVAL);
}
