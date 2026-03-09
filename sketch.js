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
  let font = null;

  // Animation state
  let logoAlpha = 0;
  let logoTargetAlpha = 0;
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
    const bannerLeft = p.width * 0.27;
    const bannerRight = p.width * 0.73;
    const bannerW = bannerRight - bannerLeft;

    // Measure brand
    p.textSize(fontSize);
    brandW = p.textWidth(brandName) + padX * 2;
    brandH = fontSize + padY * 2;

    // Lerp animations
    logoAlpha = p.lerp(logoAlpha, logoTargetAlpha, LERP_SPEED);
    headlineExpand = p.lerp(headlineExpand, headlineTarget, LERP_SPEED);

    // Snap when close enough
    if (Math.abs(logoAlpha - logoTargetAlpha) < 0.5) logoAlpha = logoTargetAlpha;
    if (Math.abs(headlineExpand - headlineTarget) < 0.5) headlineExpand = headlineTarget;

    // Measure headline
    if (hasMessage && currentTitle) {
      p.textSize(fontSize);
      let tw = p.textWidth(currentTitle);
      if (currentSubtitle) {
        p.textSize(subtitleSize);
        tw = Math.max(tw, p.textWidth(currentSubtitle));
      }
      headlineW = tw + padX * 2;

      // Add space for music icon
      if (currentType === "music") {
        headlineW += fontSize + 8;
      }
    }

    const brandVisible = logoAlpha > 0.5;
    const headlineVisible = headlineExpand > 0.5;

    if (!brandVisible && !headlineVisible) return;

    // Positions: brand anchored to right, headline expands left from brand
    const brandX = bannerRight - (brandW * logoAlpha) / 255;
    const headlineActualW = headlineW * (headlineExpand / 255);
    const headlineX = brandX - headlineActualW - gap;

    p.push();
    p.noStroke();

    // Draw headline panel
    if (headlineVisible && headlineActualW > 1) {
      p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
      p.rect(headlineX, bannerBottom - brandH, headlineActualW, brandH);

      // Clip text to headline bounds
      p.push();
      const ctx = p.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(headlineX, bannerBottom - brandH, headlineActualW, brandH);
      ctx.clip();

      const textX = headlineX + padX;
      const centerY = bannerBottom - brandH / 2;

      if (currentSubtitle) {
        // Title + subtitle stacked
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

      // Music icon
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
      p.pop();
    }

    // Draw brand panel
    if (brandVisible) {
      p.fill(PANEL_COLOR[0], PANEL_COLOR[1], PANEL_COLOR[2], PANEL_COLOR[3]);
      p.rect(brandX, bannerBottom - brandH, brandW, brandH);

      p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2], logoAlpha);
      p.textSize(fontSize);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(brandName, brandX + brandW / 2, bannerBottom - brandH / 2);
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
        logoTargetAlpha = 0;
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
    logoTargetAlpha = 255;

    const expandDelay = logoAlpha < 128 ? LOGO_SHOW_DELAY : 0;
    setTimeout(() => {
      headlineTarget = 255;
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
      logoTargetAlpha = 255;
      logoHideTimer = setTimeout(() => {
        logoTargetAlpha = 0;
      }, LOGO_IDLE_SHOW);
    }, LOGO_IDLE_INTERVAL);
  }
}
