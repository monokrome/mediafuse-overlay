import { LOGO_PAUSE_MS, getOppositeSide } from "./constants.js";
import { clearTimers, startLogoHide } from "./timers.js";

export function messageReceived(s, msg) {
  if (!msg) {
    s.hasMessage.set(false);
    s.headlineTarget.set(0);
    s.currentTitle.set("");
    s.currentSubtitle.set("");

    clearTimers(s);
    startLogoHide(s);
    return;
  }

  const title = msg.data?.title || "";
  const subtitle = msg.data?.subtitle || "";

  if (msg.timestamp === s.messageTimestamp) return;

  clearTimers(s);

  if (s.hasMessage.get() && s.headlineExpand > 0.1) {
    s.outTitle.set(s.currentTitle.get());
    s.outSubtitle.set(s.currentSubtitle.get());
    s.outType.set(s.currentType.get());
    s.hasOutgoing.set(true);

    s.currentTitle.set(title);
    s.currentSubtitle.set(subtitle);
    s.currentType.set(msg.type);
    s.durationMs.set(msg.durationMs ?? null);
    s.messageTimestamp = msg.timestamp;

    s.brandSide.set(getOppositeSide(s.brandSide.get()));
    s.headlineExpand = 0;
    s.headlineTarget.set(1);
    s.isExpanding.set(true);
    return;
  }

  if (s.hasMessage.get() && s.expandTimer) {
    s.currentTitle.set(title);
    s.currentSubtitle.set(subtitle);
    s.currentType.set(msg.type);
    s.durationMs.set(msg.durationMs ?? null);
    s.messageTimestamp = msg.timestamp;
    return;
  }

  applyMessage(s, msg);
}

function applyMessage(s, msg) {
  s.currentTitle.set(msg.data?.title || "");
  s.currentSubtitle.set(msg.data?.subtitle || "");
  s.currentType.set(msg.type);
  s.durationMs.set(msg.durationMs ?? null);
  s.messageTimestamp = msg.timestamp;
  s.hasMessage.set(true);
  s.hasOutgoing.set(false);

  s.brandSide.set(getOppositeSide(s.brandSide.get()));
  s.isExpanding.set(true);
  s.logoRevealTarget.set(1);

  const delay = s.logoReveal < 0.5 ? LOGO_PAUSE_MS + 600 : 0;
  s.expandTimer = setTimeout(() => {
    s.expandTimer = null;
    s.headlineTarget.set(1);
  }, delay);
}
