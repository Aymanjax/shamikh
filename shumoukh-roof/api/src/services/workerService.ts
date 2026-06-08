import { collections, Timestamp } from "./firestore";
import type { Worker } from "../types";

export async function createWorker(
  uid: string,
  data: { name: string; role: string; phone?: string; project?: string; wage: number; days: number }
): Promise<string> {
  const id = crypto.randomUUID();
  const worker: Worker = {
    id,
    userId: uid,
    name: data.name,
    role: data.role,
    phone: data.phone,
    project: data.project,
    wage: data.wage,
    days: data.days,
    createdAt: new Date().toISOString(),
  };

  await collections.workers.doc(id).set(worker);
  return id;
}

export async function getWorker(id: string): Promise<Worker | null> {
  const snap = await collections.workers.doc(id).get();
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as Worker;
}

export async function listWorkers(uid: string): Promise<Worker[]> {
  const snap = await collections
    .workers
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Worker);
}

export async function listAllWorkers(): Promise<Worker[]> {
  const snap = await collections
    .workers
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Worker);
}

export async function updateWorker(
  id: string,
  data: Partial<Worker>
): Promise<void> {
  await collections.workers.doc(id).update(data);
}

export async function deleteWorker(id: string): Promise<void> {
  await collections.workers.doc(id).delete();
}
