export const PANEL_COLOR = [75, 50, 110, 242];
export const TEXT_COLOR = [255, 255, 255];
export const SUBTITLE_COLOR = [220, 200, 255, 240];
export const LERP_SPEED = 0.102;
export const TARGET_FPS = 60;
export const PANEL_ANIM_DURATION = 0.7;
export const LOGO_PAUSE_MS = 3000;
export const LOGO_HIDE_DELAY_MS = 3000;
export const LOGO_IDLE_SHOW = 90000;
export const LOGO_IDLE_INTERVAL = 15 * 60000;
export const PAD_X = 16;
export const PAD_Y = 10;

export const SECONDARY_INTERVAL_MS = 9000;
export const GLITCH_DURATION_MS = 750;
export const INFO_RESHOW_DELAY_MS = 10000;

export const SIDE_LEFT = "left";
export const SIDE_RIGHT = "right";

export function getOppositeSide(side) {
  return side === SIDE_LEFT ? SIDE_RIGHT : SIDE_LEFT;
}

export function getBrandSide(s) {
  return s.brandSide;
}

export function getIconSide(s) {
  return getOppositeSide(getBrandSide(s));
}

export function getBrandX(s) {
  return s.brandSide === SIDE_LEFT ? s.bannerLeft : s.bannerRight - s.brandW;
}

export function getHeadlineEdge(s, side) {
  return side === SIDE_LEFT ? s.bannerLeft : s.bannerRight;
}

export function getHeadlineCenter(s, side) {
  return side === SIDE_LEFT
    ? s.bannerLeft + s.headlineFullW / 2
    : s.bannerRight - s.headlineFullW / 2;
}
