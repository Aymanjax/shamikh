import type { Point } from './vector';
import { create, sub, len, scale, dot, add, normalize, cross, copy } from './vector';
import { assert, removeFromArray } from './langUtil';
import SkeletonNode from './SkeletonNode';
import SkeletonEvent from './SkeletonEvent';
import type SkeletonContext from './SkeletonContext';

export default class MovingNode {
  id: string;
  skelNode!: SkeletonNode;

  next?: MovingNode | null;
  prev?: MovingNode | null;

  edgeDir: Point = create();
  edgeCollapseTime: number = 0;

  bisector: Point = create();
  private _reflex = false;
  private _events: SkeletonEvent[] = [];

  constructor(id: string) { this.id = id; }

  isReflex() { return this._reflex; }
  addEvent(event: SkeletonEvent) { this._events.push(event); }

  removeEvent(event: SkeletonEvent) {
    const removed = removeFromArray(this._events, event);
    assert(removed);
  }

  tryRemoveEvent(event: SkeletonEvent) { return removeFromArray(this._events, event); }
  clearEvents() { this._events = []; }
  events() { return this._events; }

  filterEvents(cb: (event: SkeletonEvent) => boolean) {
    this._events = this._events.filter(cb);
  }

  calcBisector(ctx: SkeletonContext, _init = false) {
    if (this.next?.next == this) return false;

    const vPrev = sub(create(), this.prev!.skelNode.p, this.skelNode.p);
    const vPrevLength = len(vPrev);
    if (vPrevLength < ctx.epsilon) { this.setDegenerate(); return false; }

    const vNext = sub(create(), this.next!.skelNode.p, this.skelNode.p);
    const vNextLength = len(vNext);
    if (vNextLength < ctx.epsilon) { this.setDegenerate(); return false; }

    scale(vPrev, vPrev, 1 / vPrevLength);
    scale(vNext, vNext, 1 / vNextLength);

    const cos = dot(vPrev, vNext);
    const bisector = this.bisector;
    if (cos < ctx.epsilonMinusOne) {
      bisector[0] = -vPrev[1] * ctx.distanceSign;
      bisector[1] = vPrev[0] * ctx.distanceSign;
      this._reflex = false;
    } else {
      normalize(bisector, add(bisector, vPrev, vNext));
      const sin = cross(vPrev, bisector);
      if (Math.abs(sin) < ctx.epsilon) {
        this.setDegenerate();
        return false;
      } else {
        const speed = ctx.distanceSign / sin;
        scale(bisector, bisector, speed);
        this._reflex = dot(bisector, vPrev) < 0;
      }
    }
    return true;
  }

  updateEdge() {
    const edgeDir = this.edgeDir;
    sub(edgeDir, this.next!.skelNode.p, this.skelNode.p);
    const edgeLength = len(edgeDir);
    scale(edgeDir, edgeDir, 1 / edgeLength);

    let edgeShrinkSpeed = dot(this.bisector, edgeDir);
    edgeShrinkSpeed -= dot(this.next!.bisector, edgeDir);

    if (edgeShrinkSpeed > 0) {
      this.edgeCollapseTime = edgeLength / edgeShrinkSpeed;
    } else {
      this.edgeCollapseTime = SkeletonEvent.INVALID_TIME;
    }
  }

  private setDegenerate() {
    this.bisector[0] = 0; this.bisector[1] = 0;
    this._reflex = false;
  }

  leaveSkeletonNode() {
    const oldSkelNode = this.skelNode;
    this.skelNode = new SkeletonNode();
    copy(this.skelNode.p, oldSkelNode.p);
    oldSkelNode.addEdge(this.skelNode);
  }

  toString() { return `MovingNode{${this.id}}${this._reflex ? '(reflex)' : ''}`; }
}
