import { db } from "../config/firebase";
import { collections, Timestamp } from "./firestore";
import type { Project, CreateProjectInput, UpdateProjectInput, ProjectStatus } from "../types";

const PROJECT_STATUSES: ProjectStatus[] = ["draft", "sent", "approved", "in_progress", "completed"];

function defaultOrder() {
  return [
    { id: "tiles", name: "قرميد", unit: "حبة", quantity: 0, received: 0 },
    { id: "iron4x8", name: "حديد 4×8", unit: "تيوب", quantity: 0, received: 0 },
    { id: "iron10x10", name: "حديد 10×10", unit: "تيوب", quantity: 0, received: 0 },
    { id: "sharshef", name: "شراشف", unit: "م", quantity: 0, received: 0 },
    { id: "decor", name: "ديكور", unit: "ربطة", quantity: 0, received: 0 },
    { id: "ases", name: "اسس", unit: "قطعة", quantity: 0, received: 0 },
    { id: "long_ases", name: "اسس طويل", unit: "قطعة", quantity: 0, received: 0 },
    { id: "metal_sheets", name: "شرحات صاج", unit: "شريحة", quantity: 0, received: 0 },
    { id: "mishma", name: "مشمع", unit: "رول", quantity: 0, received: 0 },
    { id: "lati", name: "الواح لاتي", unit: "لوح", quantity: 0, received: 0 },
    { id: "zafta", name: "رول زفته", unit: "رول", quantity: 0, received: 0 },
    { id: "dehan_mai", name: "دهان مائي", unit: "علبة", quantity: 0, received: 0 },
    { id: "bakit_baraghi", name: "بكيت براغي", unit: "بكيت", quantity: 0, received: 0 },
  ];
}

export async function createProject(uid: string, input: CreateProjectInput): Promise<string> {
  const id = crypto.randomUUID();
  const project: Project = {
    id,
    userId: uid,
    status: "draft",
    order: defaultOrder(),
    payments: [],
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await collections.users(uid).projects.doc(id).set(project);
  return id;
}

export async function getProject(uid: string, projectId: string): Promise<Project | null> {
  const snap = await collections.users(uid).projects.doc(projectId).get();
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as Project;
}

export async function listProjects(uid: string): Promise<Project[]> {
  const snap = await collections
    .users(uid).projects
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Project);
}

export async function updateProject(
  uid: string,
  projectId: string,
  data: UpdateProjectInput
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (data.status && !PROJECT_STATUSES.includes(data.status)) {
    throw new Error(`Invalid status: ${data.status}`);
  }

  await collections.users(uid).projects.doc(projectId).update(updateData);
}

export async function deleteProject(uid: string, projectId: string): Promise<void> {
  await collections.users(uid).projects.doc(projectId).delete();
}

export async function listAllProjects(): Promise<(Project & { userId: string })[]> {
  const snap = await db.collectionGroup("projects").get();
  return snap.docs
    .map((d) => ({ userId: d.ref.parent.parent?.id || "", ...d.data(), id: d.id }) as Project & { userId: string })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addPayment(
  uid: string,
  projectId: string,
  payment: { amount: number; method?: string }
): Promise<void> {
  const project = await getProject(uid, projectId);
  if (!project) throw new Error("Project not found");

  const payments = [
    ...(project.payments || []),
    { ...payment, id: crypto.randomUUID(), date: new Date().toISOString() },
  ];

  await collections.users(uid).projects.doc(projectId).update({ payments });
}

export async function deletePayment(
  uid: string,
  projectId: string,
  paymentId: string
): Promise<void> {
  const project = await getProject(uid, projectId);
  if (!project) throw new Error("Project not found");

  const payments = (project.payments || []).filter((p) => p.id !== paymentId);
  await collections.users(uid).projects.doc(projectId).update({ payments });
}
