/**
 * OCCT Integration Barrel
 *
 * Re-exports all public API surface of the OpenCascade.js integration.
 *
 * Usage in a React component:
 *
 *   import { initOCCT, ensureOCCT } from "@/services/occt";
 *
 *   const [occtReady, setOcctReady] = useState(false);
 *
 *   useEffect(() => {
 *     ensureOCCT().then(({ ready }) => setOcctReady(ready));
 *   }, []);
 *
 *   if (!occtReady) return <p>Loading CAD engine…</p>;
 *
 *   const roof3d = generateRoof3D(skeleton, vertices, slope);
 *   const mesh   = occtShapeToBabylonMesh(roof3d.shape, scene);
 */

// -- Engine lifecycle -------------------------------------------------
export { initOCCT, ensureOCCT, disposeOCCT, isOCCTReady, getOCCT, getOCCTError } from "./occtEngine";

// -- Roof solid builder -----------------------------------------------
export { generateRoof3D } from "./roofBuilder";

// -- Babylon.js bridge -------------------------------------------------
export { occtShapeToBabylonMesh, getOCCTTessellation } from "./babylonBridge";

// -- Steel frame extraction -------------------------------------------
export { extractSteelFrame } from "./steelFrame";

// -- Quantity takeoff -------------------------------------------------
export { computeQuantities, computeOCCTQuantities, computeFallbackQuantities } from "./quantities";

// -- Types (re-exported for convenience) -------------------------------
export type { Roof3DResult, SteelFrameResult, QuantityResult } from "./types";
