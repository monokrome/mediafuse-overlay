import { LERP_SPEED, PAD_X, PAD_Y } from "./constants.js";
import { drawBrand } from "./brand.js";
import { drawOutgoing, drawIncoming } from "./headline.js";

/**
 * Main draw loop. Updates animation state and renders all elements.
 */
export function draw(p, s, brandName) {
  p.clear();

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

  // Lerp
  s.logoReveal = p.lerp(s.logoReveal, s.logoRevealTarget, LERP_SPEED);
  s.headlineExpand = p.lerp(s.headlineExpand, s.headlineTarget, LERP_SPEED);

  // Snap
  if (Math.abs(s.logoReveal - s.logoRevealTarget) < 0.005) s.logoReveal = s.logoRevealTarget;
  if (Math.abs(s.headlineExpand - s.headlineTarget) < 0.005) s.headlineExpand = s.headlineTarget;

  // Expansion complete — flip brandSide, clear outgoing
  if (s.isExpanding && s.headlineExpand >= 0.995) {
    s.isExpanding = false;
    s.brandSide = s.brandSide === "right" ? "left" : "right";
    s.hasOutgoing = false;
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
