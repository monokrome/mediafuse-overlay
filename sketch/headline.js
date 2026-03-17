import {
  PANEL_COLOR, TEXT_COLOR, SUBTITLE_COLOR, PAD_X,
} from "./constants.js";

/**
 * Outgoing headline — shrinks on the opposite side during swap.
 */
export function drawOutgoing(p, s, ctx) {
  const outW = s.hasOutgoing ? s.headlineFullW * (1 - s.headlineExpand) : 0;
  if (!s.hasOutgoing || outW <= 1) return;

  let outHlX, outCenterX;

  if (s.brandSide === "right") {
    // Brand on right — outgoing headline was on the left, shrinks from left edge
    outHlX = s.bannerLeft;
    outCenterX = s.bannerLeft + s.headlineFullW / 2;
  } else {
    // Brand on left — outgoing headline was on the right, shrinks from right edge
    outHlX = s.bannerRight - outW;
    outCenterX = s.bannerRight - s.headlineFullW / 2;
  }

  p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
  p.rect(outHlX, s.brandY, outW, s.brandH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(outHlX, s.brandY, outW, s.brandH);
  ctx.clip();

  const centerY = s.bannerBottom - s.brandH / 2 + 3;
  drawTextContent(p, s, s.outTitle, s.outSubtitle, s.outType, outCenterX, centerY, outHlX, outW, s.brandSide === "left");

  ctx.restore();
}

/**
 * Incoming headline — grows from the brand's side.
 */
export function drawIncoming(p, s, ctx) {
  const inW = s.headlineFullW * s.headlineExpand;
  if (s.headlineExpand <= 0.005 || inW <= 1) return;

  let hlX, hlCenterX;

  if (s.isExpanding) {
    // Brand is moving away from brandSide — headline grows on the side the brand is leaving
    if (s.brandSide === "right") {
      // Brand moving left, headline grows from the right edge
      hlX = s.bannerRight - inW;
      hlCenterX = s.bannerRight - s.headlineFullW / 2;
    } else {
      // Brand moving right, headline grows from the left edge
      hlX = s.bannerLeft;
      hlCenterX = s.bannerLeft + s.headlineFullW / 2;
    }
  } else {
    if (s.brandSide === "left") {
      hlX = s.bannerLeft + s.brandW;
      hlCenterX = s.bannerLeft + s.brandW + s.headlineFullW / 2;
    } else {
      hlX = s.brandX - inW;
      hlCenterX = s.bannerRight - s.brandW - s.headlineFullW / 2;
    }
  }

  p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
  p.rect(hlX, s.brandY, inW, s.brandH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(hlX, s.brandY, inW, s.brandH);
  ctx.clip();

  const centerY = s.bannerBottom - s.brandH / 2 + 3;
  const brandOnLeft = s.brandSide === "left";
  drawTextContent(p, s, s.currentTitle, s.currentSubtitle, s.currentType, hlCenterX, centerY, hlX, inW, brandOnLeft);

  ctx.restore();
}

/**
 * Shared text + music icon rendering.
 */
function drawTextContent(p, s, title, subtitle, type, centerX, centerY, hlX, hlW, brandOnLeft) {
  if (subtitle) {
    p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    p.textSize(s.fontSize);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(title, centerX, centerY + 1);

    p.fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2], SUBTITLE_COLOR[3]);
    p.textSize(s.subtitleSize);
    p.textAlign(p.CENTER, p.TOP);
    p.text(subtitle, centerX, centerY + 3);
  } else {
    p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    p.textSize(s.fontSize);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(title, centerX, centerY);
  }

  if (type === "music") {
    const iconSize = s.fontSize * 0.8;
    const iconX = brandOnLeft
      ? hlX + hlW - PAD_X - iconSize
      : hlX + PAD_X;
    const iconY = centerY - iconSize / 2;
    p.fill(255);
    p.rect(iconX, iconY, iconSize, iconSize, 2);
    p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2]);
    p.textSize(iconSize * 0.7);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("\u266a", iconX + iconSize / 2, iconY + iconSize / 2);
  }
}
