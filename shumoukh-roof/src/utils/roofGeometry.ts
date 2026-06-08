// @ts-nocheck
import { VertexData } from '@babylonjs/core';
import earcut from 'earcut';

const EPS = 1e-6;
const EPS2 = 1e-8;

function signedArea2D(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    s += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return s / 2;
}

function computeFaceNormal(v0, v1, v2) {
  const ax = v1.x - v0.x, ay = v1.y - v0.y, az = v1.z - v0.z;
  const bx = v2.x - v0.x, by = v2.y - v0.y, bz = v2.z - v0.z;
  let nx = ay * bz - az * by;
  let ny = az * bx - ax * bz;
  let nz = ax * by - ay * bx;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len < EPS2) return { x: 0, y: 1, z: 0 };
  nx /= len; ny /= len; nz /= len;
  if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
  return { x: nx, y: ny, z: nz };
}

function cleanFace(face) {
  if (face.length < 3) return [];
  const out = [face[0]];
  for (let i = 1; i < face.length; i++) {
    const prev = out[out.length - 1];
    const dx = face[i].x - prev.x;
    const dy = face[i].y - prev.y;
    if (dx * dx + dy * dy > EPS) out.push(face[i]);
  }
  if (out.length >= 2) {
    const f = out[0], l = out[out.length - 1];
    const dx = f.x - l.x, dy = f.y - l.y;
    if (dx * dx + dy * dy < EPS) out.pop();
  }
  if (signedArea2D(out) < 0) out.reverse();
  return out.length >= 3 ? out : [];
}

export function createRoofVertexData(skeleton, heightMap, spacing = 1.0) {
  const verts = [];
  const norms = [];
  const faceUvs = [];
  const allIndices = [];
  const keyToIdx = new Map();
  let vidx = 0;

  if (!skeleton?.faces) {
    const vd = new VertexData();
    vd.positions = [];
    vd.normals = [];
    vd.uvs = [];
    vd.indices = [];
    return vd;
  }

  for (const rawFace of skeleton.faces) {
    if (rawFace.length < 3) continue;
    const face = cleanFace(rawFace);
    if (face.length < 3) continue;

    const verts3D = face.map(v => {
      const key = `${v.x.toFixed(4)},${v.y.toFixed(4)}`;
      return { x: v.x, y: heightMap[key] ?? 0, z: v.y };
    });

    const faceNorm = computeFaceNormal(verts3D[0], verts3D[1], verts3D[2]);
    if (faceNorm.y < EPS) continue;

    const slopeXZLen = Math.sqrt(faceNorm.x * faceNorm.x + faceNorm.z * faceNorm.z);
    let slopeDirX, slopeDirZ;
    let perpDirX, perpDirZ;
    if (slopeXZLen > EPS2) {
      slopeDirX = -faceNorm.x / slopeXZLen;
      slopeDirZ = -faceNorm.z / slopeXZLen;
      perpDirX = -slopeDirZ;
      perpDirZ = slopeDirX;
    } else {
      slopeDirX = 0;
      slopeDirZ = 1;
      perpDirX = 1;
      perpDirZ = 0;
    }

    let originX = verts3D[0].x, originZ = verts3D[0].z;

    const faceLocalToGlobal = [];
    for (const v of verts3D) {
      const k = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
      const u = ((v.x - originX) * perpDirX + (v.z - originZ) * perpDirZ) / spacing;
      const vCoord = ((v.x - originX) * slopeDirX + (v.z - originZ) * slopeDirZ) / spacing;
      if (keyToIdx.has(k)) {
        faceLocalToGlobal.push(keyToIdx.get(k));
      } else {
        keyToIdx.set(k, vidx);
        faceLocalToGlobal.push(vidx);
        verts.push(v.x, v.y, v.z);
        norms.push(faceNorm.x, faceNorm.y, faceNorm.z);
        faceUvs.push(u, vCoord);
        vidx++;
      }
    }

    const coords2D = [];
    for (const v of face) {
      coords2D.push(v.x, v.y);
    }

    const triangles = earcut(coords2D, null, 2);

    for (let i = 0; i < triangles.length; i += 3) {
      const i0 = triangles[i];
      const i1 = triangles[i + 1];
      const i2 = triangles[i + 2];

      const v0 = verts3D[i0], v1 = verts3D[i1], v2 = verts3D[i2];
      const ex = v1.x - v0.x, ey = v1.y - v0.y, ez = v1.z - v0.z;
      const fx = v2.x - v0.x, fy = v2.y - v0.y, fz = v2.z - v0.z;
      const cx = ey * fz - ez * fy;
      const cy = ez * fx - ex * fz;
      const cz = ex * fy - ey * fx;
      const triArea = Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (triArea < EPS2) continue;

      const gi0 = faceLocalToGlobal[i0];
      const gi1 = faceLocalToGlobal[i1];
      const gi2 = faceLocalToGlobal[i2];

      const inv = 1 / triArea;
      const tny = cy * inv;

      if (tny * faceNorm.y < 0) {
        allIndices.push(gi0, gi2, gi1);
      } else {
        allIndices.push(gi0, gi1, gi2);
      }
    }
  }

  const vertexData = new VertexData();
  vertexData.positions = new Float32Array(verts);
  vertexData.normals = new Float32Array(norms);
  vertexData.uvs = new Float32Array(faceUvs);
  vertexData.indices = new Int32Array(allIndices);
  return vertexData;
}
