import { LERP_SPEED, TARGET_FPS, PAD_X, PAD_Y } from "./constants.js";
import { drawBrand } from "./brand.js";
import { drawOutgoing, drawIncoming } from "./headline.js";

function dtLerp(current, target, speed, dt) {
  const factor = 1 - Math.pow(1 - speed, dt * TARGET_FPS);
  return current + (target - current) * factor;
}

/**
 * Main draw loop. Updates animation state and renders all elements.
 */
export function draw(p, s, brandName) {
  p.clear();

  const dt = Math.min(p.deltaTime / 1000, 0.1);

  const fontSize = Math.max(16, Math.min(p.width * 0.022, 32));
  const subtitleSize = fontSize * 0.55;
  const bannerBottom = p.height - 15;
  const bannerLeft = p.width * 0.27;
  const bannerRight = p.width * 0.73;
  const bannerW = bannerRight - bannerLeft;

  // Measure brand
  p.textSize(fontSize);
  const brandW = p.textWidth(brandName) + PAD_X * 2;
  const brandH = fontSize + PAD_Y * 2;

  // Store layout in state for external use
  s.fontSize = fontSize;
  s.subtitleSize = subtitleSize;
  s.bannerLeft = bannerLeft;
  s.bannerRight = bannerRight;
  s.bannerBottom = bannerBottom;
  s.brandW = brandW;
  s.brandH = brandH;
  s.headlineFullW = bannerW - brandW;

  // Lerp (frame-rate independent)
  s.logoReveal = dtLerp(s.logoReveal, s.logoRevealTarget, LERP_SPEED, dt);
  s.headlineExpand = dtLerp(s.headlineExpand, s.headlineTarget, LERP_SPEED, dt);

  // Snap
  if (Math.abs(s.logoReveal - s.logoRevealTarget) < 0.005) s.logoReveal = s.logoRevealTarget;
  if (Math.abs(s.headlineExpand - s.headlineTarget) < 0.005) s.headlineExpand = s.headlineTarget;

  // Expansion complete — flip brandSide, clear outgoing, start display timer
  if (s.isExpanding && s.headlineExpand >= 0.995) {
    s.isExpanding = false;
    s.brandSide = s.brandSide === "right" ? "left" : "right";
    s.hasOutgoing = false;
    if (typeof p.messageDisplayed === "function") p.messageDisplayed(s.durationMs);
  }

  // Collapse complete — reset to default side once logo has also exited
  if (!s.hasMessage && s.headlineExpand < 0.005) {
    s.hasOutgoing = false;
    if (s.logoReveal < 0.005) {
      s.brandSide = "right";
    }
  }

  if (s.logoReveal < 0.005 && s.headlineExpand < 0.005) return;

  // Compute brand position
  const brandY = bannerBottom - brandH;
  s.brandY = brandY;

  if (s.isExpanding) {
    s.brandX = s.brandSide === "right"
      ? bannerRight - brandW - s.headlineFullW * s.headlineExpand
      : bannerLeft + s.headlineFullW * s.headlineExpand;
  } else {
    s.brandX = s.brandSide === "left" ? bannerLeft : bannerRight - brandW;
  }

  const ctx = p.drawingContext;
  p.push();
  p.noStroke();

  drawOutgoing(p, s, ctx);
  drawIncoming(p, s, ctx);
  drawBrand(p, s, ctx, brandName);

  p.pop();
}
