// عرض موحد لبيانات المشروع المحفوظ من الحاسبة عبر الصفحات (الرئيسية، المشاريع، الفواتير)
import { t, formatDate } from "../i18n";

export type SavedProject = {
  id: string;
  client?: { name?: string; phone?: string; address?: string };
  roof?: { vertices?: { x: number; y: number }[]; segments?: { length: number; width: number }[]; slope?: number };
  settings?: { numLegs?: number; legHeight?: number };
  summary?: { totalTiles?: number; flatArea?: number; actualArea?: number; totalCost?: number | null };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

// التسميات تُقرأ من القاموس وقت الاستدعاء (وليس عند تحميل الوحدة) لتتبع اللغة الحالية
const PROJECT_STATUS_CLASS: Record<string, string> = {
  draft:       "bg-earth-100 text-earth-700 border-earth-300",
  sent:        "bg-terracotta-50 text-terracotta-500 border-terracotta-200",
  approved:    "tag-amber",
  in_progress: "tag-terracotta",
  completed:   "tag-olive",
};

export function projectStatusInfo(status?: string) {
  const key = status && PROJECT_STATUS_CLASS[status] ? status : "draft";
  return { label: t(`misc.projectStatus.${key}`), className: PROJECT_STATUS_CLASS[key] };
}

export function projectName(p: SavedProject): string {
  return p.client?.name?.trim() || t("misc.project.unnamed");
}

// مساحة المضلع بقانون الحذاء (متر مربع) عند غياب الملخص المحفوظ
function polygonArea(vertices: { x: number; y: number }[]): number {
  if (!vertices || vertices.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

export function projectArea(p: SavedProject): number {
  if (p.summary?.flatArea) return p.summary.flatArea;
  const fromVertices = polygonArea(p.roof?.vertices || []);
  if (fromVertices > 0) return fromVertices;
  const seg = p.roof?.segments?.[0];
  return seg ? seg.length * seg.width : 0;
}

export function projectDate(p: SavedProject): string {
  if (!p.createdAt) return "";
  const d = new Date(p.createdAt);
  if (isNaN(d.getTime())) return "";
  return formatDate(d, { month: "short", day: "numeric", year: "numeric" });
}
