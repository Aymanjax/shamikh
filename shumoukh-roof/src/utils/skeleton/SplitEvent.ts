// @ts-nocheck
import { copy, create, cross, scaleAndAdd, sub } from './vector';
import { assert } from './langUtil';
import MovingNode from './MovingNode';
import SkeletonEvent from './SkeletonEvent';
import SkeletonContext from './SkeletonContext';

export default class SplitEvent extends SkeletonEvent {
  readonly reflexNode: MovingNode;
  readonly op0: MovingNode;
  readonly op1: MovingNode;
  eventPriority = 2;

  constructor(reflexNode: MovingNode, opposite0: MovingNode, opposite1: MovingNode, time: number) {
    super(time);
    this.reflexNode = reflexNode;
    this.op0 = opposite0;
    this.op1 = opposite1;
    assert(reflexNode != opposite0);
    assert(reflexNode != opposite1);
    assert(opposite0 != opposite1);
    assert(opposite0.next == opposite1);
  }

  static calcTime(reflexNode: MovingNode, edgeStart: MovingNode, distanceSign: number) {
    const bisectorSpeed = cross(reflexNode.bisector, edgeStart.edgeDir);
    const edgeSpeed = -distanceSign;
    const approachSpeed = bisectorSpeed + edgeSpeed;

    const reflexRelative = sub(create(), reflexNode.skelNode.p, edgeStart.skelNode.p);
    const sideDistance = cross(reflexRelative, edgeStart.edgeDir);
    if (sideDistance == 0) return SplitEvent.canHit(reflexNode, edgeStart, distanceSign, 0);

    if (SplitEvent.correctSpeed(approachSpeed, sideDistance) <= 0) return this.INVALID_TIME;
    const time = -sideDistance / approachSpeed;
    return SplitEvent.canHit(reflexNode, edgeStart, distanceSign, time);
  }

  private static correctSpeed(approachSpeed: number, sideDistance: number) {
    return sideDistance > 0 ? -approachSpeed : approachSpeed;
  }

  private static canHit(reflexNode: MovingNode, edgeStart: MovingNode, distanceSign: number, time: number) {
    if (time >= edgeStart.edgeCollapseTime) return this.INVALID_TIME;

    const reflexFuture = scaleAndAdd(create(), reflexNode.skelNode.p, reflexNode.bisector, time);
    const reflexRelative = sub(create(), reflexFuture, edgeStart.skelNode.p);
    const side0 = cross(edgeStart.bisector, reflexRelative);
    if (side0 * distanceSign < 0) return this.INVALID_TIME;

    const edgeEnd = edgeStart.next!;
    sub(reflexRelative, reflexFuture, edgeEnd.skelNode.p);
    const side1 = cross(edgeEnd.bisector, reflexRelative);
    if (side1 * distanceSign > 0) return this.INVALID_TIME;

    return time;
  }

  onEventQueued() {
    this.reflexNode.addEvent(this);
    this.op0.addEvent(this);
    this.op1.addEvent(this);
  }

  onEventAborted(adjacentNode: MovingNode, ctx: SkeletonContext) {
    ctx.addAbortedReflex(this.reflexNode);
    if (adjacentNode == this.reflexNode) {
      this.op0.removeEvent(this); this.op1.removeEvent(this);
    } else if (adjacentNode == this.op0) {
      this.reflexNode.removeEvent(this); this.op1.removeEvent(this);
    } else {
      assert(adjacentNode == this.op1);
      this.reflexNode.removeEvent(this); this.op0.removeEvent(this);
    }
  }

  onEventAborted2(edgeNode0: MovingNode, edgeNode1: MovingNode, ctx: SkeletonContext) {
    ctx.addAbortedReflex(this.reflexNode);
    this.reflexNode.removeEvent(this);
  }

  handle(ctx: SkeletonContext) {
    assert(this.op0.next == this.op1);
    ctx.abortEvents2(this.op0, this.op1);

    this.reflexNode.skelNode.setReflex();
    const node0 = this.reflexNode;
    const reflexNext = this.reflexNode.next!;
    const reflexPrev = this.reflexNode.prev!;
    const op0 = this.op0;
    const op1 = this.op1;

    const node1 = ctx.createMovingNode(this.reflexNode.id + '+');
    node1.skelNode = node0.skelNode;

    assert(node0.next == reflexNext);
    assert(reflexNext.prev == node0);

    node0.prev = op0;
    op0.next = node0;

    node1.next = op1;
    op1.prev = node1;
    node1.prev = reflexPrev;
    reflexPrev.next = node1;
    // node1 owns the second half of the split edge op0→op1; inherit its gable flag.
    node1.edgeIsGable = op0.edgeIsGable;

    SkeletonEvent.handle(node0, ctx);
    SkeletonEvent.handle(node1, ctx);
  }

  toString() {
    return 'SplitEvent{' + this.reflexNode.id + ' => ' + this.op0.id + '-' + this.op1.id + '} in ' + this.time;
  }
}
