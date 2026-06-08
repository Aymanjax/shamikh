export type Point = [number, number];

export function create(x?: number, y?: number): Point {
  return [x || 0, y || 0];
}

export function clone(p: Point): Point {
  return create(p[0], p[1]);
}

export function copy(out: Point, a: Point): Point {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}

export function set(out: Point, x: number, y: number): Point {
  out[0] = x;
  out[1] = y;
  return out;
}

export function min(out: Point, a: Point, b: Point): Point {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}

export function max(out: Point, a: Point, b: Point): Point {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}

export function dot(v1: Point, v2: Point) {
  return v1[0] * v2[0] + v1[1] * v2[1];
}

export function len(v: Point) {
  return Math.sqrt(lenSquare(v));
}

export function lenSquare(v: Point) {
  return v[0] * v[0] + v[1] * v[1];
}

export function normalize(out: Point, v: Point) {
  const d = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  out[0] = v[0] / d;
  out[1] = v[1] / d;
  return out;
}

export function dist(p0: Point, p1: Point) {
  return Math.sqrt(distSquare(p0, p1));
}

export function distSquare(p0: Point, p1: Point) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  return dx * dx + dy * dy;
}

export function scale(out: Point, v: Point, s: number) {
  out[0] = v[0] * s;
  out[1] = v[1] * s;
  return out;
}

export function scaleAndAdd(out: Point, v1: Point, v2: Point, s: number) {
  out[0] = v1[0] + v2[0] * s;
  out[1] = v1[1] + v2[1] * s;
  return out;
}

export function add(out: Point, v1: Point, v2: Point) {
  out[0] = v1[0] + v2[0];
  out[1] = v1[1] + v2[1];
  return out;
}

export function sub(out: Point, v1: Point, v2: Point) {
  out[0] = v1[0] - v2[0];
  out[1] = v1[1] - v2[1];
  return out;
}

export function cross(a: Point, b: Point) {
  return a[0] * b[1] - b[0] * a[1];
}

export function area(points: Point[]) {
  const n = points.length;
  if (n < 3) return 0;
  let a = 0;
  for (let i = n - 1, j = 0; j < n; i = j++) {
    a += points[i][0] * points[j][1] - points[j][0] * points[i][1];
  }
  return a;
}
