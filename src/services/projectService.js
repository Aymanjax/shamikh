import { db } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy,
} from "firebase/firestore";
import { createDefaultOrder } from "../utils/orderItems";

const projectStatuses = ["draft", "sent", "approved", "in_progress", "completed"];

export function getProjectsRef(userId) {
  return collection(db, "users", userId, "projects");
}

export function getProjectRef(userId, projectId) {
  return doc(db, "users", userId, "projects", projectId);
}

export async function createProject(userId, data) {
  const id = crypto.randomUUID();
  const project = {
    ...data,
    id,
    status: "draft",
    order: createDefaultOrder(),
    payments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(getProjectRef(userId, id), project);
  return id;
}

export async function fetchProjects(userId) {
  const q = query(getProjectsRef(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function fetchProject(userId, projectId) {
  const snap = await getDoc(getProjectRef(userId, projectId));
  return snap.exists() ? snap.data() : null;
}

export async function updateProject(userId, projectId, data) {
  await updateDoc(getProjectRef(userId, projectId), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteProject(userId, projectId) {
  await deleteDoc(getProjectRef(userId, projectId));
}

export async function updateProjectStatus(userId, projectId, status) {
  if (!projectStatuses.includes(status)) throw new Error(`Invalid status: ${status}`);
  await updateProject(userId, projectId, { status });
}

export async function updateOrder(userId, projectId, orderItems) {
  await updateProject(userId, projectId, { order: orderItems });
}

export async function addPayment(userId, projectId, payment) {
  const project = await fetchProject(userId, projectId);
  const payments = [...(project.payments || []), { ...payment, id: crypto.randomUUID(), date: new Date().toISOString() }];
  await updateProject(userId, projectId, { payments });
}

export async function deletePayment(userId, projectId, paymentId) {
  const project = await fetchProject(userId, projectId);
  const payments = (project.payments || []).filter((p) => p.id !== paymentId);
  await updateProject(userId, projectId, { payments });
}

export { projectStatuses };
