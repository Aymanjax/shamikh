// اتفاقيات العمل (توريد وتركيب قرميد) — صيغة جاهزة بالنظام الأردني تُعبّأ من
// بيانات المشروع، وبنودها قابلة للتعديل والإضافة. اتفاقية واحدة لكل مشروع.
// مجموعة Firestore مسطّحة "contracts" مفصولة بحقل userId (نفس نمط الدفعات والمصاريف).
import { db } from "../../lib/firebase";
import {
  collection, addDoc, updateDoc, doc, getDocs, query, where, Timestamp,
} from "firebase/firestore";
import type { Payment } from "./paymentsService";

export interface Contract {
  id: string;
  userId: string;
  projectId: string;
  // الفريق الأول — المقاول
  partyAName: string;
  partyANationalId?: string;
  partyAPhone?: string;
  // الفريق الثاني — المالك
  partyBName: string;
  partyBNationalId?: string;
  partyBPhone?: string;
  partyBAddress?: string;
  // موضوع الاتفاقية
  subject: string;        // وصف الأعمال
  location: string;       // موقع العمل
  totalAmount: number;    // القيمة الإجمالية بالدينار
  durationDays: number;   // مدة التنفيذ بأيام العمل
  startDate: string;      // yyyy-mm-dd
  warrantyYears: number;  // مدة الضمان
  city: string;           // مدينة الاختصاص القضائي
  paymentTerms: string;   // جدول الدفعات نصًا
  clauses: string[];      // البنود — قابلة للتعديل والإضافة والحذف
  createdAt?: unknown;
  updatedAt?: unknown;
}

const COLL = "contracts";

export interface ContractSeed {
  projectId: string;
  companyName?: string;
  companyPhone?: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  projectLabel?: string;
  area?: number;
  totalCost?: number;
  payments?: Payment[];
}

/** نص جدول الدفعات: من دفعات المشروع إن وُجدت، وإلا قالب 50/40/10 من القيمة */
export function buildPaymentTerms(total: number, payments?: Payment[]): string {
  if (payments && payments.length > 0) {
    return payments
      .map((p, i) => `${i + 1}. ${p.label}: ${p.amount} دينار أردني${p.dueDate ? ` (استحقاق ${p.dueDate})` : ""}`)
      .join("\n");
  }
  const p1 = Math.round(total * 0.5), p2 = Math.round(total * 0.4);
  return [
    `1. دفعة أولى عند توقيع الاتفاقية: ${p1} دينار أردني.`,
    `2. دفعة ثانية عند إنهاء الهيكل الحديدي: ${p2} دينار أردني.`,
    `3. الدفعة الأخيرة عند التسليم النهائي: ${Math.max(0, total - p1 - p2)} دينار أردني.`,
  ].join("\n");
}

/** البنود الافتراضية — صيغة أردنية متعارف عليها لاتفاقيات توريد وتركيب القرميد */
export function defaultClauses(c: {
  subject: string; location: string; totalAmount: number;
  durationDays: number; warrantyYears: number; city: string;
}): string[] {
  return [
    `يلتزم الفريق الأول بـ${c.subject} في ${c.location || "الموقع المتفق عليه"} وفق المواصفات والمخططات المتفق عليها بين الفريقين، وباستخدام مواد جديدة ومطابقة للمواصفات.`,
    `قيمة هذه الاتفاقية الإجمالية (${c.totalAmount}) دينار أردني، شاملة ثمن المواد وأجور التوريد والتركيب، وتُدفع حسب جدول الدفعات المبيّن في هذه الاتفاقية.`,
    `مدة تنفيذ الأعمال (${c.durationDays}) يوم عمل تبدأ من تاريخ المباشرة، ولا يُحتسب منها التأخير الناجم عن الأحوال الجوية أو القوة القاهرة أو تأخّر الفريق الثاني في الالتزامات المترتبة عليه.`,
    `يلتزم الفريق الأول بضمان أعمال التركيب لمدة (${c.warrantyYears}) سنوات من تاريخ التسليم ضد عيوب التركيب، ولا يشمل الضمان سوء الاستخدام أو العبث أو الأضرار الناجمة عن الغير.`,
    `لا تشمل هذه الاتفاقية أي أعمال إضافية لم تُذكر صراحةً، وأي عمل إضافي يطلبه الفريق الثاني يُتفق على سعره كتابيًا قبل تنفيذه ويُضاف إلى قيمة الاتفاقية.`,
    `يلتزم الفريق الثاني بتوفير الكهرباء والماء وممر مناسب للوصول إلى موقع العمل ومكان آمن لتخزين المواد طيلة فترة التنفيذ.`,
    `تبقى المواد الموردة ملكًا للفريق الأول حتى سداد كامل قيمة الاتفاقية، وللفريق الأول حق استردادها عند الإخلال بالدفع دون الإخلال بحقه بالمطالبة بالعطل والضرر.`,
    `في حال نشوء أي خلاف حول تفسير أو تنفيذ هذه الاتفاقية يُحل وديًا بين الفريقين، وإن تعذّر ذلك تكون محاكم ${c.city || "عمّان"} صاحبة الاختصاص، وتخضع هذه الاتفاقية لأحكام القوانين النافذة في المملكة الأردنية الهاشمية.`,
    `حُررت هذه الاتفاقية من نسختين أصليتين بيد كل فريق نسخة موقّعة للعمل بموجبها عند الاقتضاء.`,
  ];
}

/** إنشاء مسودة اتفاقية معبّأة من بيانات المشروع والشركة */
export function seedContract(seed: ContractSeed): Omit<Contract, "id" | "userId"> {
  const subject = `توريد وتركيب قرميد${seed.area ? ` لسطح بمساحة تقريبية (${seed.area.toFixed(0)}) م²` : ""}`;
  const base = {
    subject,
    location: seed.clientAddress || "",
    totalAmount: Math.round(seed.totalCost || 0),
    durationDays: 14,
    warrantyYears: 2,
    city: "عمّان",
  };
  return {
    projectId: seed.projectId,
    partyAName: seed.companyName || "",
    partyAPhone: seed.companyPhone || "",
    partyBName: seed.clientName || "",
    partyBPhone: seed.clientPhone || "",
    partyBAddress: seed.clientAddress || "",
    startDate: new Date().toISOString().slice(0, 10),
    paymentTerms: buildPaymentTerms(base.totalAmount, seed.payments),
    clauses: defaultClauses(base),
    ...base,
  };
}

/** اتفاقية المشروع إن وُجدت (تصفية بالمستخدم ثم بالمشروع محليًا — بلا فهرس مركّب) */
export async function getContractForProject(userId: string, projectId: string): Promise<Contract | null> {
  const snap = await getDocs(query(collection(db, COLL), where("userId", "==", userId)));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Contract[];
  return rows.find((c) => c.projectId === projectId) || null;
}

export async function saveContract(
  userId: string,
  data: Omit<Contract, "id" | "userId">,
  existingId?: string
): Promise<void> {
  if (existingId) {
    await updateDoc(doc(db, COLL, existingId), { ...data, updatedAt: Timestamp.now() });
  } else {
    await addDoc(collection(db, COLL), { ...data, userId, createdAt: Timestamp.now() });
  }
}
