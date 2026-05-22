import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const basePath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '').replace(/\/index\.html$/, '') : '';
const fontPath = `${basePath}/fonts/Cairo`;

Font.register({
  family: "Cairo",
  fonts: [
    { src: `${fontPath}-Regular.ttf`, fontWeight: 400 },
    { src: `${fontPath}-Bold.ttf`, fontWeight: 700 },
    { src: `${fontPath}-Black.ttf`, fontWeight: 900 },
  ],
});

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
  totalsBox: {
    backgroundColor: COLORS.warningBg,
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  totalLabel: { fontSize: 9, color: COLORS.warningText, fontWeight: 700 },
  totalValue: { fontSize: 14, fontWeight: 900, color: COLORS.accent },
  paymentsBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, padding: 8, marginBottom: 10 },
  paymentTitle: { fontSize: 8, fontWeight: 700, color: COLORS.primary, marginBottom: 4 },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#475569", paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  signature: { marginTop: 20, flexDirection: "row", justifyContent: "space-between" },
  signatureLine: { width: "40%", borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 4, fontSize: 8, color: COLORS.muted },
  footer: { textAlign: "center", color: COLORS.muted, fontSize: 7, marginTop: 20, borderTopWidth: 1, borderTopColor: COLORS.footerBorder, paddingTop: 8 },
});

const INVOICE_STATUS_LABELS = { unpaid: "غير مدفوعة", partial: "مدفوعة جزئياً", paid: "مدفوعة", cancelled: "ملغية" };

const statusStyleMap = {
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

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.companySection}>
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
            <Text style={styles.infoDetail}>{inv.client?.phone || ""}</Text>
            <Text style={styles.infoDetail}>{inv.client?.address || ""}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>تفاصيل الفاتورة</Text>
            <Text style={styles.infoDetail}>التاريخ: {dateStr}</Text>
            <Text style={styles.infoDetail}>تاريخ الاستحقاق: {dueStr || "غير محدد"}</Text>
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
          {(inv.items || []).map((item, i) => (
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

        <View style={styles.totalsBox}>
          <Text style={styles.totalLabel}>المجموع الإجمالي:</Text>
          <Text style={styles.totalValue}>{Number(inv.total || 0).toFixed(1)} د.أ</Text>
        </View>

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
              <Text style={{ fontWeight: 700, fontSize: 9 }}>المدفوع: {Number(inv.paidAmount || 0).toFixed(2)} د.أ</Text>
              <Text style={{ fontWeight: 700, fontSize: 9, color: inv.paidAmount >= inv.total ? COLORS.successText : COLORS.dangerText }}>
                {(inv.total || 0) - (inv.paidAmount || 0) > 0 ? `المتبقي: ${((inv.total || 0) - (inv.paidAmount || 0)).toFixed(2)} د.أ` : "مسدد بالكامل"}
              </Text>
            </View>
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

        <Text style={styles.footer}>{inv.companyName || "شموخ ERP"} - شكراً لتعاملكم</Text>
      </Page>
    </Document>
  );
}
