// @ts-nocheck
import FastPriorityQueue from 'fastpriorityqueue';
import { EdgeEvent } from './EdgeEvent';
import { assert } from './langUtil';
import MovingNode from './MovingNode';
import SkeletonEvent from './SkeletonEvent';
import SplitEvent from './SplitEvent';

export default class SkeletonContext {
  private nextMovingNodeId: number = 1;
  private movingNodes: Set<MovingNode> = new Set();
  private readonly eventQueue: FastPriorityQueue<SkeletonEvent> = new FastPriorityQueue((a, b) => a.compareTo(b) < 0);
  private readonly abortedReflex: Set<MovingNode> = new Set();

  distance: number;
  distanceSign: number;
  time: number = 0;
  epsilon: number = 0.0001;
  epsilonMinusOne: number = this.epsilon - 1;

  setEpsilon(epsilon: number) {
    this.epsilon = epsilon;
    this.epsilonMinusOne = epsilon - 1;
  }

  getNodes() { return this.movingNodes; }

  reset(distance: number, distanceSign: number) {
    this.distance = distance;
    this.distanceSign = distanceSign;
    this.time = 0;
    this.nextMovingNodeId = 1;
    this.movingNodes.clear();
    this.eventQueue.removeMany(() => true);
    this.abortedReflex.clear();
  }

  createMovingNode(id?: string) {
    id = id || this.nextMovingNodeId++ + '';
    const node = new MovingNode(id);
    this.movingNodes.add(node);
    return node;
  }

  removeMovingNode(node: MovingNode) {
    node.next = null;
    node.prev = null;
    this.abortEvents(node);
    this.movingNodes.delete(node);
  }

  pollQueue() { return this.eventQueue.poll(); }
  peekQueue() { return this.eventQueue.peek(); }

  enqueue(event: SkeletonEvent) {
    if (event.time < this.time) throw 'time: ' + this.time + ', event.time: ' + event.time;
    this.eventQueue.add(event);
    event.onEventQueued();
    if (this.eventQueue.size > 1e5) throw 'Event queue size overflow.';
  }

  addAbortedReflex(reflexNode: MovingNode) { this.abortedReflex.add(reflexNode); }

  abortEvents(adjacentNode: MovingNode) {
    adjacentNode.events().forEach((ev) => { ev.onEventAborted(adjacentNode, this); this.eventQueue.remove(ev); });
    adjacentNode.clearEvents();
  }

  abortEvents2(edgeNode0: MovingNode, edgeNode1: MovingNode) {
    edgeNode0.filterEvents((event) => {
      if (edgeNode1.tryRemoveEvent(event)) {
        event.onEventAborted2(edgeNode0, edgeNode1, this);
        this.eventQueue.remove(event);
        return false;
      }
      return true;
    });
  }

  printEvents() { this.eventQueue.forEach((ev) => console.log(' - ' + ev)); }
  printNodes() { this.movingNodes.forEach((node) => console.log(' - ' + node)); }

  tryQueueEdgeEvent(n0: MovingNode, n1: MovingNode) {
    const eventTime = this.time + n0.edgeCollapseTime;
    if (eventTime <= this.distance) this.enqueue(new EdgeEvent(n0, n1, eventTime));
  }

  tryQueueSplitEvent(reflexNode: MovingNode, op0: MovingNode, op1: MovingNode) {
    assert(reflexNode.isReflex());
    const eventTime = this.time + SplitEvent.calcTime(reflexNode, op0, this.distanceSign);
    if (eventTime <= this.distance) this.enqueue(new SplitEvent(reflexNode, op0, op1, eventTime));
  }

  tryReplaceNearestSplitEvent(reflexNode: MovingNode, op0: MovingNode, op1: MovingNode, nearest?: SplitEvent | null) {
    assert(reflexNode.isReflex());
    const eventTime = this.time + SplitEvent.calcTime(reflexNode, op0, this.distanceSign);
    if (nearest != null && nearest.time <= eventTime) return nearest;
    if (eventTime <= this.distance) return new SplitEvent(reflexNode, op0, op1, eventTime);
    return nearest;
  }

  recheckAbortedReflexNodes() {
    this.abortedReflex.forEach((reflexNode) => {
      if (reflexNode.next != null && reflexNode.isReflex()) SkeletonEvent.createSplitEvents(reflexNode, this);
    });
    this.abortedReflex.clear();
  }
}
