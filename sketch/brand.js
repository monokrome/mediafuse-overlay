import { PANEL_COLOR } from "./constants.js";

/**
 * Brand logo — clip wipe from nearest edge.
 */
export function drawBrand(p, s, ctx, brandName) {
  if (s.logoReveal <= 0.005) return;

  const revealW = s.brandW * s.logoReveal;
  const clipX = s.brandSide === "right"
    ? s.brandX
    : s.brandX + s.brandW - revealW;

  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX, s.brandY, revealW, s.brandH);
  ctx.clip();

  p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
  p.rect(s.brandX, s.brandY, s.brandW, s.brandH);

  p.fill(255);
  p.textSize(s.fontSize);
  p.textAlign(p.CENTER, p.CENTER);
  const textY = s.bannerBottom - s.brandH / 2 + s.fontSize * 0.08;
  p.text(brandName, s.brandX + s.brandW / 2, textY);

  ctx.restore();
}
