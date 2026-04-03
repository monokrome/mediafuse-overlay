import { LOGO_PAUSE_MS, getOppositeSide } from "./constants.js";
import { clearTimers, startLogoHide } from "./timers.js";

export function messageReceived(s, msg) {
  if (!msg) {
    s.hasMessage = false;
    s.headlineTarget = 0;
    s.currentTitle = "";
    s.currentSubtitle = "";

    clearTimers(s);
    startLogoHide(s);
    return;
  }

  const title = msg.data?.title || "";
  const subtitle = msg.data?.subtitle || "";

  if (msg.timestamp === s.messageTimestamp) return;

  clearTimers(s);

  if (s.hasMessage && s.headlineExpand > 0.1) {
    s.outTitle = s.currentTitle;
    s.outSubtitle = s.currentSubtitle;
    s.outType = s.currentType;
    s.hasOutgoing = true;

    s.currentTitle = title;
    s.currentSubtitle = subtitle;
    s.currentType = msg.type;
    s.duration = msg.duration ?? msg.durationMs ?? 15;
    s.messageTimestamp = msg.timestamp;

    s.brandSide = getOppositeSide(s.brandSide);
    s.headlineExpand = 0;
    s.headlineTarget = 1;
    s.isExpanding = true;
    return;
  }

  if (s.hasMessage && s.expandTimer) {
    s.currentTitle = title;
    s.currentSubtitle = subtitle;
    s.currentType = msg.type;
    s.duration = msg.duration ?? msg.durationMs ?? 15;
    s.messageTimestamp = msg.timestamp;
    return;
  }

  applyMessage(s, msg);
}

function applyMessage(s, msg) {
  s.currentTitle = msg.data?.title || "";
  s.currentSubtitle = msg.data?.subtitle || "";
  s.currentType = msg.type;
  s.duration = msg.duration ?? msg.durationMs ?? 15;
  s.messageTimestamp = msg.timestamp;
  s.hasMessage = true;
  s.hasOutgoing = false;

  s.brandSide = getOppositeSide(s.brandSide);
  s.isExpanding = true;
  s.logoRevealTarget = 1;

  const delay = s.logoReveal < 0.5 ? LOGO_PAUSE_MS + 600 : 0;
  s.expandTimer = setTimeout(() => {
    s.expandTimer = null;
    s.headlineTarget = 1;
  }, delay);
}
