import {
  TEXT_COLOR,
  SECONDARY_INTERVAL_MS,
  GLITCH_DURATION_MS,
  GLITCH_CHARS,
} from "./constants.js";

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

export function drawActivity(p, s) {
  if (!s.activityText) return;
  const fontSize = s.fontSize * 0.5;
  p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  p.textSize(fontSize);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text(s.activityText, p.width / 2, s.brandY - 6);
}

export function drawSecondary(p, s) {
  if (!s.secondaryItems || s.secondaryItems.length === 0) return;

  const now = Date.now();
  if (!s.secondaryLastSwap) s.secondaryLastSwap = now;

  // Trigger a glitch when interval elapsed
  if (
    s.secondaryGlitchStart === 0 &&
    s.secondaryItems.length > 1 &&
    now - s.secondaryLastSwap >= SECONDARY_INTERVAL_MS
  ) {
    s.secondaryGlitchStart = now;
  }

  const current = s.secondaryItems[s.secondaryIndex];
  if (!current) return;
  const currentText = `${current.label}: ${current.value}`;

  let displayText = currentText;
  if (s.secondaryGlitchStart > 0) {
    const elapsed = now - s.secondaryGlitchStart;
    if (elapsed >= GLITCH_DURATION_MS) {
      s.secondaryIndex = (s.secondaryIndex + 1) % s.secondaryItems.length;
      s.secondaryGlitchStart = 0;
      s.secondaryLastSwap = now;
      const next = s.secondaryItems[s.secondaryIndex];
      displayText = `${next.label}: ${next.value}`;
    } else {
      const nextIdx = (s.secondaryIndex + 1) % s.secondaryItems.length;
      const nextItem = s.secondaryItems[nextIdx];
      const nextText = `${nextItem.label}: ${nextItem.value}`;
      displayText = phaseText(currentText, nextText, elapsed / GLITCH_DURATION_MS);
    }
  }

  const fontSize = s.fontSize * 0.5;
  p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  p.textSize(fontSize);
  p.textAlign(p.CENTER, p.TOP);
  p.text(displayText, p.width / 2, s.brandY + s.brandH + 6);
}

function phaseText(from, to, progress) {
  const len = Math.max(from.length, to.length);
  let result = "";
  for (let i = 0; i < len; i++) {
    const charProgress = Math.min(1, Math.max(0, (progress - i / len) * 2.2));
    if (charProgress < 0.3) {
      result += from.charAt(i) || " ";
    } else if (charProgress > 0.7) {
      result += to.charAt(i) || " ";
    } else {
      result += GLITCH_CHARS.charAt(Math.floor(Math.random() * GLITCH_CHARS.length));
    }
  }
  return result;
}
