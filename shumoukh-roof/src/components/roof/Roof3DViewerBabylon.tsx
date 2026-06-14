// @ts-nocheck
import { useEffect, useRef, useCallback } from "react";
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, ShadowGenerator,
  Vector3, Color3, Color4, Texture,
  MeshBuilder, VertexData, StandardMaterial, Mesh,
  LinesMesh, CreateGround, CreateLines,
} from "@babylonjs/core";
import { createRoofVertexData } from "../../utils/roofGeometry";
import { generateTileTextures } from "../../utils/tileTextures";

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

function buildRoofMesh(skeleton, slopeFactor, scene, vertices, tile) {
  if (!skeleton?.faces || skeleton.faces.length === 0) return null;

  // Tile texture: one texture cell ≈ one tile; repeat every `texRepeat` metres so
  // the courses scale with the chosen tile density (tile.count = tiles per m²).
  const count = tile?.count > 0 ? tile.count : 12;
  const colorHex = tile?.color || tile?.colorHex || tile?.hex || null;
  const texRepeat = Math.max(0.8, 4 / Math.sqrt(count)); // ~4 tiles per repeat
  const { texture } = generateTileTextures(count, scene, colorHex);
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;

  // UVs are world-distance / spacing, so pass texRepeat as spacing → 1 repeat / texRepeat m.
  const heightMap = buildHeightMap(skeleton, slopeFactor, vertices);
  const vd = createRoofVertexData(skeleton, heightMap, texRepeat);
  if (!vd.positions || vd.positions.length === 0) return null;

  const mesh = new Mesh("roof", scene);
  vd.applyToMesh(mesh);

  const mat = new StandardMaterial("roofMat", scene);
  mat.diffuseTexture = texture;
  mat.diffuseColor = new Color3(1, 1, 1);
  mat.specularColor = new Color3(0.08, 0.08, 0.08);
  mat.specularPower = 64;
  mat.backFaceCulling = false; // roof underside visible from low angles
  mesh.material = mat;
  mesh.receiveShadows = true;

  return mesh;
}

// Vertical gable walls: fill the triangular/trapezoidal gap under each gable
// edge (from the ground up to the raised roof edge), so a gabled end reads as a
// solid wall instead of an open hole.
function buildGableWalls(skeleton, heightMap, scene) {
  const gables = skeleton?.gables || [];
  if (!gables.length) return null;
  const positions = [], indices = [], normals = [];
  let base = 0;
  const hOf = (p) => heightMap[`${p.x.toFixed(4)},${p.y.toFixed(4)}`] || 0;
  for (const g of gables) {
    const a = g.start, b = g.end;
    const ha = hOf(a), hb = hOf(b);
    if (ha < 0.01 && hb < 0.01) continue;
    // quad: A0, B0, Btop, Atop  (Babylon: x, y=height, z=planY)
    positions.push(a.x, 0, a.y,  b.x, 0, b.y,  b.x, hb, b.y,  a.x, ha, a.y);
    indices.push(base, base + 1, base + 2,  base, base + 2, base + 3);
    indices.push(base, base + 2, base + 1,  base, base + 3, base + 2); // back face
    for (let i = 0; i < 4; i++) normals.push(0, 0, 0);
    base += 4;
  }
  if (!positions.length) return null;
  VertexData.ComputeNormals(positions, indices, normals);
  const vd = new VertexData();
  vd.positions = positions; vd.indices = indices; vd.normals = normals;
  const mesh = new Mesh("gableWalls", scene);
  vd.applyToMesh(mesh);
  const mat = new StandardMaterial("gableMat", scene);
  mat.diffuseColor = new Color3(0.92, 0.90, 0.86);
  mat.specularColor = new Color3(0.03, 0.03, 0.03);
  mat.backFaceCulling = false;
  mesh.material = mat;
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

    // Soft ambient fill (sky/ground) so shadowed faces are never pure black.
    const hemi = new HemisphericLight("ambient", new Vector3(0.2, 1, 0.1), scene);
    hemi.intensity = 0.55;
    hemi.diffuse = new Color3(1, 0.98, 0.95);
    hemi.groundColor = new Color3(0.35, 0.33, 0.3);

    // Key sun: a directional light that drives shading + shadows.
    const sun = new DirectionalLight("sun", new Vector3(-0.6, -1, -0.45), scene);
    sun.position = new Vector3(18, 30, 14);
    sun.intensity = 1.15;
    sun.diffuse = new Color3(1, 0.96, 0.88);

    const shadowGen = new ShadowGenerator(1024, sun);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;
    shadowGen.darkness = 0.45;

    const ground = CreateGround("ground", { width: 60, height: 60 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.22, 0.22, 0.26);
    groundMat.specularColor = new Color3(0, 0, 0);
    ground.material = groundMat;
    ground.position.y = -0.02;
    ground.receiveShadows = true;

    // -- Build roof geometry (GPU mesh from our gable-aware skeleton) ----
    if (skeleton && vertices?.length >= 3) {
      const roof = buildRoofMesh(skeleton, slopeFactor, scene, vertices, tile);
      if (roof) {
        meshesRef.current.push(roof);
        roof.receiveShadows = true;
        shadowGen.addShadowCaster(roof);
      }

      // Vertical gable walls (close the gap under gabled ends)
      const heightMap = buildHeightMap(skeleton, slopeFactor, vertices);
      const gableWalls = buildGableWalls(skeleton, heightMap, scene);
      if (gableWalls) {
        meshesRef.current.push(gableWalls);
        gableWalls.receiveShadows = true;
        shadowGen.addShadowCaster(gableWalls);
      }

      // Skeleton lines (ridges/hips/valleys) lifted to their 3D heights
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
  }, [vertices, skeleton, slopeFactor, tile]);

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
