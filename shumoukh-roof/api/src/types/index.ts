import type { Request } from "express";

// ── Auth ──
export type UserRole = "user" | "admin";
export type SubscriptionPlan = "free_trial" | "limited" | "basic" | "advanced";

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  companyName?: string;
  banned?: boolean;
  subscription?: UserSubscription;
}

export interface UserSubscription {
  subscriptionType?: SubscriptionPlan;
  trialStartDate?: FirebaseTimestamp;
  subscriptionEndDate?: FirebaseTimestamp;
  isLinkedToNationalInvoice?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// ── Firebase Shim ──
export interface FirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
}

// ── User Profile ──
export interface UserProfile {
  displayName?: string;
  email?: string;
  role?: UserRole;
  companyName?: string;
  banned?: boolean;
  createdAt?: string;
  subscription?: UserSubscription;
}

export interface PublicUserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  lastLogin?: FirebaseTimestamp;
}

// ── Project ──
export type ProjectStatus = "draft" | "sent" | "approved" | "in_progress" | "completed";

export interface OrderItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  received: number;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method?: string;
}

export interface Project {
  id: string;
  userId: string;
  status: ProjectStatus;
  client?: { name: string; phone: string; address?: string };
  order: OrderItem[];
  payments: Payment[];
  calculatorData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  client?: { name: string; phone: string; address?: string };
  calculatorData?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  status?: ProjectStatus;
  client?: { name: string; phone: string; address?: string };
  order?: OrderItem[];
  calculatorData?: Record<string, unknown>;
}

// ── Supplier ──
export interface Supplier {
  uid: string;
  email?: string;
  businessName: string;
  phone: string;
  area: string;
  activity: string;
  description: string;
  approved: boolean;
  featured: boolean;
  banned: boolean;
  subscription: { plan: string };
  prices?: Record<string, number>;
  createdAt: FirebaseTimestamp;
}

export interface SupplierProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  category?: string;
  description?: string;
  createdAt: FirebaseTimestamp;
}

export interface SupplierRating {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: FirebaseTimestamp;
}

export interface Offer {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  title: string;
  description: string;
  discount: string;
  endDate?: FirebaseTimestamp;
  active: boolean;
  createdAt: FirebaseTimestamp;
}

export interface CreateSupplierInput {
  email: string;
  password: string;
  businessName: string;
  phone?: string;
  area?: string;
  activity?: string;
  description?: string;
}

// ── Invoice ──
export type InvoiceStatus = "draft" | "pending" | "paid";

export interface Invoice {
  id: string;
  userId: string;
  client: string;
  project?: string;
  amount: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt?: string;
}

// ── Worker ──
export interface Worker {
  id: string;
  userId: string;
  name: string;
  role: string;
  phone?: string;
  project?: string;
  wage: number;
  days: number;
  createdAt: string;
}

// ── Announcement ──
export type AnnouncementType = "info" | "warning" | "update" | "maintenance";
export type AnnouncementPriority = "low" | "normal" | "high";

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  published: boolean;
  createdBy: string;
  createdByDisplay?: string;
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
}

// ── Program Config ──
export interface TileCatalogEntry {
  name: string;
  origin: string;
  count: number;
  family: string;
  colorHex: string;
  width: number;
  length: number;
  type: string;
  textureUrl: string;
}

export interface ProgramConfig {
  tileCatalog: TileCatalogEntry[];
  marketLengths: number[];
  orderItems: { id: string; name: string; unit: string }[];
  extraItems: { name: string; unit: string }[];
}

// ── Notification ──
export interface UserNotification {
  id: string;
  announcementId: string;
  read: boolean;
  readAt?: FirebaseTimestamp;
}

// ── Audit Log ──
export interface AuditLog {
  action: string;
  adminUid: string;
  targetUid?: string;
  details?: string;
  createdAt: FirebaseTimestamp;
}

// ── Pagination ──
export interface PaginationQuery {
  limit?: number;
  offset?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextOffset?: string;
  total: number;
}
