/** Shape result from generateRoof3D */
export interface Roof3DResult {
  shape: any; // OCCT TopoDS_Shape
  faces: RoofFaceMeta[];
  stats: RoofStats;
}

export interface RoofFaceMeta {
  vertices: { x: number; y: number; z: number }[];
  area: number;
  normal: { x: number; y: number; z: number };
}

export interface RoofStats {
  totalArea: number;
  ridgeLength: number;
  hipLength: number;
  valleyLength: number;
}

/** Steel frame member */
export interface SteelMember {
  id: string;
  type: "ridge" | "hip" | "valley" | "rafter" | "purlin";
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  length: number;
  profile: { depth: number; thickness: number };
  quantity_kg: number;
}

export interface SteelFrameResult {
  members: SteelMember[];
  summary: {
    byType: Record<string, { count: number; totalLength: number; totalMass: number }>;
    totalMembers: number;
    totalMass: number;
  };
}

/** Quantity takeoff */
export interface QuantityResult {
  method: "occt" | "fallback";
  totalSurfaceArea?: number;
  totalEdgeLength?: number;
  totalVolume?: number;
  faceAreas?: number[];
  totalArea?: number;
  ridgeLength?: number;
  hipLength?: number;
  valleyLength?: number;
  edgeCount?: number;
}
