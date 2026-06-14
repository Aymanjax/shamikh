import type { Point } from './vector';
import { dist, min, max, scaleAndAdd, copy } from './vector';
import MovingNode from './MovingNode';
import SkeletonContext from './SkeletonContext';
import SkeletonEvent from './SkeletonEvent';
import SkeletonNode from './SkeletonNode';

export default class StraightSkeleton {
  private offsetDistance = Infinity;
  private distanceSign = -1.0;
  private initialNodes: SkeletonNode[] = [];
  private _ctx = new SkeletonContext();

  getCtx() { return this._ctx; }
  getInitialNodes() { return this.initialNodes; }

  setDistance(distance: number) {
    if (distance === Infinity) throw 'Cannot scale outwards to infinity.';
    this.distanceSign = distance > 0 ? 1 : -1;
    this.offsetDistance = Math.abs(distance);
  }

  setEpsilon(epsilon: number) { this._ctx.setEpsilon(epsilon); }

  execute(contour: Point[], holes: Point[][] = [], gableFlags: boolean[] = []) {
    this._ctx.reset(this.offsetDistance, this.distanceSign);
    this.initialNodes = [];
    const diagonalSize = this._createNodes(contour, gableFlags);
    holes.forEach((hole) => { this._createNodes(hole); });
    if (this.distanceSign < 0 && this.offsetDistance === Infinity) this._ctx.distance = diagonalSize * 0.51;
    if (this._ctx.distance !== 0) {
      this.initBisectors();
      this.initEvents();
      this.loop();
    }
  }

  private loop() {
    this._ctx.time = 0;
    for (;;) { if (this._eachLoop()) break; }
  }

  private _eachLoop() {
    const ctx = this._ctx;
    const event = ctx.pollQueue();
    if (event == null) { this.scale(ctx.distance - ctx.time); return true; }
    this.scale(event.time - ctx.time);
    ctx.time = event.time;
    event.handle(ctx);
    ctx.recheckAbortedReflexNodes();
    return false;
  }

  private _createNodes(vertices: Point[], gableFlags: boolean[] = []) {
    const minPt: Point = [Infinity, Infinity];
    const maxPt: Point = [-Infinity, -Infinity];
    const first = this._createNode(vertices[0], minPt, maxPt);
    first.edgeIsGable = gableFlags[0] === true;
    let last = first;
    for (let i = 1; i < vertices.length; i++) {
      const movingNode = this._createNode(vertices[i], minPt, maxPt);
      movingNode.edgeIsGable = gableFlags[i] === true;
      movingNode.prev = last;
      last.next = movingNode;
      last = movingNode;
    }
    first.prev = last;
    last.next = first;
    return dist(maxPt, minPt);
  }

  private _createNode(vertex: Point, minPt: Point, maxPt: Point) {
    min(minPt, minPt, vertex);
    max(maxPt, maxPt, vertex);
    const initialNode = new SkeletonNode();
    copy(initialNode.p, vertex);
    this.initialNodes.push(initialNode);
    const movingNode = this._ctx.createMovingNode();
    movingNode.skelNode = initialNode;
    return movingNode;
  }

  private initBisectors() {
    const degenerates: MovingNode[] = [];
    this._ctx.getNodes().forEach((node) => {
      if (!node.calcBisector(this._ctx, true)) degenerates.push(node);
    });
    degenerates.forEach((dn) => {
      if (dn.next != null) SkeletonEvent.handleInit(dn, this._ctx);
    });
  }

  private initEvents() {
    const reflexNodes: MovingNode[] = [];
    this._ctx.getNodes().forEach((current) => {
      current.leaveSkeletonNode();
      current.updateEdge();
      this._ctx.tryQueueEdgeEvent(current, current.next!);
      if (current.isReflex()) reflexNodes.push(current);
    });
    reflexNodes.forEach((reflex) => { SkeletonEvent.createSplitEvents(reflex, this._ctx); });
  }

  private scale(dist: number) {
    if (dist === 0) return;
    this._ctx.getNodes().forEach((node) => {
      scaleAndAdd(node.skelNode.p, node.skelNode.p, node.bisector, dist);
    });
  }

  getEndNodes() {
    const skelNodes: SkeletonNode[] = [];
    this._ctx.getNodes().forEach((movingNode) => { skelNodes.push(movingNode.skelNode); });
    return skelNodes;
  }

  getNodeLoops() {
    const nodesArr = Array.from(this._ctx.getNodes());
    const nodeLoops: SkeletonNode[][] = [];
    const visited = new Set<MovingNode>();
    for (const start of nodesArr) {
      if (visited.has(start)) continue;
      const loop: SkeletonNode[] = [];
      let cur: MovingNode | undefined = start;
      while (cur && !visited.has(cur)) {
        loop.push(cur.skelNode);
        visited.add(cur);
        cur = cur.next ?? undefined;
      }
      if (loop.length > 0) nodeLoops.push(loop);
    }
    return nodeLoops;
  }
}
