// @ts-nocheck
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { numberToArabicWords } from "../../utils/numberToArabic";
const logoImg = null;

const COLORS = {
  primary: "#1e293b",
  accent: "#d97706",
  accentLight: "#fbbf24",
  muted: "#94a3b8",
  text: "#334155",
  border: "#e2e8f0",
  bgEven: "#f8fafc",
  headerBg: "#1e293b",
  headerText: "#ffffff",
  warningBg: "#fffbeb",
  warningText: "#92400e",
  successText: "#16a34a",
  dangerText: "#dc2626",
  footerBorder: "#e2e8f0",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    padding: 25,
    direction: "rtl",
    fontSize: 9,
    color: COLORS.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.accent,
    paddingBottom: 10,
  },
  companySection: { flex: 1 },
  companyName: { fontSize: 14, fontWeight: 900, color: COLORS.primary },
  companyInfo: { fontSize: 8, color: "#64748b", marginTop: 2 },
  invoiceTitleSection: { alignItems: "flex-start" },
  invoiceTitle: { fontSize: 16, fontWeight: 900, color: COLORS.accent },
  invoiceNumber: { fontSize: 9, color: COLORS.primary, fontWeight: 700, marginTop: 4 },
  statusBadge: { fontSize: 8, fontWeight: 700, padding: "3 8", borderRadius: 4, textAlign: "center", marginTop: 4 },
  infoRow: { flexDirection: "row", marginBottom: 14, gap: 12 },
  infoBox: { flex: 1, backgroundColor: "#f8fafc", padding: 8, borderRadius: 4 },
  infoLabel: { fontSize: 7, color: COLORS.muted, fontWeight: 700, marginBottom: 2 },
  infoValue: { fontSize: 9, color: COLORS.primary, fontWeight: 700 },
  infoDetail: { fontSize: 8, color: "#64748b", marginTop: 2 },
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  thRow: { flexDirection: "row", backgroundColor: COLORS.headerBg },
  th: { padding: 6, fontWeight: 700, color: COLORS.headerText, fontSize: 7, textAlign: "center" },
  tdRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  td: { padding: 5, fontSize: 8, textAlign: "center" },
  summaryBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 8,
  },
  summaryLabel: { color: "#64748b", fontWeight: 600 },
  summaryValue: { color: COLORS.primary, fontWeight: 700 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.warningBg,
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  totalLabel: { fontSize: 9, color: COLORS.warningText, fontWeight: 700 },
  totalValue: { fontSize: 14, fontWeight: 900, color: COLORS.accent },
  amountWords: { fontSize: 7, color: COLORS.muted, textAlign: "center", marginTop: 2, marginBottom: 10 },
  paymentsBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, padding: 8, marginBottom: 10 },
  paymentTitle: { fontSize: 8, fontWeight: 700, color: COLORS.primary, marginBottom: 4 },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#475569", paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  signature: { marginTop: 20, flexDirection: "row", justifyContent: "space-between" },
  signatureLine: { width: "40%", borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 4, fontSize: 8, color: COLORS.muted },
  footer: { textAlign: "center", color: COLORS.muted, fontSize: 7, marginTop: 20, borderTopWidth: 1, borderTopColor: COLORS.footerBorder, paddingTop: 8 },
  draftWatermark: { position: "absolute", top: "40%", left: "25%", fontSize: 60, color: "rgba(200,200,200,0.3)", fontWeight: 900, transform: "rotate(-30deg)" },
  logo: { width: 40, height: 40, marginBottom: 4 },
  termsBox: { backgroundColor: "#f8fafc", padding: 6, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  discountText: { color: COLORS.dangerText, fontWeight: 700 },
  taxText: { color: COLORS.primary, fontWeight: 700 },
});

const INVOICE_STATUS_LABELS = { draft: "مسودة", unpaid: "غير مدفوعة", partial: "مدفوعة جزئياً", paid: "مدفوعة", cancelled: "ملغية" };

const statusStyleMap = {
  draft: { bg: "#f1f5f9", color: "#475569" },
  unpaid: { bg: "#fef2f2", color: "#dc2626" },
  partial: { bg: "#fffbeb", color: "#d97706" },
  paid: { bg: "#f0fdf4", color: "#16a34a" },
  cancelled: { bg: "#f8fafc", color: "#64748b" },
};

export default function InvoicePDF({ invoice }) {
  if (!invoice) return null;
  const inv = invoice;
  const dateStr = inv.date ? new Date(inv.date).toLocaleDateString("ar-JO") : "";
  const dueStr = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("ar-JO") : "";
  const s = statusStyleMap[inv.status] || statusStyleMap.unpaid;

  const activeItems = (inv.items || []).filter((i) => i.isActive !== false);
  const subtotal = inv.subtotal || activeItems.reduce((s, i) => s + (i.total || 0), 0);
  const discountAmount = inv.discountAmount || 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = inv.taxAmount || 0;
  const taxRate = inv.taxRate || 0;
  const total = inv.total || 0;
  const paidAmount = inv.paidAmount || 0;
  const remaining = total - paidAmount;

  const amountInWords = numberToArabicWords(total);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {inv.status === "draft" && <Text style={styles.draftWatermark}>مسودة</Text>}

        <View style={styles.header}>
          <View style={styles.companySection}>
            <Image src={logoImg} style={styles.logo} />
            <Text style={styles.companyName}>{inv.companyName || "شموخ ERP"}</Text>
            <Text style={styles.companyInfo}>نظام إدارة مشاريع القرميد</Text>
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>فاتورة</Text>
            <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
            <Text style={[styles.statusBadge, { backgroundColor: s.bg, color: s.color }]}>{INVOICE_STATUS_LABELS?.[inv.status] || inv.status}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>العميل</Text>
            <Text style={styles.infoValue}>{inv.client?.name || "-"}</Text>
            {inv.client?.phone ? <Text style={styles.infoDetail}>{inv.client.phone}</Text> : null}
            {inv.client?.address ? <Text style={styles.infoDetail}>{inv.client.address}</Text> : null}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>تفاصيل الفاتورة</Text>
            <Text style={styles.infoDetail}>التاريخ: {dateStr}</Text>
            {dueStr ? <Text style={styles.infoDetail}>تاريخ الاستحقاق: {dueStr}</Text> : null}
            {inv.terms ? <Text style={styles.infoDetail}>الشروط: {inv.terms}</Text> : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.thRow}>
            <Text style={[styles.th, { flex: 1 }]}>الإجمالي</Text>
            <Text style={[styles.th, { flex: 1 }]}>سعر الوحدة</Text>
            <Text style={[styles.th, { flex: 0.8 }]}>الكمية</Text>
            <Text style={[styles.th, { flex: 0.8 }]}>الوحدة</Text>
            <Text style={[styles.th, { flex: 2.5 }]}>الصنف</Text>
            <Text style={[styles.th, { flex: 0.4 }]}>#</Text>
          </View>
          {activeItems.map((item, i) => (
            <View key={i} style={[styles.tdRow, { backgroundColor: i % 2 === 0 ? COLORS.bgEven : "white" }]}>
              <Text style={[styles.td, { flex: 1, fontWeight: 700 }]}>{Number(item.total || 0).toFixed(2)}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{Number(item.unitPrice || 0).toFixed(2)}</Text>
              <Text style={[styles.td, { flex: 0.8 }]}>{item.qty}</Text>
              <Text style={[styles.td, { flex: 0.8 }]}>{item.unit || ""}</Text>
              <Text style={[styles.td, { flex: 2.5, fontWeight: 700 }]}>{item.name}</Text>
              <Text style={[styles.td, { flex: 0.4 }]}>{i + 1}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
            <Text style={styles.summaryValue}>{subtotal.toFixed(2)} د.أ</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel]}>الخصم {inv.discountType === "percentage" ? `(${inv.discountValue}%)` : ""}</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>-{discountAmount.toFixed(2)} د.أ</Text>
            </View>
          )}
          {taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ضريبة المبيعات ({taxRate}%)</Text>
              <Text style={[styles.summaryValue, styles.taxText]}>+{taxAmount.toFixed(2)} د.أ</Text>
            </View>
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>الإجمالي النهائي:</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)} د.أ</Text>
        </View>

        <Text style={styles.amountWords}>{amountInWords}</Text>

        {(inv.payments || []).length > 0 && (
          <View style={styles.paymentsBox}>
            <Text style={styles.paymentTitle}>المدفوعات</Text>
            {(inv.payments || []).map((p, i) => (
              <View key={i} style={styles.paymentRow}>
                <Text>{new Date(p.date).toLocaleDateString("ar-JO")}</Text>
                <Text>{p.note || "دفعة"}</Text>
                <Text style={{ fontWeight: 700 }}>{p.amount.toFixed(2)} د.أ</Text>
              </View>
            ))}
            <View style={[styles.paymentRow, { borderBottomWidth: 0, marginTop: 4 }]}>
              <Text />
              <Text style={{ fontWeight: 700, fontSize: 9 }}>المدفوع: {paidAmount.toFixed(2)} د.أ</Text>
              <Text style={{ fontWeight: 700, fontSize: 9, color: remaining > 0 ? COLORS.dangerText : COLORS.successText }}>
                {remaining > 0 ? `المتبقي: ${remaining.toFixed(2)} د.أ` : "مسدد بالكامل"}
              </Text>
            </View>
          </View>
        )}

        {inv.terms && (
          <View style={styles.termsBox}>
            <Text style={{ fontSize: 7, fontWeight: 700, color: COLORS.muted, marginBottom: 2 }}>شروط الدفع</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>{inv.terms}</Text>
          </View>
        )}

        {inv.notes && (
          <View style={{ backgroundColor: "#f8fafc", padding: 8, borderRadius: 4, marginBottom: 10 }}>
            <Text style={{ fontSize: 7, fontWeight: 700, color: COLORS.muted, marginBottom: 2 }}>ملاحظات</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>{inv.notes}</Text>
          </View>
        )}

        <View style={styles.signature}>
          <View style={styles.signatureLine}>
            <Text>توقيع المستلم</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>ختم الشركة</Text>
          </View>
        </View>

        <View style={{ marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: COLORS.primary, marginBottom: 4 }}>ملاحظات الفاتورة الوطنية الإلكترونية:</Text>
            {inv.governmentStatus === "approved" ? (
              <>
                {inv.governmentUUID && <Text style={{ fontSize: 7, color: "#475569", marginBottom: 2 }}>رقم التوثيق الموحد (UUID): {inv.governmentUUID}</Text>}
                {inv.governmentApprovalNumber && <Text style={{ fontSize: 7, color: COLORS.primary, fontWeight: 700, marginBottom: 2 }}>رقم الموافقة الضريبية: {inv.governmentApprovalNumber}</Text>}
                {inv.governmentSentAt && <Text style={{ fontSize: 7, color: "#475569", marginBottom: 2 }}>تاريخ الاعتماد الرقمي: {new Date(inv.governmentSentAt).toLocaleString("ar-JO")}</Text>}
              </>
            ) : (
              <Text style={{ fontSize: 7, color: "#94a3b8", fontStyle: "italic" }}>هذه الفاتورة مخصصة للاستخدام الداخلي ولم يتم رفعها للمنظومة الوطنية بعد.</Text>
            )}
          </View>
          {inv.governmentStatus === "approved" && inv.governmentQR && (
            <View style={{ alignItems: "center", gap: 4 }}>
              <Image src={inv.governmentQR} style={{ width: 80, height: 80 }} />
              <Text style={{ fontSize: 6, color: COLORS.muted, textAlign: "center" }}>امسح للتحقق من الفاتورة ضريبياً</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>{inv.companyName || "شموخ ERP"} - شكراً لتعاملكم</Text>
      </Page>
    </Document>
  );
}