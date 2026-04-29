import { SIDE_RIGHT } from "./constants.js";
import { reactive } from "./signal.js";

export function createState() {
  return reactive({
    // Reactive
    brandSide: SIDE_RIGHT,
    logoRevealTarget: 0,

    // Left panel
    leftTitle: "",
    leftSubtitle: "",
    leftType: null,
    leftTarget: 0,

    // Right panel
    rightTitle: "",
    rightSubtitle: "",
    rightType: null,
    rightTarget: 0,

    // Message state
    hasMessage: false,
    duration: 15,
    currentType: null,
    messageTimestamp: 0,

    // Activity / secondary panels (driven by data plugins like d2)
    activityText: "",
    secondaryItems: [],
    secondaryIndex: 0,
    secondaryLastSwap: 0,
    secondaryGlitchStart: 0,
    infoState: "visible",
    infoStateStart: 0,
    infoLastMessageAt: 0,

    // Non-reactive layout values
    logoReveal: 0,
    leftExpand: 0,
    rightExpand: 0,
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
