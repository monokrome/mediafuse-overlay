import { TEXT_COLOR } from "./constants.js";

let textBufA = null;
let textBufB = null;
let bufW = 0;
let bufH = 0;

function ensureBuffers(p, w, h) {
  if (textBufA && w <= bufW && h <= bufH) return;
  const newW = Math.max(bufW, w);
  const newH = Math.max(bufH, h);
  if (textBufA) textBufA.remove();
  if (textBufB) textBufB.remove();
  textBufA = p.createGraphics(newW, newH);
  textBufB = p.createGraphics(newW, newH);
  bufW = newW;
  bufH = newH;
}

function renderText(buf, text, fontSize) {
  buf.clear();
  if (!text) return;
  buf.noStroke();
  buf.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  buf.textSize(fontSize);
  buf.textAlign(buf.CENTER, buf.CENTER);
  buf.text(text, buf.width / 2, buf.height / 2);
}

// Bands of source text are drawn at random horizontal offsets, with per-band
// from/to selection driven by progress + noise. Occasional bands "tear" with
// large jitter; chromatic-fringe pass adds RGB offset for that broken-CRT look.
export function drawGlitch(p, fromText, toText, progress, cx, cy, fontSize) {
  p.textSize(fontSize);
  const fromW = fromText ? p.textWidth(fromText) : 0;
  const toW = toText ? p.textWidth(toText) : 0;
  const margin = fontSize * 1.5;
  const w = Math.ceil(Math.max(fromW, toW, 100) + margin * 2);
  const h = Math.ceil(fontSize * 2.5);

  ensureBuffers(p, w, h);
  renderText(textBufA, fromText, fontSize);
  renderText(textBufB, toText, fontSize);

  const intensity = 1 - Math.abs(progress - 0.5) * 2;
  const bandH = Math.max(2, Math.floor(fontSize / 7));
  const numBands = Math.ceil(bufH / bandH);
  const dxBase = cx - bufW / 2;
  const dyBase = cy - bufH / 2;
  const ctx = p.drawingContext;

  // Chromatic-fringe pre-pass: draw both buffers tinted via composite ops.
  // We do the main scanline pass first, then overlay R/B offsets with "screen".
  for (let i = 0; i < numBands; i++) {
    const bandY = i * bandH;
    const sliceH = Math.min(bandH, bufH - bandY);
    let jitter = (Math.random() - 0.5) * 36 * intensity;
    if (Math.random() > 0.92) jitter *= 3.2;

    const noise = Math.random();
    const threshold = progress + (noise - 0.5) * 0.6 * intensity;
    const useTo = Math.random() < threshold;
    const buf = useTo ? textBufB : textBufA;

    p.image(
      buf,
      dxBase + jitter, dyBase + bandY, bufW, sliceH,
      0, bandY, bufW, sliceH,
    );
  }

  if (intensity > 0.05) {
    const split = Math.round(4 * intensity);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.45 * intensity;
    p.image(textBufA, dxBase + split, dyBase, bufW, bufH);
    p.image(textBufB, dxBase - split, dyBase, bufW, bufH);
    ctx.restore();
  }
}
