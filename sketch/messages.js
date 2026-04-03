import { LOGO_PAUSE_MS, SIDE_LEFT, SIDE_RIGHT, getOppositeSide } from "./constants.js";
import { clearTimers, startLogoHide } from "./timers.js";

export function messageReceived(s, msg) {
  if (!msg) {
    s.hasMessage = false;
    s.leftTarget = 0;
    s.rightTarget = 0;
    clearTimers(s);
    startLogoHide(s);
    return;
  }

  const title = msg.data?.title || "";
  const subtitle = msg.data?.subtitle || "";

  if (msg.timestamp === s.messageTimestamp) return;

  clearTimers(s);

  const duration = msg.duration ?? msg.durationMs ?? 15;

  if (s.hasMessage && (s.leftExpand > 0.1 || s.rightExpand > 0.1)) {
    swap(s, title, subtitle, msg.type, duration, msg.timestamp);
    return;
  }

  applyMessage(s, title, subtitle, msg.type, duration, msg.timestamp);
}

function swap(s, title, subtitle, type, duration, timestamp) {
  // The currently active side is opposite of brandSide
  // Flip brand to the other side, contract old panel, expand new one
  const newBrandSide = getOppositeSide(s.brandSide);
  const newMessageSide = getOppositeSide(newBrandSide);

  s.brandSide = newBrandSide;

  if (newMessageSide === SIDE_LEFT) {
    s.leftTitle = title;
    s.leftSubtitle = subtitle;
    s.leftType = type;
    s.leftTarget = 1;
    s.rightTarget = 0;
  } else {
    s.rightTitle = title;
    s.rightSubtitle = subtitle;
    s.rightType = type;
    s.rightTarget = 1;
    s.leftTarget = 0;
  }

  s.currentType = type;
  s.duration = duration;
  s.messageTimestamp = timestamp;
}

function applyMessage(s, title, subtitle, type, duration, timestamp) {
  // Message appears on the brand's current side, pushing it opposite
  const messageSide = s.brandSide;
  s.brandSide = getOppositeSide(s.brandSide);

  if (messageSide === SIDE_LEFT) {
    s.leftTitle = title;
    s.leftSubtitle = subtitle;
    s.leftType = type;
  } else {
    s.rightTitle = title;
    s.rightSubtitle = subtitle;
    s.rightType = type;
  }

  s.currentType = type;
  s.duration = duration;
  s.messageTimestamp = timestamp;
  s.hasMessage = true;

  s.logoRevealTarget = 1;

  const delay = s.logoReveal < 0.5 ? LOGO_PAUSE_MS + 600 : 0;
  s.expandTimer = setTimeout(() => {
    s.expandTimer = null;
    if (messageSide === SIDE_LEFT) {
      s.leftTarget = 1;
    } else {
      s.rightTarget = 1;
    }
  }, delay);
}
