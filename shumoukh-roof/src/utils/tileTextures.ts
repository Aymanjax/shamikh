// @ts-nocheck
import { DynamicTexture, Texture } from "@babylonjs/core";

const TEX_SIZE = 1024;

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function derivePalettes(baseHex) {
  const base = hexToRgb(baseHex);
  const palettes = [];
  for (let i = 0; i < 8; i++) {
    const shift = (i - 3.5) * 8;
    const lighterShift = (i % 2 === 0) ? 20 : -10;
    palettes.push([
      rgbToHex(base.r + shift + lighterShift, base.g + shift + lighterShift, base.b + shift + lighterShift),
      rgbToHex(base.r + shift, base.g + shift, base.b + shift),
      rgbToHex(base.r + shift - 18, base.g + shift - 18, base.b + shift - 18),
      rgbToHex(base.r + shift + lighterShift + 14, base.g + shift + lighterShift + 14, base.b + shift + lighterShift + 14),
    ]);
  }
  return palettes;
}

function drawAlbedoCtx(ctx, palettes, w, h) {
  const S = w;
  const COLS = 4, ROWS = 2;
  const GAP = Math.floor(S * 0.035);
  const TW = Math.floor((S - GAP * (COLS + 1)) / COLS);
  const TH = Math.floor((S - GAP * (ROWS + 1)) / ROWS);
  const R = Math.min(TW, TH) * 0.06;

  ctx.fillStyle = "#2a1a14";
  ctx.fillRect(0, 0, S, S);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      const x = GAP + col * (TW + GAP);
      const y = GAP + row * (TH + GAP);
      const [cTop, cMid, cBot] = palettes[idx];

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, TW, TH, R);
      ctx.clip();

      const baseGrad = ctx.createLinearGradient(x, y, x, y + TH);
      baseGrad.addColorStop(0, cTop);
      baseGrad.addColorStop(0.45, cMid);
      baseGrad.addColorStop(1, cBot);
      ctx.fillStyle = baseGrad;
      ctx.fillRect(x, y, TW, TH);

      const hlGrad = ctx.createLinearGradient(x + TW * 0.15, 0, x + TW * 0.85, 0);
      hlGrad.addColorStop(0, "rgba(0,0,0,0.18)");
      hlGrad.addColorStop(0.35, "rgba(255,255,255,0.08)");
      hlGrad.addColorStop(0.65, "rgba(255,255,255,0.10)");
      hlGrad.addColorStop(1, "rgba(0,0,0,0.20)");
      ctx.fillStyle = hlGrad;
      ctx.fillRect(x, y, TW, TH);

      ctx.restore();

      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, TW - 2, TH - 2, R - 1);
      ctx.stroke();
    }
  }
}

export function generateTileTextures(tileCount, sceneOrNull, colorHexOrOptions) {
  let colorHex;
  let neutral = false;
  if (typeof colorHexOrOptions === "object" && colorHexOrOptions !== null) {
    colorHex = colorHexOrOptions.colorHex;
    neutral = !!colorHexOrOptions.neutral;
  } else {
    colorHex = colorHexOrOptions;
  }

  const palettes = colorHex ? derivePalettes(colorHex) : null;
  const spacing = Math.sqrt(1 / Math.max(tileCount, 1));

  const dynamicTexture = new DynamicTexture("tileAlbedo", { width: TEX_SIZE, height: TEX_SIZE }, sceneOrNull, false, Texture.TRILINEAR_SAMPLINGMODE);
  const ctx = dynamicTexture.getContext();

  if (neutral) {
    ctx.fillStyle = "#e8e4e0";
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  } else if (palettes) {
    drawAlbedoCtx(ctx, palettes, TEX_SIZE, TEX_SIZE);
  } else {
    const defaultPalettes = [
      ["#d4784e", "#c8663e", "#b05430", "#e88a5c"],
      ["#cc6a42", "#b85a34", "#a44e2a", "#dc7c52"],
      ["#e07c52", "#c8643c", "#b4582e", "#ee8a5a"],
      ["#c4623c", "#b05230", "#9c4428", "#d8744a"],
      ["#da764a", "#c05834", "#aa4c2c", "#ea8254"],
      ["#ce6e44", "#b85632", "#a24826", "#de7a4e"],
      ["#d27048", "#bc5a36", "#a84c2a", "#e27e50"],
      ["#c86840", "#b0542e", "#9e4624", "#d87248"],
    ];
    drawAlbedoCtx(ctx, defaultPalettes, TEX_SIZE, TEX_SIZE);
  }
  dynamicTexture.update(false);

  return { texture: dynamicTexture, spacing };
}
