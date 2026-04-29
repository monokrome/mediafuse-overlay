import {
  TEXT_COLOR,
  SECONDARY_INTERVAL_MS,
  GLITCH_DURATION_MS,
  GLITCH_CHARS,
  INFO_RESHOW_DELAY_MS,
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
    return;
  }

  if (s.infoState === "hiding" && now - s.infoStateStart >= GLITCH_DURATION_MS) {
    s.infoState = "hidden";
    s.infoMessageEndedAt = now;
  }

  if (s.infoState === "hidden") {
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

function infoDisplayText(s, fullText) {
  if (s.infoState === "visible") return fullText;
  if (s.infoState === "hidden") return null;
  const now = Date.now();
  const progress = Math.min(1, (now - s.infoStateStart) / GLITCH_DURATION_MS);
  if (s.infoState === "hiding") return phaseText(fullText, "", progress);
  if (s.infoState === "showing") return phaseText("", fullText, progress);
  return fullText;
}

export function drawActivity(p, s) {
  if (!s.activityText) return;
  const fontSize = s.fontSize * 1.5;
  p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  p.textSize(fontSize);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text(s.activityText, p.width / 2, s.brandY - 6);
}

export function drawSecondary(p, s) {
  if (!s.secondaryItems || s.secondaryItems.length === 0) return;

  const now = Date.now();
  if (!s.secondaryLastSwap) s.secondaryLastSwap = now;

  // Don't run rotation timer while hidden — pause it
  if (s.infoState !== "hidden") {
    if (
      s.secondaryGlitchStart === 0 &&
      s.secondaryItems.length > 1 &&
      now - s.secondaryLastSwap >= SECONDARY_INTERVAL_MS &&
      s.infoState === "visible"
    ) {
      s.secondaryGlitchStart = now;
    }
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

  // Apply hide/show overlay (takes precedence over rotation)
  const finalText = infoDisplayText(s, displayText);
  if (finalText === null) return;

  const fontSize = s.fontSize;
  p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  p.textSize(fontSize);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(finalText, p.width / 2, (s.brandY + s.bannerBottom) / 2 + fontSize / 2);
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
