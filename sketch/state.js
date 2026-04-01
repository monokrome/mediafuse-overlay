import { SIDE_RIGHT } from "./constants.js";
import { signal } from "./signal.js";

export function createState() {
  return {
    // Reactive — drives behavior changes
    brandSide: signal(SIDE_RIGHT),
    hasMessage: signal(false),
    headlineTarget: signal(0),
    logoRevealTarget: signal(0),
    isExpanding: signal(false),
    currentTitle: signal(""),
    currentSubtitle: signal(""),
    currentType: signal(null),
    durationMs: signal(null),
    hasOutgoing: signal(false),
    outTitle: signal(""),
    outSubtitle: signal(""),
    outType: signal(null),

    // Non-reactive (set per message, read in timers)
    messageTimestamp: 0,

    // Lerped each frame
    logoReveal: 0,
    headlineExpand: 0,

    // Layout (recomputed each frame)
    brandW: 0,
    brandH: 0,
    brandX: 0,
    brandY: 0,
    bannerLeft: 0,
    bannerRight: 0,
    bannerBottom: 0,
    headlineFullW: 0,
    fontSize: 0,
    subtitleSize: 0,

    // Timers
    logoIdleTimer: null,
    logoHideTimer: null,
    expandTimer: null,
    displayTimer: null,
  };
}
