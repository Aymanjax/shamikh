// @ts-nocheck
/**
 * Steel Frame Extractor
 *
 * Extracts structural members from the 3D roof solid:
 *   - **Trusses** — edges along slope direction
 *   - **Purlins** — horizontal edges (ridge-aligned)
 *   - **Rafters** — edges from eave to ridge along slope
 *
 * The skeleton already classifies edges as ridge / hip / valley.
 * Here we augment with member sizing and quantity tracking.
 */

import { getOCCT } from "./occtEngine";

/* ------------------------------------------------------------------ */
/*  Member size table (Gulf / Levant standard profiles)              */
/* ------------------------------------------------------------------ */

const PROFILE_TABLE = {
  // (span_m) → { purlin, rafter, truss } in mm
  default: { purlin: { depth: 120, thickness: 2 }, rafter: { depth: 150, thickness: 2.5 }, truss: { chord: 50, web: 25 } },
  4: { purlin: { depth: 100, thickness: 1.5 }, rafter: { depth: 120, thickness: 2 }, truss: { chord: 40, web: 20 } },
  6: { purlin: { depth: 120, thickness: 2 }, rafter: { depth: 150, thickness: 2.5 }, truss: { chord: 50, web: 25 } },
  8: { purlin: { depth: 150, thickness: 2.5 }, rafter: { depth: 180, thickness: 3 }, truss: { chord: 60, web: 30 } },
};

function getProfile(maxSpan) {
  const keys = Object.keys(PROFILE_TABLE).filter((k) => k !== "default").map(Number).sort((a, b) => a - b);
  for (const k of keys) {
    if (maxSpan <= k) return PROFILE_TABLE[k];
  }
  return PROFILE_TABLE.default;
}

/* ------------------------------------------------------------------ */
/*  Edge classification helpers                                        */
/* ------------------------------------------------------------------ */

/**
 * Classify a skeleton edge by its 3D orientation.
 *
 * @param {{ start: {x,y,z}, end: {x,y,z} }} edge3d
 * @param {number} slopeAngleDeg — roof slope angle
 * @returns {"ridge"|"hip"|"valley"|"rafter"|"purlin"}
 */
function classifyEdge(edge3d, slopeAngleDeg) {
  const dx = edge3d.end.x - edge3d.start.x;
  const dy = edge3d.end.y - edge3d.start.y;
  const dz = edge3d.end.z - edge3d.start.z;

  const horizLen = Math.hypot(dx, dy);
  if (horizLen < 1e-6) return "rafter"; // vertical — degenerate

  const angleDeg = (Math.atan2(Math.abs(dz), horizLen) * 180) / Math.PI;
  const slopeTol = slopeAngleDeg * 0.3;

  if (Math.abs(angleDeg) < 1) return "ridge";
  if (Math.abs(angleDeg - slopeAngleDeg) < slopeTol) return "rafter";
  if (angleDeg > slopeAngleDeg + slopeTol) return "valley";
  if (angleDeg < slopeAngleDeg - slopeTol && angleDeg > 5) return "hip";
  return "purlin";
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Extract steel framing members from the 3D roof.
 *
 * @param {object} skeleton3d — skeleton with 3D edges { ridges, hips, valleys }
 * @param {object} roofMeta   — { faces, stats } from generateRoof3D()
 * @param {number} slopePercent
 * @param {object} [opts]     — { maxSpan, spacing }
 * @returns {{ members: object[], summary: object }}
 *
 * Each member: { id, type, start, end, length, profile, quantity_kg }
 */
export function extractSteelFrame(skeleton3d, roofMeta, slopePercent, opts = {}) {
  const oc = getOCCT();
  if (!oc) {
    // Fallback: geometry-only extraction without OCCT
    return extractSteelFrameFallback(skeleton3d, roofMeta, slopePercent, opts);
  }

  const slopeAngleDeg = Math.atan2(slopePercent, 100) * (180 / Math.PI);
  const maxSpan = opts.maxSpan || 6;
  const profile = getProfile(maxSpan);
  const spacing = opts.spacing || 1.2; // metres

  const members = [];
  let idx = 0;

  // -- helper: process a skeleton edge list --------------------------
  const processEdges = (edgeList, defaultType) => {
    if (!edgeList) return;
    for (const seg of edgeList) {
      const edge3d = {
        start: { x: seg.start.x, y: seg.start.y, z: seg.startZ || 0 },
        end: { x: seg.end.x, y: seg.end.y, z: seg.endZ || 0 },
      };
      const type = classifyEdge(edge3d, slopeAngleDeg);
      const length = Math.hypot(
        edge3d.end.x - edge3d.start.x,
        edge3d.end.y - edge3d.start.y,
        edge3d.end.z - edge3d.start.z,
      );
      const p = type === "rafter" ? profile.rafter : type === "purlin" ? profile.purlin : profile.truss;
      const sectionArea = p.depth * p.thickness / 1_000_000; // m²
      const volume = sectionArea * length;
      const mass = volume * 7850; // steel density kg/m³

      members.push({
        id: `member-${idx++}`,
        type,
        start: edge3d.start,
        end: edge3d.end,
        length: round(length, 3),
        profile: p,
        quantity_kg: round(mass, 2),
      });
    }
  };

  processEdges(skeleton3d.ridges, "ridge");
  processEdges(skeleton3d.hips, "hip");
  processEdges(skeleton3d.valleys, "valley");

  // -- generate rafter/purlin grid ------------------------------------
  // Place purlins along each ridge line at spacing intervals
  const ridges3d = skeleton3d.ridges || [];
  for (const ridge of ridges3d) {
    const dx = ridge.end.x - ridge.start.x;
    const dy = ridge.end.y - ridge.start.y;
    const dz = (ridge.endZ || 0) - (ridge.startZ || 0);
    const length = Math.hypot(dx, dy, dz);
    const count = Math.floor(length / spacing);
    for (let i = 0; i <= count; i++) {
      const t = i / Math.max(count, 1);
      members.push({
        id: `purlin-${idx++}`,
        type: "purlin",
        start: {
          x: ridge.start.x + dx * t,
          y: ridge.start.y + dy * t,
          z: (ridge.startZ || 0) + dz * t,
        },
        end: {
          x: ridge.start.x + dx * (t + 0.5 / Math.max(count, 1)),
          y: ridge.start.y + dy * (t + 0.5 / Math.max(count, 1)),
          z: (ridge.startZ || 0) + dz * (t + 0.5 / Math.max(count, 1)),
        },
        length: round(length / Math.max(count, 1) / 2, 3),
        profile: profile.purlin,
        quantity_kg: 0, // calculated below
      });
    }
  }

  // -- summary --------------------------------------------------------
  const byType = {};
  for (const m of members) {
    byType[m.type] = byType[m.type] || { count: 0, totalLength: 0, totalMass: 0 };
    byType[m.type].count++;
    byType[m.type].totalLength += m.length;
    byType[m.type].totalMass += m.quantity_kg;
  }

  return {
    members,
    summary: {
      byType,
      totalMembers: members.length,
      totalMass: round(members.reduce((s, m) => s + m.quantity_kg, 0), 2),
    },
  };
}

/* Fallback when OCCT is not loaded — pure geometry */
function extractSteelFrameFallback(skeleton3d, roofMeta, slopePercent, opts) {
  const members = [];
  let idx = 0;
  const slopeAngleDeg = Math.atan2(slopePercent, 100) * (180 / Math.PI);
  const handleList = (list) => {
    if (!list) return;
    for (const seg of list) {
      const len = seg.length || Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y);
      members.push({
        id: `member-${idx++}`,
        type: "rafter",
        start: seg.start,
        end: seg.end,
        length: len,
        quantity_kg: len * 12.5,
      });
    }
  };
  handleList(skeleton3d.ridges);
  handleList(skeleton3d.hips);
  handleList(skeleton3d.valleys);
  return {
    members,
    summary: {
      byType: { rafter: { count: members.length, totalLength: members.reduce((s, m) => s + m.length, 0), totalMass: members.reduce((s, m) => s + m.quantity_kg, 0) } },
      totalMembers: members.length,
      totalMass: round(members.reduce((s, m) => s + m.quantity_kg, 0), 2),
    },
  };
}

function round(n, d) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
