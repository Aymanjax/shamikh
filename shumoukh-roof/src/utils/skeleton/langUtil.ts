// @ts-nocheck
export function removeFromArray<T>(arr: T[], item: T) {
  const idx = arr.indexOf(item);
  if (idx >= 0) { arr.splice(idx, 1); return true; }
  return false;
}

export function assert(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg || '');
}
