// @ts-nocheck
/**
 * OpenCascade.js Engine — singleton WASM lifecycle manager
 *
 * opencascade.js ports the OCCT (Open CASCADE Technology) kernel to WebAssembly.
 * It provides BREP solid modeling, boolean ops, and precise geometry queries.
 *
 * Bundle impact: ~8–12 MB WASM (loaded on first use, cached by the browser).
 * We use lazy initialisation so the main UI bundle stays small.
 */

let occtModule = null;
let initPromise = null;
let initError = null;

export function isOCCTReady() {
  return occtModule !== null;
}

export function getOCCTError() {
  return initError;
}

/**
 * Load and initialise the OCCT WASM module.
 * Idempotent — safe to call multiple times.
 *
 * @returns {Promise<typeof import("opencascade.js")>}
 */
export async function initOCCT() {
  if (occtModule) return occtModule;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { initOpenCascade } = await import("opencascade.js");
      occtModule = await initOpenCascade();

      console.log(
        `[OCCT] Engine initialised (${occtModule.About()} / ${occtModule.Version()})`,
      );
      return occtModule;
    } catch (err) {
      initError = err.message || String(err);
      console.error("[OCCT] Failed to load:", initError);
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Get the cached OCCT module reference.
 * Throws if not yet initialised — call initOCCT() first.
 */
export function getOCCT() {
  if (!occtModule) throw new Error("OCCT not loaded — call initOCCT() first");
  return occtModule;
}

/**
 * Release the WASM memory (rarely needed; page nav cleans up).
 */
export function disposeOCCT() {
  if (occtModule) {
    try { occtModule.exit(0); } catch (_) { /* OK */ }
    occtModule = null;
  }
  initPromise = null;
  initError = null;
}

/**
 * React hook-friendly wrapper.
 * Returns { ready, error, module } after init.
 */
export async function ensureOCCT() {
  if (occtModule) return { ready: true, error: null, module: occtModule };
  try {
    const mod = await initOCCT();
    return { ready: true, error: null, module: mod };
  } catch (err) {
    return { ready: false, error: initError || String(err), module: null };
  }
}
