import { useState, useEffect, useRef } from "react";
import { computeRoofSkeleton } from "../utils/roofSkeleton";

export interface UseRoofSkeletonResult {
  skeleton: { ridges: any[]; hips: any[]; valleys: any[]; gables: any[]; faces: any[] };
  faces: number[][] | null;
  vertices3D: { x: number; y: number; z: number }[] | null;
  edgeLengths: { ridges: number; hips: number; valleys: number; gables: number; totalTarabeesh: number } | null;
  isBp: boolean;
  isLoading: boolean;
}

export function useRoofSkeleton(
  vertices: { x: number; y: number }[],
  _sides: { isActive: boolean; length: number }[],
  slopePercent: number
): UseRoofSkeletonResult {
  const [result, setResult] = useState<UseRoofSkeletonResult>({
    skeleton: { ridges: [], hips: [], valleys: [], gables: [], faces: [] },
    faces: null,
    vertices3D: null,
    edgeLengths: null,
    isBp: false,
    isLoading: true,
  });
  const pendingRef = useRef(0);

  useEffect(() => {
    if (vertices.length < 3) {
      setResult({
        skeleton: { ridges: [], hips: [], valleys: [], gables: [], faces: [] },
        faces: null,
        vertices3D: null,
        edgeLengths: null,
        isBp: false,
        isLoading: false,
      });
      return;
    }

    const id = ++pendingRef.current;

    setResult((prev) => ({ ...prev, isLoading: true }));

    try {
      const data = computeRoofSkeleton(vertices, slopePercent, _sides);
      if (id !== pendingRef.current) return;

      const totalHip = data.hips.reduce((s: number, e: any) => s + e.length, 0);
      const totalValley = data.valleys.reduce((s: number, e: any) => s + e.length, 0);
      const totalRidge = data.ridges.reduce((s: number, e: any) => s + e.length, 0);

      // Apply slope factor to convert 2D projected lengths → 3D sloped lengths
      // Only hips and valleys are sloped; ridges are horizontal
      const s = slopePercent / 100;
      const slopeFactor = Math.sqrt(1 + s * s);
      const totalHip3D = totalHip * slopeFactor;
      const totalValley3D = totalValley * slopeFactor;

      setResult({
        skeleton: {
          ridges: data.ridges || [],
          hips: data.hips || [],
          valleys: data.valleys || [],
          gables: data.gables || [],
          faces: data.faces || [],
        },
        faces: data.faces || null,
        vertices3D: ((data as any).vertices3D || []).map((v: any) => ({ ...v, z: 0 })),
        edgeLengths: {
          ridges: totalRidge,
          hips: totalHip3D,
          valleys: totalValley3D,
          gables: 0,
          totalTarabeesh: totalRidge + totalHip3D + totalValley3D,
        },
        isBp: true,
        isLoading: false,
      });
    } catch {
      if (id !== pendingRef.current) return;
      setResult({
        skeleton: { ridges: [], hips: [], valleys: [], gables: [], faces: [] },
        faces: null,
        vertices3D: null,
        edgeLengths: null,
        isBp: false,
        isLoading: false,
      });
    }
  }, [vertices, slopePercent]);

  return result;
}
