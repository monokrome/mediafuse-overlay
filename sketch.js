/**
 * monokromatic banner sketch
 *
 * Two-buffer tug of war: headline grows from the brand's side,
 * pushing it to the opposite edge. On swap, the old headline
 * shrinks simultaneously as the new one grows — one smooth pull.
 */

import { createState } from "./sketch/state.js";
import { draw } from "./sketch/draw.js";
import { messageReceived } from "./sketch/messages.js";

export default function (p) {
  const brandName = "MONOKROMATIC";
  const s = createState();

  p.setup = function () {
    p.textFont("Rajdhani");
    p.textStyle(p.BOLD);
    p.frameRate(60);
  };

  p.draw = function () {
    draw(p, s, brandName);
  };

  p.messageReceived = function (msg) {
    messageReceived(s, msg);
  };
}
