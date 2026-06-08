// @ts-nocheck
/**
 * OCCT → Babylon.js Mesh Bridge
 *
 * Tessellates an OCCT TopoDS_Shape and produces a Babylon.js Mesh
 * (VertexData with positions, normals, indices).
 */

import { getOCCT } from "./occtEngine";
import { VertexData, Mesh } from "@babylonjs/core";

/**
 * Build babylon positions / normals / indices arrays from an OCCT shape.
 * Uses BRepMesh_IncrementalMesh for triangulation.
 */
function tessellateShape(shape) {
  const oc = getOCCT();
  const { BRepMesh_IncrementalMesh, Poly_Triangulation, TopExp_Explorer, TopAbs } = oc;

  const positions = [];
  const normals = [];
  const indices = [];

  // -- tessellate the shape with a 0.1 mm deflection ------------------
  const meshAlgo = new BRepMesh_IncrementalMesh(shape, 0.1);
  meshAlgo.Perform();
  if (!meshAlgo.IsDone()) {
    throw new Error("BRepMesh_IncrementalMesh failed");
  }

  const explorer = new TopExp_Explorer(shape, TopAbs_FACE);
  while (explorer.More()) {
    const face = oc.TopoDS.Face(explorer.Current());
    explorer.Next();

    const location = face.Location();
    const tri = oc.Poly_Triangulation();
    // BRep_Tool::Triangulation(face, location)
    const triResult = face.Triangulation(location);
    if (triResult.IsNull()) continue;

    const nbNodes = triResult.NbNodes();
    const nbTriangles = triResult.NbTriangles();

    // Nodes — UV + 3D
    const nodes3d = triResult.MapNodeArray();
    const uvNodes = triResult.MapUVNodeArray();
    const triNodes = triResult.MapTriangleArray();

    const baseIdx = positions.length / 3;

    for (let n = 1; n <= nbNodes; n++) {
      const p = nodes3d.Value(n);
      positions.push(p.X(), p.Y(), p.Z());

      // Normal from the face's geometric surface at this UV
      // (simplified: reuse face normal)
    }

    // Compute face normal once (flat shading)
    const props = new oc.BRepGProp_Face(face);
    const gProps = new oc.GProp_GProps();
    props.Add(gProps);
    const centre = gProps.CentreOfMass();
    const norm = face.Normal(centre.X(), centre.Y(), centre.Z());
    const nx = norm.X(), ny = norm.Y(), nz = norm.Z();
    for (let n = 1; n <= nbNodes; n++) {
      normals.push(nx, ny, nz);
    }

    // Triangles
    for (let t = 1; t <= nbTriangles; t++) {
      const tri = triNodes.Value(t);
      // tri.Value(1/2/3) are 1-based node indices
      indices.push(
        baseIdx + tri.Value(1) - 1,
        baseIdx + tri.Value(2) - 1,
        baseIdx + tri.Value(3) - 1,
      );
    }
  }

  return { positions, normals, indices };
}

/**
 * Convert an OCCT shape to a Babylon.js Mesh.
 *
 * @param {*} shape          — OCCT TopoDS_Shape
 * @param {import("@babylonjs/core").Scene} scene — Babylon scene
 * @param {string} [name="occt-roof"] — mesh name
 * @returns {import("@babylonjs/core").Mesh}
 */
export function occtShapeToBabylonMesh(shape, scene, name = "occt-roof") {
  const { positions, normals, indices } = tessellateShape(shape);

  if (positions.length === 0 || indices.length === 0) {
    throw new Error("Tessellation produced no geometry");
  }

  const mesh = new Mesh(name, scene);
  const vd = new VertexData();

  vd.positions = positions;
  vd.normals = normals;
  vd.indices = indices;

  VertexData.ComputeNormals(vd.positions, vd.indices, vd.normals);

  vd.applyToMesh(mesh);

  return mesh;
}

/**
 * Low-level: get raw tessellation arrays for custom use.
 */
export function getOCCTTessellation(shape) {
  return tessellateShape(shape);
}
