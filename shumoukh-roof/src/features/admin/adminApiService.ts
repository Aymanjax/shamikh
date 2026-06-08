// @ts-nocheck
const API = "/api/v1";
const token = () => localStorage.getItem("token") || "";

async function apiGet(path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) throw new Error(`فشل الطلب: ${res.status}`);
  return res.json();
}

async function apiPut(path: string, body: any) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`فشل التحديث: ${res.status}`);
  return res.json();
}

async function apiPost(path: string, body?: any) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`فشل التنفيذ: ${res.status}`);
  return res.json();
}

async function apiDelete(path: string) {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) throw new Error(`فشل الحذف: ${res.status}`);
  return res.json();
}

export const adminApi = {
  // Dashboard
  getStats: () => apiGet("/admin/stats"),
  getFullStats: () => apiGet("/admin/full-stats"),
  getOnlineUsers: () => apiGet("/admin/online"),
  getTodayLogins: () => apiGet("/admin/today-logins"),
  getAuditLogs: (limit = 50) => apiGet(`/admin/audit-logs?limit=${limit}`),

  // Config
  getConfig: () => apiGet("/admin/config"),
  saveConfig: (data: any) => apiPut("/admin/config", data),

  // Users
  getUsers: () => apiGet("/users"),
  updateUserRole: (uid: string, role: string) => apiPut(`/users/${uid}/role`, { role }),
  toggleUserBan: (uid: string) => apiPost(`/users/${uid}/ban`),
  setUserSubscription: (uid: string, plan: string, days: number) =>
    apiPut(`/users/${uid}/subscription`, { plan, days }),

  // Projects
  getProjects: () => apiGet("/projects"),
  deleteProject: (projectId: string, userId?: string) =>
    apiDelete(`/projects/${projectId}${userId ? `?userId=${userId}` : ""}`),

  // Invoices
  getInvoices: () => apiGet("/invoices"),
  updateInvoiceStatus: (id: string, status: string) =>
    apiPut(`/invoices/${id}/status`, { status }),
  deleteInvoice: (id: string) => apiDelete(`/invoices/${id}`),

  // Suppliers
  getSuppliers: () => apiGet("/suppliers"),
  approveSupplier: (uid: string) => apiPut(`/suppliers/${uid}/approve`, { approved: true }),
  banSupplier: (uid: string) => apiPost(`/suppliers/${uid}/ban`),

  // Workers
  getWorkers: () => apiGet("/workers"),

  // Analytics
  getAnalytics: () => apiGet("/analytics/dashboard"),
  getUsersGrowth: () => apiGet("/analytics/users-growth"),
};
