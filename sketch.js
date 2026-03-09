/**
 * monokromatic banner sketch
 *
 * p5 instance-mode sketch that renders a branded lower-third banner
 * matching the original CSS plugin behavior:
 *   - brand reveals in-place via clip (right-to-left)
 *   - headline expands to the RIGHT of brand, pushing brand left
 *   - headline fills full remaining banner width
 *   - brand hides 3s after message clears
 *   - brand pauses 3s before headline expands
 */

const PANEL_COLOR = [75, 50, 110, 242];
const TEXT_COLOR = [255, 255, 255];
const SUBTITLE_COLOR = [200, 160, 255, 200];
const LERP_SPEED = 0.12;
const LOGO_PAUSE_MS = 3000;
const LOGO_HIDE_DELAY_MS = 3000;
const LOGO_IDLE_SHOW = 90000;
const LOGO_IDLE_INTERVAL = 15 * 60000;

export default function (p) {
  let brandName = "MONOKROMATIC";

  // Animation state (0–1 normalized)
  let logoReveal = 0;
  let logoRevealTarget = 0;
  let headlineExpand = 0;
  let headlineTarget = 0;

  // Content
  let currentTitle = "";
  let currentSubtitle = "";
  let currentType = null;
  let hasMessage = false;

  // Timers
  let logoIdleTimer = null;
  let logoHideTimer = null;
  let expandTimer = null;
  let hadContent = false;

  // Layout
  let brandW = 0;
  let brandH = 0;
  const padX = 16;
  const padY = 10;
  const gap = 2;

  p.setup = function () {
    p.textFont("Rajdhani");
    p.textStyle(p.BOLD);
    p.frameRate(60);
  };

  p.draw = function () {
    p.clear();

    const fontSize = p.width * 0.022;
    const subtitleSize = fontSize * 0.55;
    const bannerBottom = p.height - 15;
    const bannerLeft = p.width * 0.27;
    const bannerRight = p.width * 0.73;
    const bannerW = bannerRight - bannerLeft;

    // Measure brand
    p.textSize(fontSize);
    brandW = p.textWidth(brandName) + padX * 2;
    brandH = fontSize + padY * 2;

    // Lerp animations (0–1)
    logoReveal = p.lerp(logoReveal, logoRevealTarget, LERP_SPEED);
    headlineExpand = p.lerp(headlineExpand, headlineTarget, LERP_SPEED);

    // Snap when close
    if (Math.abs(logoReveal - logoRevealTarget) < 0.005) logoReveal = logoRevealTarget;
    if (Math.abs(headlineExpand - headlineTarget) < 0.005) headlineExpand = headlineTarget;

    if (logoReveal < 0.005 && headlineExpand < 0.005) return;

    // Headline fills ALL remaining banner width (not just text width)
    const headlineFullW = bannerW - brandW - gap;
    const headlineActualW = headlineFullW * headlineExpand;

    // Brand position: starts at right edge, gets pushed left by headline
    const brandX = bannerRight - brandW - headlineActualW;
    const brandY = bannerBottom - brandH;

    // Headline position: right of brand, fills to banner right edge
    const headlineX = brandX + brandW;

    const ctx = p.drawingContext;
    p.push();
    p.noStroke();

    // Draw headline panel
    if (headlineExpand > 0.005 && headlineActualW > 1) {
      p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
      p.rect(headlineX, brandY, headlineActualW, brandH);

      // Clip text inside headline
      ctx.save();
      ctx.beginPath();
      ctx.rect(headlineX, brandY, headlineActualW, brandH);
      ctx.clip();

      const centerY = bannerBottom - brandH / 2;

      if (currentSubtitle) {
        p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        p.textSize(fontSize);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(currentTitle, headlineX + headlineFullW / 2, centerY + 1);

        p.fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2], SUBTITLE_COLOR[3]);
        p.textSize(subtitleSize);
        p.textAlign(p.CENTER, p.TOP);
        p.text(currentSubtitle, headlineX + headlineFullW / 2, centerY + 3);
      } else {
        p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        p.textSize(fontSize);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(currentTitle, headlineX + headlineFullW / 2, centerY);
      }

      if (currentType === "music") {
        const iconSize = fontSize * 0.8;
        const iconX = headlineX + headlineActualW - padX - iconSize;
        const iconY = centerY - iconSize / 2;
        p.fill(255);
        p.rect(iconX, iconY, iconSize, iconSize, 2);
        p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2]);
        p.textSize(iconSize * 0.7);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("♪", iconX + iconSize / 2, iconY + iconSize / 2);
      }

      ctx.restore();
    }

    // Draw brand panel — revealed in-place via clip (right-to-left wipe)
    if (logoReveal > 0.005) {
      const revealW = brandW * logoReveal;
      const clipX = brandX + brandW - revealW;

      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, brandY, revealW, brandH);
      ctx.clip();

      p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
      p.rect(brandX, brandY, brandW, brandH);

      p.fill(255);
      p.textSize(fontSize);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(brandName, brandX + brandW / 2, bannerBottom - brandH / 2);

      ctx.restore();
    }

    p.pop();
  };

  p.messageReceived = function (msg) {
    if (!msg) {
      // Collapse headline
      hasMessage = false;
      headlineTarget = 0;

      // After headline collapses + pause, hide logo
      clearTimers();
      logoHideTimer = setTimeout(() => {
        logoRevealTarget = 0;
        startIdleCycle();
      }, LOGO_HIDE_DELAY_MS);
      return;
    }

    const title = msg.data?.title || "";
    const subtitle = msg.data?.subtitle || "";

    if (title === currentTitle && subtitle === currentSubtitle) return;

    currentTitle = title;
    currentSubtitle = subtitle;
    currentType = msg.type;
    hasMessage = true;
    hadContent = true;

    clearTimers();

    // Show logo first
    logoRevealTarget = 1;

    // Wait for logo reveal + 3s pause before expanding headline
    const delay = logoReveal < 0.5 ? LOGO_PAUSE_MS + 600 : 0;
    expandTimer = setTimeout(() => {
      headlineTarget = 1;
    }, delay);
  };

  function clearTimers() {
    if (logoIdleTimer) clearInterval(logoIdleTimer);
    if (logoHideTimer) clearTimeout(logoHideTimer);
    if (expandTimer) clearTimeout(expandTimer);
    logoIdleTimer = null;
    logoHideTimer = null;
    expandTimer = null;
  }

  function startIdleCycle() {
    logoIdleTimer = setInterval(() => {
      logoRevealTarget = 1;
      logoHideTimer = setTimeout(() => {
        logoRevealTarget = 0;
      }, LOGO_IDLE_SHOW);
    }, LOGO_IDLE_INTERVAL);
  }
}
