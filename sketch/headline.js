import {
  PANEL_COLOR, TEXT_COLOR, SUBTITLE_COLOR, PAD_X,
  SIDE_LEFT, getOppositeSide, getIconSide, getHeadlineCenter,
} from "./constants.js";

export function drawOutgoing(p, s, ctx) {
  const outW = s.hasOutgoing ? s.headlineFullW * (1 - s.headlineExpand) : 0;
  if (!s.hasOutgoing || outW <= 1) return;

  const outSide = s.brandSide;
  const outHlX = outSide === SIDE_LEFT ? s.bannerLeft : s.bannerRight - outW;
  const outCenterX = getHeadlineCenter(s, outSide);

  p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
  p.rect(outHlX, s.brandY, outW, s.brandH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(outHlX, s.brandY, outW, s.brandH);
  ctx.clip();

  const centerY = s.bannerBottom - s.brandH / 2 + 3;
  drawTextContent(p, s, s.outTitle, s.outSubtitle, s.outType, outCenterX, centerY, outHlX, outW, getIconSide(s));

  ctx.restore();
}

export function drawIncoming(p, s, ctx) {
  const inW = s.headlineFullW * s.headlineExpand;
  if (s.headlineExpand <= 0.005 || inW <= 1) return;

  let hlX, hlCenterX;

  if (s.isExpanding) {
    if (s.brandSide === SIDE_LEFT) {
      hlX = s.bannerLeft + s.brandW;
      hlCenterX = s.bannerLeft + s.brandW + s.headlineFullW / 2;
    } else {
      hlX = s.bannerRight - s.brandW - inW;
      hlCenterX = s.bannerRight - s.brandW - s.headlineFullW / 2;
    }
  } else {
    if (s.brandSide === SIDE_LEFT) {
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
  drawTextContent(p, s, s.currentTitle, s.currentSubtitle, s.currentType, hlCenterX, centerY, hlX, inW, getIconSide(s));

  ctx.restore();
}

function drawTextContent(p, s, title, subtitle, type, centerX, centerY, hlX, hlW, iconSide) {
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
    const iconX = iconSide === SIDE_LEFT
      ? hlX + PAD_X
      : hlX + hlW - PAD_X - iconSize;
    const iconY = s.brandY + (s.brandH - iconSize) / 2;
    p.fill(255);
    p.rect(iconX, iconY, iconSize, iconSize, 2);
    p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2]);
    p.textSize(iconSize * 0.7);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("\u266a", iconX + iconSize / 2, iconY + iconSize / 2);
  }
}
