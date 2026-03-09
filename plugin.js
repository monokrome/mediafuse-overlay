/**
 * monokromatic banner overlay plugin
 *
 * Registers as "overlay" and handles "message" events.
 * Renders a branded banner with slide/expand animations,
 * alternating left/right placement, marquee for overflow text,
 * and periodic logo reappearance.
 */

const ANIM_MS = 600;
const SLIDE_MS = 600;
const LOGO_PAUSE_MS = 3000;
const LOGO_SHOW_MS = 90000;
const LOGO_INTERVAL_MS = 15 * 60000;

const PANEL_BG = "rgba(75, 50, 110, 0.95)";
const FONT = "'Rajdhani', sans-serif";

function setup({ register: reg, manifest }) {
  let root = null;
  let channel = "default";
  let msgUrl = `/api/messages?channel=${encodeURIComponent(channel)}`;

  // State
  let link = null;
  let banner = null;
  let brandTag = null;
  let brandText = null;
  let side = "right";
  let layoutSide = "right";
  let displayed = null;
  let expanded = false;
  let logoVisible = false;
  let logoVisibleSync = false;
  let hadContent = false;
  let prevKey = null;
  let swapCount = 0;
  let outgoing = null;
  let outgoingExpanded = false;
  let mountTime = Date.now();
  let logoHideTimer = null;
  let logoInterval = null;
  let collapseTimer = null;
  let swapTimer = null;
  let marqueeCheckTimer = null;
  let headlineEl = null;
  let outgoingEl = null;

  const registered = reg("overlay", {
    onCreate({ container, config }) {
      root = container;
      if (!root) return;

      channel = config.channel || "default";
      msgUrl = `/api/messages?channel=${encodeURIComponent(channel)}`;

      initDOM();
    },
    onMessage: handleMessage,
    onDestroy: destroy,
  });

  if (!registered) return;

  function initDOM() {
    // Load the overlay font
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Rajdhani:wght@600&display=swap";
    document.head.appendChild(link);

    banner = el("div", {
      position: "absolute",
      bottom: "15px",
      left: "27%",
      right: "27%",
      display: "flex",
      alignItems: "stretch",
      overflow: "hidden",
      zIndex: "5",
      pointerEvents: "none",
      opacity: "0.97",
      fontSize: "clamp(1rem, 2.2vw, 2rem)",
      justifyContent: "flex-end",
    });

    brandTag = el("div", {
      zIndex: "2",
      display: "inline-flex",
      alignItems: "center",
      padding: "0.4em 0.6em",
      background: PANEL_BG,
      flexShrink: "0",
      clipPath: "inset(0 0 0 100%)",
      transition: `clip-path ${SLIDE_MS}ms ease-in-out`,
    });

    brandText = el("span", {
      fontFamily: FONT,
      fontSize: "1em",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#fff",
      lineHeight: "1",
      whiteSpace: "nowrap",
    });
    brandText.textContent = manifest.config.brandName || "streamdock";

    brandTag.appendChild(brandText);
    banner.appendChild(brandTag);
    root.appendChild(banner);

    updateLayout();
    updateLogo();
  }

  function el(tag, styles) {
    const node = document.createElement(tag);
    Object.assign(node.style, styles);
    return node;
  }

  function createHeadline(content, headlineSide) {
    const wrapper = el("div", {
      position: "relative",
      background: PANEL_BG,
      overflow: "hidden",
      whiteSpace: "nowrap",
      flex: "0 0 0px",
      transition: `flex-grow ${ANIM_MS}ms ease-in-out, padding ${ANIM_MS}ms ease-in-out`,
      padding: "0",
      margin: "0 -1px",
      order: "1",
    });

    const inner = el("div", {
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      gap: "0.5em",
      padding: "0.4em 0",
      transition: `padding ${ANIM_MS}ms ease-in-out`,
      flexDirection: "row",
    });

    const textWrap = el("div", {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      whiteSpace: "nowrap",
      flex: "1",
      minHeight: "0",
      overflow: "hidden",
    });

    const titleEl = el("span", {
      fontFamily: FONT,
      fontSize: "1em",
      fontWeight: "600",
      color: "#fff",
      lineHeight: "1",
      whiteSpace: "nowrap",
    });
    titleEl.textContent = content.title;

    textWrap.appendChild(titleEl);

    if (content.subtitle) {
      const subtitleEl = el("span", {
        fontFamily: FONT,
        fontSize: "0.55em",
        fontWeight: "400",
        color: "rgba(200, 160, 255, 0.8)",
        lineHeight: "1",
        whiteSpace: "nowrap",
      });
      subtitleEl.textContent = content.subtitle;
      textWrap.appendChild(subtitleEl);
    }

    inner.appendChild(textWrap);

    if (content.type === "music") {
      const icon = el("div", {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        padding: "0.2em",
        background: "#fff",
        color: PANEL_BG,
        fontSize: "0.75em",
      });
      icon.innerHTML =
        '<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6ZM10 19a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>';
      inner.appendChild(icon);
    }

    wrapper.appendChild(inner);
    return { wrapper, inner, textWrap };
  }

  function setExpanded(headline, value) {
    if (!headline) return;
    headline.wrapper.style.flexGrow = value ? "1" : "0";
    headline.inner.style.padding = value ? "0.4em 0.8em" : "0.4em 0";
  }

  function updateLayout() {
    // no-op: brand is always flex-end anchored
  }

  function updateLogo() {
    brandTag.style.clipPath = logoVisible
      ? "inset(0 0 0 0)"
      : "inset(0 0 0 100%)";
  }

  function showLogo() {
    logoVisible = true;
    logoVisibleSync = true;
    updateLogo();
  }

  function hideLogo() {
    logoVisible = false;
    logoVisibleSync = false;
    updateLogo();
  }

  function clearLogoTimers() {
    if (logoHideTimer) clearTimeout(logoHideTimer);
    if (logoInterval) clearInterval(logoInterval);
    logoHideTimer = null;
    logoInterval = null;
  }

  function startLogoIdleCycle() {
    clearLogoTimers();
    const hideDelay = hadContent ? LOGO_PAUSE_MS : 0;
    logoHideTimer = setTimeout(hideLogo, hideDelay);

    logoInterval = setInterval(() => {
      showLogo();
      logoHideTimer = setTimeout(hideLogo, LOGO_SHOW_MS);
    }, LOGO_INTERVAL_MS);
  }

  function removeHeadline(h) {
    if (h && h.wrapper.parentNode) h.wrapper.remove();
  }

  function checkMarquee(headline) {
    if (!headline) return;
    const tw = headline.textWrap;
    const container = tw.parentElement;
    if (!container) return;
    if (tw.scrollWidth <= container.clientWidth) return;

    const dist = tw.scrollWidth + 48;
    const dur = Math.max(8, tw.scrollWidth / 50);

    const style = document.createElement("style");
    const id = `mq-${Date.now()}`;
    style.textContent = `@keyframes ${id}{from{transform:translateX(0)}to{transform:translateX(-${dist}px)}}`;
    document.head.appendChild(style);

    tw.style.overflow = "visible";
    tw.style.display = "flex";
    tw.style.flexDirection = "row";
    tw.style.gap = "3em";
    tw.style.alignItems = "center";

    const clone = tw.innerHTML;
    const item1 = el("div", {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      flexShrink: "0",
    });
    item1.innerHTML = clone;
    const item2 = el("div", {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      flexShrink: "0",
    });
    item2.innerHTML = clone;

    tw.innerHTML = "";
    tw.appendChild(item1);
    tw.appendChild(item2);
    tw.style.animation = `${id} ${dur}s linear infinite`;
  }

  function handleMessage(msg) {
    const incoming = msg
      ? { title: msg.data.title || "", subtitle: msg.data.subtitle || "", type: msg.type }
      : null;
    const incomingKey = incoming
      ? `${incoming.title}|${incoming.subtitle}`
      : null;

    if (incomingKey === prevKey) return;
    prevKey = incomingKey;

    if (collapseTimer) clearTimeout(collapseTimer);
    if (swapTimer) clearTimeout(swapTimer);
    if (marqueeCheckTimer) clearTimeout(marqueeCheckTimer);

    // Collapse
    if (!incoming) {
      clearLogoTimers();
      setExpanded(headlineEl, false);
      expanded = false;
      collapseTimer = setTimeout(() => {
        removeHeadline(headlineEl);
        headlineEl = null;
        displayed = null;
        logoHideTimer = setTimeout(() => {
          hideLogo();
          startLogoIdleCycle();
        }, LOGO_PAUSE_MS);
      }, ANIM_MS);
      return;
    }

    const wasLogoVisible = logoVisibleSync;
    hadContent = true;
    showLogo();
    clearLogoTimers();

    // First message (no current display)
    if (!displayed) {
      const isRecovery = Date.now() - mountTime < 1000;
      displayed = incoming;

      removeHeadline(headlineEl);
      headlineEl = createHeadline(incoming, "left");
      banner.appendChild(headlineEl.wrapper);

      if (isRecovery) {
        fetch(msgUrl, { method: "PATCH" });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setExpanded(headlineEl, true);
            expanded = true;
            marqueeCheckTimer = setTimeout(
              () => checkMarquee(headlineEl),
              ANIM_MS,
            );
          });
        });
        return;
      }

      const startExpand = () => {
        fetch(msgUrl, { method: "PATCH" });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setExpanded(headlineEl, true);
            expanded = true;
            marqueeCheckTimer = setTimeout(
              () => checkMarquee(headlineEl),
              ANIM_MS,
            );
          });
        });
      };

      if (!wasLogoVisible) {
        setTimeout(startExpand, SLIDE_MS + LOGO_PAUSE_MS);
      } else {
        startExpand();
      }
      return;
    }

    // Swap: new message while one is displayed
    swapCount += 1;

    outgoingEl = headlineEl;
    outgoingExpanded = true;
    displayed = incoming;

    headlineEl = createHeadline(incoming, "left");
    banner.appendChild(headlineEl.wrapper);
    expanded = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(headlineEl, true);
        setExpanded(outgoingEl, false);
        expanded = true;
        marqueeCheckTimer = setTimeout(
          () => checkMarquee(headlineEl),
          ANIM_MS,
        );
      });
    });

    swapTimer = setTimeout(() => {
      removeHeadline(outgoingEl);
      outgoingEl = null;
    }, ANIM_MS);
  }

  function destroy() {
    clearLogoTimers();
    if (collapseTimer) clearTimeout(collapseTimer);
    if (swapTimer) clearTimeout(swapTimer);
    if (marqueeCheckTimer) clearTimeout(marqueeCheckTimer);
    banner.remove();
    link.remove();
  }
}

export default (definePlugin) => definePlugin("monokromatic", setup);
