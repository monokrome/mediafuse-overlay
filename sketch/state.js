/**
 * Shared animation state.
 *
 * Single mutable object so every module reads/writes the same values.
 */

export function createState() {
  return {
    // Animation values (lerped each frame)
    logoReveal: 0,
    logoRevealTarget: 0,
    headlineExpand: 0,
    headlineTarget: 0,

    // Brand side: "right" or "left" — where the brand currently IS
    brandSide: "right",
    isExpanding: false,

    // Incoming content
    currentTitle: "",
    currentSubtitle: "",
    currentType: null,
    hasMessage: false,

    // Outgoing content (during simultaneous swap)
    outTitle: "",
    outSubtitle: "",
    outType: null,
    hasOutgoing: false,

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
  };
}
