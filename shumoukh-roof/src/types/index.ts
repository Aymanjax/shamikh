export type UserRole = "user" | "admin";
export type SubscriptionType = "trial" | "active" | "expired";
export type TimestampValue = unknown;

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
  createdAt?: any;
  updatedAt?: any;
}

export interface Vertex {
  x: number;
  y: number;
}

export interface Side {
  length: number;
  hasFacade: boolean;
  isActive: boolean;
}
