// Compress an uploaded image to the best-quality data URL that still fits inside
// a Firestore document (hard limit 1 MiB). The whole theme — including the
// background image as a base64 string — lives in one doc, so we target a safe
// encoded-string budget and adaptively trade quality/size to maximise fidelity.

// Encoded data URL string budget (leaves headroom under Firestore's 1,048,576 B
// doc limit for the rest of the theme fields).
const TARGET_BYTES = 780 * 1024;
const HARD_MAX_BYTES = 950 * 1024;
const DEFAULT_MAX_DIM = 1920;

export async function compressImageToDataUrl(
  file: File,
  maxDim = DEFAULT_MAX_DIM
): Promise<string> {
  const srcUrl = await readFileAsDataUrl(file);
  const img = await loadImage(srcUrl);

  let dim = Math.max(img.width, img.height) < maxDim ? Math.max(img.width, img.height) : maxDim;
  let quality = 0.92;
  let best = render(img, dim, quality);

  // Already small enough at top quality? ship it.
  if (best.length <= TARGET_BYTES) return best;

  // Adaptive: drop quality first (cheap, preserves resolution), then dimensions.
  for (let attempt = 0; attempt < 9; attempt++) {
    if (quality > 0.6) {
      quality -= 0.08;
    } else {
      dim = Math.round(dim * 0.85);
      quality = 0.82;
    }
    const out = render(img, dim, quality);
    best = out;
    if (out.length <= TARGET_BYTES) break;
  }
  return best;
}

function render(img: HTMLImageElement, maxDim: number, quality: number): string {
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img.src;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // WebP gives noticeably better quality-per-byte; fall back to JPEG.
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/jpeg", quality);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Approx byte size of the stored data URL string (what counts against Firestore). */
export function dataUrlSizeKb(dataUrl: string): number {
  return Math.round(dataUrl.length / 1024);
}

/** True when the encoded image is too large to safely store in the theme doc. */
export function isTooLarge(dataUrl: string): boolean {
  return dataUrl.length > HARD_MAX_BYTES;
}
