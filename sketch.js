/**
 * monokromatic banner sketch
 *
 * p5 instance-mode sketch that renders a branded lower-third banner
 * with smooth expand/collapse animations.
 */

const PANEL_COLOR = [75, 50, 110, 242];
const TEXT_COLOR = [255, 255, 255];
const SUBTITLE_COLOR = [200, 160, 255, 200];
const LERP_SPEED = 0.12;
const LOGO_SHOW_DELAY = 500;
const LOGO_HIDE_DELAY = 3000;
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

  // Logo idle cycle
  let logoIdleTimer = null;
  let logoHideTimer = null;
  let hadContent = false;

  // Layout metrics
  let brandW = 0;
  let brandH = 0;
  let headlineW = 0;
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
    const bannerRight = p.width * 0.73;

    // Measure brand
    p.textSize(fontSize);
    brandW = p.textWidth(brandName) + padX * 2;
    brandH = fontSize + padY * 2;

    // Lerp animations (0–1)
    logoReveal = p.lerp(logoReveal, logoRevealTarget, LERP_SPEED);
    headlineExpand = p.lerp(headlineExpand, headlineTarget, LERP_SPEED);

    // Snap when close enough
    if (Math.abs(logoReveal - logoRevealTarget) < 0.005) logoReveal = logoRevealTarget;
    if (Math.abs(headlineExpand - headlineTarget) < 0.005) headlineExpand = headlineTarget;

    // Measure headline
    if (hasMessage && currentTitle) {
      p.textSize(fontSize);
      let tw = p.textWidth(currentTitle);
      if (currentSubtitle) {
        p.textSize(subtitleSize);
        tw = Math.max(tw, p.textWidth(currentSubtitle));
      }
      headlineW = tw + padX * 2;

      if (currentType === "music") {
        headlineW += fontSize + 8;
      }
    }

    if (logoReveal < 0.005 && headlineExpand < 0.005) return;

    // Brand is always at this fixed position
    const brandX = bannerRight - brandW;
    const brandY = bannerBottom - brandH;

    // Headline grows leftward from brand
    const headlineActualW = headlineW * headlineExpand;
    const headlineX = brandX - headlineActualW - gap;

    const ctx = p.drawingContext;
    p.push();
    p.noStroke();

    // Draw headline panel (clipped to expanding width)
    if (headlineExpand > 0.005 && headlineActualW > 1) {
      p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
      p.rect(headlineX, brandY, headlineActualW, brandH);

      // Clip text to headline bounds
      ctx.save();
      ctx.beginPath();
      ctx.rect(headlineX, brandY, headlineActualW, brandH);
      ctx.clip();

      const textX = headlineX + padX;
      const centerY = bannerBottom - brandH / 2;

      if (currentSubtitle) {
        p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        p.textSize(fontSize);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text(currentTitle, textX, centerY + 1);

        p.fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2], SUBTITLE_COLOR[3]);
        p.textSize(subtitleSize);
        p.textAlign(p.LEFT, p.TOP);
        p.text(currentSubtitle, textX, centerY + 3);
      } else {
        p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        p.textSize(fontSize);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(currentTitle, textX, centerY);
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

    // Draw brand panel — revealed in-place via clip (right-to-left)
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

      // After collapse, hide logo then start idle cycle
      clearTimers();
      logoHideTimer = setTimeout(() => {
        logoRevealTarget = 0;
        startIdleCycle();
      }, LOGO_HIDE_DELAY);
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

    // Show logo first, then expand headline
    logoRevealTarget = 1;

    const expandDelay = logoReveal < 0.5 ? LOGO_SHOW_DELAY : 0;
    setTimeout(() => {
      headlineTarget = 1;
    }, expandDelay);
  };

  function clearTimers() {
    if (logoIdleTimer) clearInterval(logoIdleTimer);
    if (logoHideTimer) clearTimeout(logoHideTimer);
    logoIdleTimer = null;
    logoHideTimer = null;
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
