import type { Point } from './vector';
import { create } from './vector';
import { assert } from './langUtil';

export const EDGE_TYPE_MAPPING = 1;
export const EDGE_TYPE_DEGENERACY = 2;
export type EdgeType = typeof EDGE_TYPE_MAPPING | typeof EDGE_TYPE_DEGENERACY;

export default class SkeletonNode {
  p: Point = create();
  outgoingEdges: Map<SkeletonNode, EdgeType> = new Map();
  incomingEdges: Map<SkeletonNode, EdgeType> = new Map();

  private _reflex = false;

  setReflex() { this._reflex = true; }
  isReflex() { return this._reflex; }

  addEdge(target: SkeletonNode) { this._addEdge(target, EDGE_TYPE_MAPPING); }

  addDegenerationEdge(target: SkeletonNode) {
    this._addEdge(target, EDGE_TYPE_DEGENERACY);
  }

  private _addEdge(target: SkeletonNode, type: EdgeType) {
    this.outgoingEdges.set(target, type);
    target.incomingEdges.set(this, type);
  }

  remapIncoming(newTarget: SkeletonNode) {
    assert(this.outgoingEdges.size === 0);
    this.incomingEdges.forEach((edgeType, node) => {
      node.outgoingEdges.delete(this);
      node._addEdge(newTarget, edgeType);
    });
    this.incomingEdges.clear();
  }

  followGraphInward(storeTargets: SkeletonNode[]) {
    let leaf = true;
    this.outgoingEdges.forEach((edgeType, node) => {
      if (edgeType === EDGE_TYPE_MAPPING) {
        node.followGraphInward(storeTargets);
        leaf = false;
      }
    });
    if (leaf) storeTargets.push(this);
  }
}
