// @ts-nocheck
import { useEffect, useRef, useCallback } from "react";
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4,
  MeshBuilder, VertexData, StandardMaterial, Mesh,
  LinesMesh, CreateGround, CreateLines,
} from "@babylonjs/core";
import { createRoofVertexData } from "../../utils/roofGeometry";

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

/* ---------- gable-aware height map + VertexData ---------- */

// distance from point p to segment a→b
function ptSegDist(p, a, b) {
  const ex = b.x - a.x, ey = b.y - a.y;
  const l2 = ex * ex + ey * ey;
  if (l2 < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * ex + (p.y - a.y) * ey) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * ex), p.y - (a.y + t * ey));
}

// eave edges = polygon edges that are NOT gable walls (gables stay vertical)
function eaveEdges(vertices, skeleton) {
  const gables = skeleton?.gables || [];
  const sameEdge = (g, a, b) => {
    const m = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) < 0.05;
    return (m(g.start, a) && m(g.end, b)) || (m(g.start, b) && m(g.end, a));
  };
  const eaves = [];
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const a = vertices[i], b = vertices[(i + 1) % n];
    if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-6) continue;
    if (!gables.some((g) => sameEdge(g, a, b))) eaves.push([a, b]);
  }
  return eaves;
}

// Roof height at a vertex = distance to the nearest eave × slope. Gable-wall
// vertices end up raised (their nearest eave is far), giving a vertical gable.
function buildHeightMap(skeleton, slopeFactor, vertices) {
  const map = {};
  if (!skeleton?.faces) return map;
  const eaves = eaveEdges(vertices || [], skeleton);
  if (eaves.length === 0) return map;
  const heightAt = (v) => {
    let m = Infinity;
    for (const [a, b] of eaves) { const d = ptSegDist(v, a, b); if (d < m) m = d; }
    return m * slopeFactor;
  };
  for (const face of skeleton.faces) {
    for (const v of face) {
      const key = `${v.x.toFixed(4)},${v.y.toFixed(4)}`;
      if (map[key] === undefined) map[key] = heightAt(v);
    }
  }
  return map;
}

function buildRoofMesh(skeleton, slopeFactor, scene, vertices) {
  if (!skeleton?.faces || skeleton.faces.length === 0) return null;

  const heightMap = buildHeightMap(skeleton, slopeFactor, vertices);
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

  const slopeFactor = slope ? slope / 100 : 0.4;

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

    // -- Build roof geometry (GPU mesh from our gable-aware skeleton) ----
    if (skeleton && vertices?.length >= 3) {
      const roof = buildRoofMesh(skeleton, slopeFactor, scene, vertices);
      if (roof) meshesRef.current.push(roof);

      // Skeleton lines (ridges/hips/valleys) lifted to their 3D heights
      const heightMap = buildHeightMap(skeleton, slopeFactor, vertices);
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
  }, [vertices, skeleton, slopeFactor]);

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
      </div>

      <canvas ref={canvasRef} className="w-full h-[400px] rounded-2xl" style={{ height: "400px" }} />
    </div>
  );
}
