import { SIDE_RIGHT } from "./constants.js";
import { reactive } from "./signal.js";

export function createState() {
  return reactive({
    // Reactive — drives behavior changes
    brandSide: SIDE_RIGHT,
    hasMessage: false,
    headlineTarget: 0,
    logoRevealTarget: 0,
    isExpanding: false,
    currentTitle: "",
    currentSubtitle: "",
    currentType: null,
    durationMs: null,
    hasOutgoing: false,
    outTitle: "",
    outSubtitle: "",
    outType: null,

    // Non-reactive (plain values on the object)
    messageTimestamp: 0,
    logoReveal: 0,
    headlineExpand: 0,
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
    logoIdleTimer: null,
    logoHideTimer: null,
    expandTimer: null,
    displayTimer: null,
  });
}
