import {
  PANEL_COLOR, TEXT_COLOR, SUBTITLE_COLOR, PAD_X,
  SIDE_LEFT, SIDE_RIGHT,
} from "./constants.js";

export function drawLeftPanel(p, s, ctx) {
  const w = s.headlineFullW * s.leftExpand;
  if (w <= 1) return;

  const hlX = s.brandX - w;
  const drawW = w + 1;

  p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
  p.rect(hlX, s.brandY, drawW, s.brandH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(hlX, s.brandY, w, s.brandH);
  ctx.clip();

  const centerX = s.brandX - s.headlineFullW / 2;
  const centerY = s.brandY + s.brandH / 2;
  drawTextContent(p, s, s.leftTitle, s.leftSubtitle, s.leftType, centerX, centerY, hlX, w, SIDE_LEFT);

  ctx.restore();
}

export function drawRightPanel(p, s, ctx) {
  const w = s.headlineFullW * s.rightExpand;
  if (w <= 1) return;

  const hlX = s.brandX + s.brandW - 1;
  const drawW = w + 1;

  p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
  p.rect(hlX, s.brandY, drawW, s.brandH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(hlX, s.brandY, w, s.brandH);
  ctx.clip();

  const centerX = s.brandX + s.brandW + s.headlineFullW / 2;
  const centerY = s.brandY + s.brandH / 2;
  drawTextContent(p, s, s.rightTitle, s.rightSubtitle, s.rightType, centerX, centerY, hlX, w, SIDE_RIGHT);

  ctx.restore();
}

function drawTextContent(p, s, title, subtitle, type, centerX, centerY, hlX, hlW, iconSide) {
  if (subtitle) {
    p.textSize(s.fontSize);
    const titleAsc = p.textAscent();
    const titleDesc = p.textDescent();
    p.textSize(s.subtitleSize);
    const subAsc = p.textAscent();
    const subDesc = p.textDescent();
    const totalH = titleAsc + subAsc + subDesc;
    const topY = centerY - totalH / 2;

    p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    p.textSize(s.fontSize);
    p.textAlign(p.CENTER, p.TOP);
    p.text(title, centerX, topY);

    p.fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2], SUBTITLE_COLOR[3]);
    p.textSize(s.subtitleSize);
    p.textAlign(p.CENTER, p.TOP);
    p.text(subtitle, centerX, topY + titleAsc + titleDesc * 0.2);
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
    p.textSize(iconSize);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("\u266a", iconX + iconSize / 2, iconY + iconSize / 2);
  }
}
