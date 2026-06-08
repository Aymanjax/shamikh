// @ts-nocheck
import { assert } from './langUtil';
import MovingNode from './MovingNode';
import SkeletonContext from './SkeletonContext';
import SkeletonEvent from './SkeletonEvent';

export class EdgeEvent extends SkeletonEvent {
  readonly n0: MovingNode;
  readonly n1: MovingNode;
  eventPriority = 1;

  constructor(n0: MovingNode, n1: MovingNode, time: number) {
    super(time);
    this.n0 = n0;
    this.n1 = n1;
    assert(n0 != n1);
    assert(n0.next == n1);
  }

  onEventQueued() {
    this.n0.addEvent(this);
    this.n1.addEvent(this);
  }

  onEventAborted(adjacentNode: MovingNode, ctx: SkeletonContext) {
    if (adjacentNode == this.n0) this.n1.removeEvent(this);
    else this.n0.removeEvent(this);
  }

  handle(ctx: SkeletonContext) {
    const n0 = this.n0;
    const n1 = this.n1;
    assert(n0.next == n1);

    const next = n1.next!;
    n0.next = next;
    next.prev = n0;

    if (n0.isReflex() || n1.isReflex()) n0.skelNode.setReflex();
    n1.skelNode.remapIncoming(n0.skelNode);
    ctx.removeMovingNode(n1);

    SkeletonEvent.handle(n0, ctx);
  }

  toString() {
    return 'EdgeEvent{' + this.n0.id + '-' + this.n1.id + '} in ' + this.time;
  }
}
