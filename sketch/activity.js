import {
  TEXT_COLOR,
  SECONDARY_INTERVAL_MS,
  GLITCH_DURATION_MS,
  INFO_RESHOW_DELAY_MS,
} from "./constants.js";
import { drawGlitch } from "./glitch.js";

export function commandReceived(s, cmd) {
  if (!cmd) return;
  if (cmd.name === "activity") {
    s.activityText = cmd.data || "";
  } else if (cmd.name === "secondary_info") {
    const items = Array.isArray(cmd.data) ? cmd.data : [];
    s.secondaryItems = items;
    if (s.secondaryIndex >= items.length) s.secondaryIndex = 0;
  }
}

// Track secondary-info visibility around message events.
// State machine: visible → hiding → hidden → showing → visible
export function tickInfoState(s) {
  const now = Date.now();
  const hasMessage = s.hasMessage;

  if (hasMessage) {
    s.infoMessageEndedAt = 0;
    if (s.infoState === "visible" || s.infoState === "showing") {
      s.infoState = "hiding";
      s.infoStateStart = now;
    }
  }

  if (s.infoState === "hiding" && now - s.infoStateStart >= GLITCH_DURATION_MS) {
    s.infoState = "hidden";
  }

  if (s.infoState === "hidden" && !hasMessage) {
    if (!s.infoMessageEndedAt) s.infoMessageEndedAt = now;
    if (now - s.infoMessageEndedAt >= INFO_RESHOW_DELAY_MS) {
      s.infoState = "showing";
      s.infoStateStart = now;
    }
  }

  if (s.infoState === "showing" && now - s.infoStateStart >= GLITCH_DURATION_MS) {
    s.infoState = "visible";
  }
}

export function drawActivity(p, s) {
  if (!s.activityText) return;
  const fontSize = s.fontSize * 1.5;
  p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  p.textSize(fontSize);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text(s.activityText, p.width / 2, s.brandY - 6);
}

function drawPlainText(p, text, cx, cy, fontSize) {
  if (!text) return;
  p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  p.textSize(fontSize);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(text, cx, cy);
}

export function drawSecondary(p, s) {
  if (!s.secondaryItems || s.secondaryItems.length === 0) return;
  if (s.infoState === "hidden") return;

  const now = Date.now();
  if (!s.secondaryLastSwap) s.secondaryLastSwap = now;

  if (
    s.secondaryGlitchStart === 0 &&
    s.secondaryItems.length > 1 &&
    now - s.secondaryLastSwap >= SECONDARY_INTERVAL_MS &&
    s.infoState === "visible"
  ) {
    s.secondaryGlitchStart = now;
  }

  const current = s.secondaryItems[s.secondaryIndex];
  if (!current) return;
  const currentText = formatItem(current);

  const fontSize = s.fontSize;
  const cx = p.width / 2;
  const cy = (s.brandY + s.bannerBottom) / 2 + fontSize / 2;

  // Hide/show transitions take priority over rotation
  if (s.infoState === "hiding" || s.infoState === "showing") {
    const progress = Math.min(1, (now - s.infoStateStart) / GLITCH_DURATION_MS);
    const from = s.infoState === "hiding" ? currentText : "";
    const to = s.infoState === "hiding" ? "" : currentText;
    drawGlitch(p, from, to, progress, cx, cy, fontSize);
    return;
  }

  // Visible state — handle rotation if in progress
  if (s.secondaryGlitchStart > 0) {
    const elapsed = now - s.secondaryGlitchStart;
    if (elapsed >= GLITCH_DURATION_MS) {
      s.secondaryIndex = (s.secondaryIndex + 1) % s.secondaryItems.length;
      s.secondaryGlitchStart = 0;
      s.secondaryLastSwap = now;
      drawPlainText(p, formatItem(s.secondaryItems[s.secondaryIndex]), cx, cy, fontSize);
      return;
    }
    const nextIdx = (s.secondaryIndex + 1) % s.secondaryItems.length;
    const nextText = formatItem(s.secondaryItems[nextIdx]);
    drawGlitch(p, currentText, nextText, elapsed / GLITCH_DURATION_MS, cx, cy, fontSize);
    return;
  }

  drawPlainText(p, currentText, cx, cy, fontSize);
}

function formatItem(item) {
  return item.label ? `${item.label}: ${item.value}` : item.value;
}
