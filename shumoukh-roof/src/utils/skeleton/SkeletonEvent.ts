// @ts-nocheck
import { distSquare } from './vector';
import { assert } from './langUtil';
import type MovingNode from './MovingNode';
import type SkeletonContext from './SkeletonContext';
import type SplitEvent from './SplitEvent';

export default class SkeletonEvent {
  public static INVALID_TIME = NaN;
  public readonly time: number;
  protected eventPriority = 0;

  constructor(time: number) { this.time = time; }

  compareTo(other: SkeletonEvent) {
    if (this.time === other.time) return this.eventPriority - other.eventPriority;
    return this.time - other.time;
  }

  onEventQueued() {}
  onEventAborted(adjacentNode: MovingNode, ctx: SkeletonContext) {}
  onEventAborted2(edgeNode0: MovingNode, edgeNode1: MovingNode, ctx?: SkeletonContext) {}
  handle(ctx: SkeletonContext) {}

  protected static handle(node: MovingNode, ctx: SkeletonContext) {
    while (SkeletonEvent.ensureValidPolygon(node, ctx)) {
      const validBisector = node.calcBisector(ctx);
      if (validBisector) {
        node.leaveSkeletonNode();
        node.updateEdge();
        node.prev!.updateEdge();
        SkeletonEvent.createEvents(node, ctx);
        return;
      }
      node = SkeletonEvent.handleDegenerateAngle(node, ctx);
    }
  }

  static handleInit(node: MovingNode, ctx: SkeletonContext) {
    while (SkeletonEvent.ensureValidPolygon(node, ctx)) {
      const validBisector = node.calcBisector(ctx);
      if (validBisector) return;
      node = SkeletonEvent.handleDegenerateAngle(node, ctx);
    }
  }

  private static ensureValidPolygon(node: MovingNode, ctx: SkeletonContext) {
    const next = node.next!;
    assert(next != node);
    if (next != node.prev) return true;
    node.skelNode.addDegenerationEdge(next.skelNode);
    ctx.removeMovingNode(node);
    ctx.removeMovingNode(next);
    return false;
  }

  static createEvents(node: MovingNode, ctx: SkeletonContext) {
    ctx.abortEvents(node);
    ctx.tryQueueEdgeEvent(node, node.next!);
    ctx.tryQueueEdgeEvent(node.prev!, node);
    SkeletonEvent.createAllSplitEvents(node, ctx);
  }

  private static createAllSplitEvents(node: MovingNode, ctx: SkeletonContext) {
    let current = node.next!.next!;
    const end = node.prev!.prev!;
    if (current == end.next || current == end) return;

    const nodeIsReflex = node.isReflex();
    let nearestSplit: SplitEvent | null | undefined;

    if (current.isReflex()) ctx.tryQueueSplitEvent(current, node.prev!, node);
    if (nodeIsReflex) nearestSplit = ctx.tryReplaceNearestSplitEvent(node, current, current.next!, nearestSplit);

    const nodes = ctx.getNodes();
    nodes.forEach((c) => {
      if (c == node || c.next == node || c.prev == node) return;
      if (c.isReflex()) {
        ctx.tryQueueSplitEvent(c, node, node.next!);
        ctx.tryQueueSplitEvent(c, node.prev!, node);
      }
      if (nodeIsReflex) nearestSplit = ctx.tryReplaceNearestSplitEvent(node, c, c.next!, nearestSplit);
    });

    if (current.isReflex()) ctx.tryQueueSplitEvent(current, node, node.next!);
    if (nearestSplit != null) ctx.enqueue(nearestSplit);
  }

  static createSplitEvents(reflexNode: MovingNode, ctx: SkeletonContext) {
    let nearestSplit: SplitEvent | null | undefined;
    const nodes = ctx.getNodes();
    nodes.forEach((current) => {
      if (current == reflexNode || current.next == reflexNode || current.prev == reflexNode) return;
      nearestSplit = ctx.tryReplaceNearestSplitEvent(reflexNode, current, current.next!, nearestSplit);
    });
    if (nearestSplit != null) ctx.enqueue(nearestSplit);
  }

  private static handleDegenerateAngle(node: MovingNode, ctx: SkeletonContext) {
    const o1 = node.prev!;
    const o2 = node.next!;
    assert(o1.next == node);
    assert(o2.prev == node);
    o1.next = o2;
    o2.prev = o1;
    // o1 now owns the edge node→o2 that the degenerate node used to own.
    o1.edgeIsGable = node.edgeIsGable;

    const connectionTarget = distSquare(node.skelNode.p, o1.skelNode.p) < distSquare(node.skelNode.p, o2.skelNode.p) ? o1 : o2;
    node.skelNode.addDegenerationEdge(connectionTarget.skelNode);
    ctx.removeMovingNode(node);
    return connectionTarget;
  }
}
