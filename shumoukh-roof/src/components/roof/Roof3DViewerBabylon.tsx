// @ts-nocheck
import { useEffect, useRef, useCallback, useState } from "react";
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4,
  MeshBuilder, VertexData, StandardMaterial, Mesh,
  LinesMesh, CreateGround, CreateLines,
} from "@babylonjs/core";
import { createRoofVertexData } from "../../utils/roofGeometry";
import {
  ensureOCCT, isOCCTReady,
  generateRoof3D,
  occtShapeToBabylonMesh,
} from "../../services/occt";

const COLORS = {
  ridge: new Color3(1, 0.3, 0.1),
  hip: new Color3(1, 0.15, 0.15),
  valley: new Color3(0.15, 0.4, 0.92),
  wall: new Color3(1, 1, 1),
  ground: new Color3(0.15, 0.15, 0.18),
  roof: new Color3(0.85, 0.6, 0.4),
  roofOcct: new Color3(0.78, 0.55, 0.35),
};

const VIEWS = {
  front: { alpha: Math.PI / 2, beta: Math.PI / 3, radius: 20 },
  top: { alpha: 0, beta: 0.1, radius: 20 },
  right: { alpha: 0, beta: Math.PI / 3, radius: 20 },
  "3d": { alpha: -Math.PI / 4, beta: Math.PI / 4, radius: 22 },
  back: { alpha: -Math.PI / 2, beta: Math.PI / 3, radius: 20 },
  left: { alpha: Math.PI, beta: Math.PI / 3, radius: 20 },
};

/* ---------- legacy height map + VertexData (fallback) ---------- */

function buildHeightMap(skeleton, slopeFactor) {
  const map = {};
  if (!skeleton?.faces) return map;
  for (const face of skeleton.faces) {
    if (face.length < 3) continue;
    const vs = face.map((p) => ({ x: p.x, y: p.y }));
    const cx = vs.reduce((s, v) => s + v.x, 0) / vs.length;
    const cy = vs.reduce((s, v) => s + v.y, 0) / vs.length;
    const faceCenter = { x: cx, y: cy };

    let minDist = Infinity;
    let closestEdge = null;
    const n = face.length;
    for (let i = 0; i < n; i++) {
      const a = face[i];
      const b = face[(i + 1) % n];
      const ex = b.x - a.x, ey = b.y - a.y;
      const len = Math.sqrt(ex * ex + ey * ey);
      if (len < 0.001) continue;
      const t = Math.max(0, Math.min(1, ((faceCenter.x - a.x) * ex + (faceCenter.y - a.y) * ey) / (len * len)));
      const px = a.x + t * ex, py = a.y + t * ey;
      const d = Math.sqrt((faceCenter.x - px) ** 2 + (faceCenter.y - py) ** 2);
      if (d < minDist) { minDist = d; closestEdge = { a, b }; }
    }

    if (!closestEdge) continue;

    const roofHeight = minDist * slopeFactor;

    for (const v of vs) {
      const key = `${v.x.toFixed(4)},${v.y.toFixed(4)}`;
      const existing = map[key];
      if (existing === undefined || roofHeight > existing) {
        map[key] = roofHeight;
      }
    }
  }
  return map;
}

function buildRoofMesh(skeleton, slopeFactor, scene) {
  if (!skeleton?.faces || skeleton.faces.length === 0) return null;

  const heightMap = buildHeightMap(skeleton, slopeFactor);
  const vd = createRoofVertexData(skeleton, heightMap);
  if (!vd.positions || vd.positions.length === 0) return null;

  const mesh = new Mesh("roof", scene);
  vd.applyToMesh(mesh);

  const mat = new StandardMaterial("roofMat", scene);
  mat.diffuseColor = COLORS.roof;
  mat.specularColor = new Color3(0.05, 0.05, 0.05);
  mat.backFaceCulling = true;
  mesh.material = mat;
  mesh.receiveShadows = true;

  return mesh;
}

/* ---------- OCCT-powered mesh builder ---------- */

function buildOcctRoofMesh(vertices, skeleton, slope, scene) {
  const roof3d = generateRoof3D(skeleton, vertices, slope);
  if (!roof3d || !roof3d.shape) {
    return { mesh: null, stats: null };
  }

  const mesh = occtShapeToBabylonMesh(roof3d.shape, scene, "occt-roof");

  const mat = new StandardMaterial("occtRoofMat", scene);
  mat.diffuseColor = COLORS.roofOcct;
  mat.specularColor = new Color3(0.05, 0.05, 0.05);
  mat.backFaceCulling = true;
  mesh.material = mat;
  mesh.receiveShadows = true;

  return { mesh, stats: roof3d.stats };
}

/* ---------- shared skeleton line builder ---------- */

function buildSkeletonLines(skeleton, heightMap, scene) {
  if (!skeleton) return [];
  const meshes = [];

  for (const r of skeleton.ridges || []) {
    const z1 = heightMap ? (heightMap[`${r.start.x.toFixed(4)},${r.start.y.toFixed(4)}`] || 0) : 0;
    const z2 = heightMap ? (heightMap[`${r.end.x.toFixed(4)},${r.end.y.toFixed(4)}`] || 0) : 0;
    const pts = [new Vector3(r.start.x, z1, r.start.y), new Vector3(r.end.x, z2, r.end.y)];
    const line = CreateLines("ridge", { points: pts }, scene);
    line.color = COLORS.ridge;
    meshes.push(line);
  }
  for (const h of skeleton.hips || []) {
    const z1 = heightMap ? (heightMap[`${h.start.x.toFixed(4)},${h.start.y.toFixed(4)}`] || 0) : 0;
    const z2 = heightMap ? (heightMap[`${h.end.x.toFixed(4)},${h.end.y.toFixed(4)}`] || 0) : 0;
    const pts = [new Vector3(h.start.x, z1, h.start.y), new Vector3(h.end.x, z2, h.end.y)];
    const line = CreateLines("hip", { points: pts }, scene);
    line.color = COLORS.hip;
    meshes.push(line);
  }
  for (const v of skeleton.valleys || []) {
    const z1 = heightMap ? (heightMap[`${v.start.x.toFixed(4)},${v.start.y.toFixed(4)}`] || 0) : 0;
    const z2 = heightMap ? (heightMap[`${v.end.x.toFixed(4)},${v.end.y.toFixed(4)}`] || 0) : 0;
    const pts = [new Vector3(v.start.x, z1, v.start.y), new Vector3(v.end.x, z2, v.end.y)];
    const dx = pts[1].x - pts[0].x, dz = pts[1].z - pts[0].z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const segs = Math.max(Math.floor(len / 0.6), 2);
    const dashLen = len / segs;
    for (let i = 0; i < segs; i++) {
      if (i % 2 === 1) continue;
      const t0 = i / segs, t1 = Math.min((i + 0.6) / segs, 1);
      const sp = new Vector3(pts[0].x + dx * t0, pts[0].z + dz * t0, pts[0].z + dz * t0);
      const ep = new Vector3(pts[0].x + dx * t1, pts[0].z + dz * t1, pts[0].z + dz * t1);
      const seg = CreateLines("valley", { points: [sp, ep] }, scene);
      seg.color = COLORS.valley;
      meshes.push(seg);
    }
  }
  return meshes;
}

function buildWallOutline(vertices, scene) {
  if (!vertices || vertices.length < 2) return null;
  const pts = vertices.map((v) => new Vector3(v.x, 0, v.y));
  if (pts.length < 2) return null;
  const line = CreateLines("wallOutline", { points: pts }, scene);
  line.color = COLORS.wall;
  return line;
}

/* ---------- component ---------- */

export default function Roof3DViewerBabylon({ vertices, skeleton, slope, tile }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshesRef = useRef([]);
  const animRef = useRef(null);

  const [occtState, setOcctState] = useState({
    loading: false,
    ready: false,
    error: null,
    stats: null,
    engine: "legacy", // "occt" | "legacy"
  });

  const slopeFactor = slope ? slope / 100 : 0.4;

  // Initialise OCCT engine on mount
  useEffect(() => {
    if (!skeleton || !vertices || vertices.length < 3) return;

    setOcctState((s) => ({ ...s, loading: true }));

    ensureOCCT().then(({ ready, error }) => {
      setOcctState((s) => ({
        ...s,
        loading: false,
        ready,
        error,
        engine: ready ? "occt" : "legacy",
      }));
    });
  }, [skeleton, vertices]);

  const buildScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dispose previous
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engineRef.current = engine;

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.08, 0.08, 0.1, 1);
    sceneRef.current = scene;

    const camera = new ArcRotateCamera("cam", -Math.PI / 4, Math.PI / 4, 22, Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 80;
    camera.panningSensibility = 50;
    camera.wheelPrecision = 50;
    camera.attachControl(canvas, true);
    cameraRef.current = camera;

    const light = new HemisphericLight("light", new Vector3(0.5, 1, 0.3), scene);
    light.intensity = 0.9;
    light.diffuse = new Color3(1, 1, 1);
    light.specular = new Color3(0.1, 0.1, 0.1);
    light.groundColor = new Color3(0.3, 0.3, 0.4);

    const hemi2 = new HemisphericLight("light2", new Vector3(-0.3, 0.5, -0.5), scene);
    hemi2.intensity = 0.4;

    const ground = CreateGround("ground", { width: 40, height: 40 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = COLORS.ground;
    groundMat.specularColor = new Color3(0, 0, 0);
    groundMat.alpha = 0.5;
    ground.material = groundMat;

    // -- Build roof geometry ----------------------------------------
    if (skeleton && vertices?.length >= 3) {
      if (occtState.ready && isOCCTReady()) {
        // OCCT-powered solid
        try {
          const { mesh, stats } = buildOcctRoofMesh(vertices, skeleton, slope, scene);
          if (mesh) {
            meshesRef.current.push(mesh);
            setOcctState((s) => ({ ...s, stats }));
          }
        } catch (err) {
          console.warn("[OCCT] build failed, falling back:", err);
          const legacy = buildRoofMesh(skeleton, slopeFactor, scene);
          if (legacy) meshesRef.current.push(legacy);
        }
      } else {
        // Legacy VertexData path
        const legacy = buildRoofMesh(skeleton, slopeFactor, scene);
        if (legacy) meshesRef.current.push(legacy);
      }

      // Skeleton lines (with 3D heights when available)
      const heightMap = buildHeightMap(skeleton, slopeFactor);
      const skelLines = buildSkeletonLines(skeleton, heightMap, scene);
      meshesRef.current.push(...skelLines);
    }

    const wallOutline = buildWallOutline(vertices, scene);
    if (wallOutline) meshesRef.current.push(wallOutline);

    engine.runRenderLoop(() => scene.render());

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    animRef.current = () => {
      engine.dispose();
      window.removeEventListener("resize", resize);
    };
  }, [vertices, skeleton, slopeFactor, occtState.ready]);

  useEffect(() => {
    buildScene();
    return () => {
      if (animRef.current) animRef.current();
      meshesRef.current.forEach((m) => {
        if (m?.dispose) m.dispose();
      });
      meshesRef.current = [];
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [buildScene]);

  const setView = (viewName) => {
    const v = VIEWS[viewName];
    if (!v || !cameraRef.current) return;
    cameraRef.current.alpha = v.alpha;
    cameraRef.current.beta = v.beta;
    cameraRef.current.radius = v.radius;
  };

  return (
    <div className="relative">
      {/* Top bar */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center gap-1 flex-wrap">
        <div className="flex gap-1">
          {Object.keys(VIEWS).map((name) => (
            <button key={name}
              onClick={() => setView(name)}
              className="px-2.5 py-1 text-[10px] font-bold bg-black/40 backdrop-blur-sm text-paper/80 rounded-lg hover:bg-black/60 transition border border-white/10 cursor-pointer"
            >
              {name === "3d" ? "3D" : name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>

        {/* Engine badge */}
        <div className="ml-auto flex items-center gap-2">
          {occtState.loading && (
            <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/30 backdrop-blur-sm text-blue-200 rounded-full border border-blue-400/20 animate-pulse">
              تحميل محرك CAD…
            </span>
          )}
          {occtState.ready && (
            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/30 backdrop-blur-sm text-emerald-200 rounded-full border border-emerald-400/20">
              OCCT
            </span>
          )}
          {!occtState.loading && !occtState.ready && (
            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 backdrop-blur-sm text-amber-200/60 rounded-full border border-amber-400/10">
              VertexData
            </span>
          )}
          {occtState.stats && (
            <span className="px-2 py-0.5 text-[9px] font-mono bg-black/40 backdrop-blur-sm text-paper/60 rounded-lg border border-white/10">
              {occtState.stats.totalArea.toFixed(1)} م²
            </span>
          )}
        </div>
      </div>

      {/* Error overlay */}
      {occtState.error && (
        <div className="absolute top-12 left-2 z-10 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg px-2.5 py-1">
          <span className="text-[9px] text-red-200">OCCT: {occtState.error}</span>
        </div>
      )}

      <canvas ref={canvasRef} className="w-full h-[400px] rounded-2xl" style={{ height: "400px" }} />
    </div>
  );
}
