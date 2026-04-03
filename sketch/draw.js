import { LERP_SPEED, TARGET_FPS, PAD_X, PAD_Y, SIDE_LEFT, SIDE_RIGHT } from "./constants.js";
import { drawBrand } from "./brand.js";
import { drawLeftPanel, drawRightPanel } from "./headline.js";
import { clearTimers, startLogoHide } from "./timers.js";

function dtLerp(current, target, speed, dt) {
  const factor = 1 - Math.pow(1 - speed, dt * TARGET_FPS);
  return current + (target - current) * factor;
}

function snap(value, target) {
  return Math.abs(value - target) < 0.005 ? target : value;
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
  s.headlineFullW = (bannerW - brandW) / 2;

  // Lerp panels and logo
  s.logoReveal = snap(dtLerp(s.logoReveal, s.logoRevealTarget, LERP_SPEED, dt), s.logoRevealTarget);
  s.leftExpand = snap(dtLerp(s.leftExpand, s.leftTarget, LERP_SPEED, dt), s.leftTarget);
  s.rightExpand = snap(dtLerp(s.rightExpand, s.rightTarget, LERP_SPEED, dt), s.rightTarget);

  // Detect expansion complete — either panel just finished expanding
  const leftDone = s.leftTarget === 1 && s.leftExpand >= 0.995;
  const rightDone = s.rightTarget === 1 && s.rightExpand >= 0.995;

  if (leftDone && s._leftWasExpanding) {
    s._leftWasExpanding = false;
    onExpansionComplete(p, s);
  }
  if (rightDone && s._rightWasExpanding) {
    s._rightWasExpanding = false;
    onExpansionComplete(p, s);
  }

  // Track whether panels are actively expanding
  if (s.leftTarget === 1 && s.leftExpand < 0.995) s._leftWasExpanding = true;
  if (s.rightTarget === 1 && s.rightExpand < 0.995) s._rightWasExpanding = true;

  // Reset when both panels are closed
  if (!s.hasMessage && s.leftExpand < 0.005 && s.rightExpand < 0.005) {
    if (s.logoReveal < 0.005) {
      s.brandSide = SIDE_RIGHT;
    }
  }

  if (s.logoReveal < 0.005 && s.leftExpand < 0.005 && s.rightExpand < 0.005) return;

  const brandY = bannerBottom - brandH;
  s.brandY = brandY;

  // Brand sits between the two panels
  s.brandX = bannerLeft + s.headlineFullW * (1 + s.leftExpand - s.rightExpand);

  const ctx = p.drawingContext;
  p.push();
  p.noStroke();

  drawLeftPanel(p, s, ctx);
  drawRightPanel(p, s, ctx);
  drawBrand(p, s, ctx, brandName);

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
