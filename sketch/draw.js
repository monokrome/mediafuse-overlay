import { LERP_SPEED, TARGET_FPS, PAD_X, PAD_Y, SIDE_LEFT, SIDE_RIGHT, PANEL_ANIM_DURATION } from "./constants.js";
import { drawBrand } from "./brand.js";
import { drawLeftPanel, drawRightPanel } from "./headline.js";
import { drawActivity, drawSecondary } from "./activity.js";
import { clearTimers, startLogoHide } from "./timers.js";

function dtLerp(current, target, speed, dt) {
  const factor = 1 - Math.pow(1 - speed, dt * TARGET_FPS);
  return current + (target - current) * factor;
}

function snap(value, target) {
  return Math.abs(value - target) < 0.005 ? target : value;
}

function easeIn(t) {
  return t * t;
}

function easeOut(t) {
  return 1 - (1 - t) * (1 - t);
}

function advancePanel(s, key, dt) {
  const progressKey = "_" + key + "Progress";
  const target = s[key + "Target"];
  const expanding = target === 1;

  if (s[progressKey] === undefined) s[progressKey] = s[key + "Expand"] > 0.5 ? 1 : 0;

  if (expanding && s[progressKey] < 1) {
    s[progressKey] = Math.min(1, s[progressKey] + dt / PANEL_ANIM_DURATION);
    s[key + "Expand"] = easeIn(s[progressKey]);
  } else if (!expanding && s[progressKey] > 0) {
    s[progressKey] = Math.max(0, s[progressKey] - dt / PANEL_ANIM_DURATION);
    s[key + "Expand"] = easeOut(s[progressKey]);
  }
}

export function draw(p, s, brandName) {
  p.clear();

  const dt = Math.min(p.deltaTime / 1000, 0.1);

  const fontSize = Math.max(16, Math.min(p.width * 0.022, 32));
  const subtitleSize = fontSize * 0.55;
  const bannerBottom = p.height - 15;
  const bannerLeft = p.width * 0.27;
  const bannerRight = p.width * 0.73;
  const bannerW = bannerRight - bannerLeft;

  p.textSize(fontSize);
  const brandW = p.textWidth(brandName) + PAD_X * 2;
  const brandH = fontSize + PAD_Y * 2;

  s.fontSize = fontSize;
  s.subtitleSize = subtitleSize;
  s.bannerLeft = bannerLeft;
  s.bannerRight = bannerRight;
  s.bannerBottom = bannerBottom;
  s.brandW = brandW;
  s.brandH = brandH;
  s.headlineFullW = bannerW - brandW;

  // Logo uses lerp, panels use time-based easing
  s.logoReveal = snap(dtLerp(s.logoReveal, s.logoRevealTarget, LERP_SPEED, dt), s.logoRevealTarget);
  advancePanel(s, "left", dt);
  advancePanel(s, "right", dt);

  // Detect expansion complete
  if (s.leftTarget === 1 && s._leftProgress >= 1 && s._leftWasExpanding) {
    s._leftWasExpanding = false;
    onExpansionComplete(p, s);
  }
  if (s.rightTarget === 1 && s._rightProgress >= 1 && s._rightWasExpanding) {
    s._rightWasExpanding = false;
    onExpansionComplete(p, s);
  }

  if (s.leftTarget === 1 && s._leftProgress < 1) s._leftWasExpanding = true;
  if (s.rightTarget === 1 && s._rightProgress < 1) s._rightWasExpanding = true;

  // Only reset brandSide when fully hidden (logo gone too)
  if (s.logoReveal < 0.005 && s.leftExpand < 0.005 && s.rightExpand < 0.005) {
    s.brandSide = SIDE_RIGHT;
    s.brandX = bannerRight - s.brandW;
  }

  // First-frame init: pin brandX to the right edge (idle position).
  // Without this, an applyMessage that arrives before the first draw frame
  // leaves brandX at its initial 0, rendering the brand at the bottom-left.
  if (!s._brandXInit) {
    s.brandX = bannerRight - s.brandW;
    s._brandXInit = true;
  }

  // brandY/brandX are needed by activity/secondary even when the banner is hidden,
  // since they anchor to where the banner WOULD be.
  const brandY = bannerBottom - brandH;
  s.brandY = brandY;

  // Brand only moves when a panel is expanding — contracting panels don't move it.
  // After expansion, brandX stays where it landed.
  if (s.rightTarget === 1 && s.rightExpand > 0.005) {
    s.brandX = bannerRight - s.brandW - s.headlineFullW * s.rightExpand;
  } else if (s.leftTarget === 1 && s.leftExpand > 0.005) {
    s.brandX = bannerLeft + s.headlineFullW * s.leftExpand;
  }

  const ctx = p.drawingContext;
  p.push();
  p.noStroke();

  // Banner (logo + message panels) only when something is visible
  if (s.logoReveal >= 0.005 || s.leftExpand >= 0.005 || s.rightExpand >= 0.005) {
    drawLeftPanel(p, s, ctx);
    drawRightPanel(p, s, ctx);
    drawBrand(p, s, ctx, brandName);
  }

  // Activity/secondary draw independently of banner visibility
  drawActivity(p, s);
  drawSecondary(p, s);

  p.pop();
}

function onExpansionComplete(p, s) {
  if (typeof p.messageDisplayed === "function") p.messageDisplayed(s.duration);

  clearTimers(s);
  s.displayTimer = setTimeout(() => {
    s.hasMessage = false;
    s.leftTarget = 0;
    s.rightTarget = 0;
    clearTimers(s);
    startLogoHide(s);
  }, s.duration * 1000);
}
