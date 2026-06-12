// Some browser-oriented UMD bundles (e.g. straight-skeleton, pulled in
// transitively by calculations.ts → roofSkeleton) reference the `self` global
// at module-evaluation time. Provide it so they load under the Node test env.
(globalThis as { self?: unknown }).self = globalThis;
export {};
