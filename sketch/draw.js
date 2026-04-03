import { LERP_SPEED, TARGET_FPS, PAD_X, PAD_Y, SIDE_LEFT, SIDE_RIGHT, getBrandX, getOppositeSide } from "./constants.js";
import { drawBrand } from "./brand.js";
import { drawOutgoing, drawIncoming } from "./headline.js";
import { clearTimers, startLogoHide } from "./timers.js";

function dtLerp(current, target, speed, dt) {
  const factor = 1 - Math.pow(1 - speed, dt * TARGET_FPS);
  return current + (target - current) * factor;
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

  s.logoReveal = dtLerp(s.logoReveal, s.logoRevealTarget, LERP_SPEED, dt);
  s.headlineExpand = dtLerp(s.headlineExpand, s.headlineTarget, LERP_SPEED, dt);

  if (Math.abs(s.logoReveal - s.logoRevealTarget) < 0.005) s.logoReveal = s.logoRevealTarget;
  if (Math.abs(s.headlineExpand - s.headlineTarget) < 0.005) s.headlineExpand = s.headlineTarget;

  if (s.isExpanding && s.headlineExpand >= 0.995) {
    s.isExpanding = false;
    s.hasOutgoing = false;

    if (typeof p.messageDisplayed === "function") p.messageDisplayed(s.duration);

    clearTimers(s);
    s.displayTimer = setTimeout(() => {
      s.hasMessage = false;
      s.headlineTarget = 0;
      s.currentTitle = "";
      s.currentSubtitle = "";
      clearTimers(s);
      startLogoHide(s);
    }, s.duration * 1000);
  }

  if (!s.hasMessage && s.headlineExpand < 0.005) {
    s.hasOutgoing = false;
    if (s.logoReveal < 0.005) {
      s.brandSide = SIDE_RIGHT;
    }
  }

  if (s.logoReveal < 0.005 && s.headlineExpand < 0.005) return;

  const brandY = bannerBottom - brandH;
  s.brandY = brandY;

  if (s.isExpanding) {
    const fromSide = getOppositeSide(s.brandSide);
    s.brandX = fromSide === SIDE_LEFT
      ? s.bannerLeft + s.headlineFullW * s.headlineExpand
      : s.bannerRight - s.brandW - s.headlineFullW * s.headlineExpand;
  } else {
    s.brandX = getBrandX(s);
  }

  const ctx = p.drawingContext;
  p.push();
  p.noStroke();

  drawOutgoing(p, s, ctx);
  drawIncoming(p, s, ctx);
  drawBrand(p, s, ctx, brandName);

  p.pop();
}
