import { TEXT_COLOR } from "./constants.js";

const VERT = `
precision mediump float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec2 vTexCoord;
void main() {
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform float uProgress;
uniform float uTime;
uniform vec3 uColor;

float rand(vec2 c) {
  return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vTexCoord;
  float intensity = 1.0 - abs(uProgress - 0.5) * 2.0;

  float band = floor(uv.y * 28.0);
  float t = floor(uTime * 16.0);
  float jitter = (rand(vec2(band, t)) - 0.5) * 0.10 * intensity;
  if (rand(vec2(band + 11.0, t)) > 0.90) jitter *= 3.5;

  vec2 disp = vec2(uv.x + jitter, uv.y);
  float split = 0.012 * intensity;

  float fr = texture2D(uFrom, disp + vec2(split, 0.0)).a;
  float fg = texture2D(uFrom, disp).a;
  float fb = texture2D(uFrom, disp - vec2(split, 0.0)).a;
  float tr = texture2D(uTo, disp + vec2(split, 0.0)).a;
  float tg = texture2D(uTo, disp).a;
  float tb = texture2D(uTo, disp - vec2(split, 0.0)).a;

  float bx = floor(uv.x * 96.0);
  float by = floor(uv.y * 18.0);
  float n = rand(vec2(bx, by + t * 0.13));
  float mixT = smoothstep(0.0, 1.0, uProgress + (n - 0.5) * 0.55 * intensity);

  float r = mix(fr, tr, mixT) * uColor.r;
  float g = mix(fg, tg, mixT) * uColor.g;
  float b = mix(fb, tb, mixT) * uColor.b;
  float a = max(max(r, g), b);

  gl_FragColor = vec4(r, g, b, a);
}
`;

let textBufA = null;
let textBufB = null;
let fxBuf = null;
let glitchShader = null;
let bufW = 0;
let bufH = 0;
let shaderBroken = false;

function ensureBuffers(p, w, h) {
  if (textBufA && w <= bufW && h <= bufH) return true;
  const newW = Math.max(bufW, w);
  const newH = Math.max(bufH, h);
  try {
    if (textBufA) textBufA.remove();
    if (textBufB) textBufB.remove();
    if (fxBuf) fxBuf.remove();
    textBufA = p.createGraphics(newW, newH);
    textBufB = p.createGraphics(newW, newH);
    fxBuf = p.createGraphics(newW, newH, p.WEBGL);
    glitchShader = fxBuf.createShader(VERT, FRAG);
    bufW = newW;
    bufH = newH;
    return true;
  } catch (err) {
    console.error("[glitch] WEBGL setup failed, falling back to plain text:", err);
    shaderBroken = true;
    return false;
  }
}

function fallbackText(p, fromText, toText, progress, cx, cy, fontSize) {
  const text = progress < 0.5 ? fromText : toText;
  if (!text) return;
  p.fill(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  p.textSize(fontSize);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(text, cx, cy);
}

function renderText(buf, text, fontSize) {
  buf.clear();
  if (!text) return;
  buf.noStroke();
  buf.fill(255);
  buf.textSize(fontSize);
  buf.textAlign(buf.CENTER, buf.CENTER);
  buf.text(text, buf.width / 2, buf.height / 2);
}

export function drawGlitch(p, fromText, toText, progress, cx, cy, fontSize) {
  if (shaderBroken) {
    fallbackText(p, fromText, toText, progress, cx, cy, fontSize);
    return;
  }

  p.textSize(fontSize);
  const fromW = fromText ? p.textWidth(fromText) : 0;
  const toW = toText ? p.textWidth(toText) : 0;
  const margin = fontSize * 1.5;
  const w = Math.ceil(Math.max(fromW, toW, 100) + margin * 2);
  const h = Math.ceil(fontSize * 2.5);

  if (!ensureBuffers(p, w, h)) {
    fallbackText(p, fromText, toText, progress, cx, cy, fontSize);
    return;
  }

  try {
    renderText(textBufA, fromText, fontSize);
    renderText(textBufB, toText, fontSize);

    fxBuf.clear();
    fxBuf.shader(glitchShader);
    glitchShader.setUniform("uFrom", textBufA);
    glitchShader.setUniform("uTo", textBufB);
    glitchShader.setUniform("uProgress", progress);
    glitchShader.setUniform("uTime", p.millis() / 1000);
    glitchShader.setUniform("uColor", [
      TEXT_COLOR[0] / 255,
      TEXT_COLOR[1] / 255,
      TEXT_COLOR[2] / 255,
    ]);
    fxBuf.noStroke();
    fxBuf.rect(-bufW / 2, -bufH / 2, bufW, bufH);

    p.image(fxBuf, cx - bufW / 2, cy - bufH / 2);
  } catch (err) {
    console.error("[glitch] shader render failed, falling back:", err);
    shaderBroken = true;
    fallbackText(p, fromText, toText, progress, cx, cy, fontSize);
  }
}
