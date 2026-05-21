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

const styles = StyleSheet.create({
  page: { fontFamily: "Cairo", padding: 30, direction: "rtl", fontSize: 10 },
  header: { textAlign: "center", marginBottom: 20, borderBottomWidth: 3, borderBottomColor: "#d97706", paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: 900 },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 4 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 9, color: "#475569", marginBottom: 4 },
  sectionTitle: { fontSize: 10, fontWeight: 900, color: "#94a3b8", marginTop: 14, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 3 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 5 },
  tableHeader: { fontWeight: 900, fontSize: 9, color: "#64748b", flex: 1, textAlign: "center" },
  tableCell: { flex: 1, textAlign: "center", fontSize: 9 },
  totalBox: { backgroundColor: "#0f172a", borderRadius: 6, padding: 12, marginTop: 12, flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: "white", fontSize: 12, fontWeight: 700 },
  totalValue: { color: "#f59e0b", fontSize: 14, fontWeight: 900 },
  footer: { textAlign: "center", color: "#94a3b8", fontSize: 8, marginTop: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 },
});

export default function QuotationPDF({ result, costResult, tile, prices, project }) {
  const r = result;
  const items = [
    { name: "حديد 4×8", qty: `${r.iron4x8} تيوب`, unitPrice: prices.iron4x8, total: (r.iron4x8 * prices.iron4x8) },
    { name: "حديد 10×10", qty: `${r.iron10x10.total} تيوب`, unitPrice: prices.iron10x10, total: (r.iron10x10.total * prices.iron10x10) },
    { name: "القرميد", qty: `${r.totalTiles} حبة`, unitPrice: prices.tile, total: (r.totalTiles * prices.tile) },
    { name: "ديكور خشبي", qty: `${r.decor.bundles} ربطة`, unitPrice: prices.decor, total: (r.decor.bundles * r.decor.optimalLen * prices.decor) },
    { name: "بيش خشب", qty: `${r.beshQty.toFixed(1)} وحدة`, unitPrice: prices.besh, total: (r.beshQty * prices.besh) },
    { name: "شراشف", qty: `${r.borders.total.toFixed(1)} م`, unitPrice: prices.sharshef, total: (r.borders.total * prices.sharshef) },
  ].filter((i) => i.total > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>عرض سعر</Text>
          <Text style={styles.subtitle}>صادر عن شامخ ERP</Text>
          <Text style={{ fontSize: 8, color: "#d97706", fontWeight: 700, marginTop: 4 }}>تحديد كميات وتكلفة أولية</Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={styles.infoRow}>العميل: {project?.client?.name || "-"}</Text>
          <Text style={styles.infoRow}>الهاتف: {project?.client?.phone || "-"}</Text>
          <Text style={styles.infoRow}>المساحة: {r.actualArea.toFixed(2)} م² (بعد الميل {project?.roof?.slope || 0}%)</Text>
          <Text style={styles.infoRow}>التاريخ: {new Date().toLocaleDateString("ar-JO")}</Text>
        </View>

        <Text style={styles.sectionTitle}>تفاصيل المواد والتكلفة</Text>

        <View style={[styles.tableRow, { backgroundColor: "#f8fafc" }]}>
          <Text style={styles.tableHeader}>#</Text>
          <Text style={styles.tableHeader}>المادة</Text>
          <Text style={styles.tableHeader}>الكمية</Text>
          <Text style={styles.tableHeader}>سعر الوحدة</Text>
          <Text style={styles.tableHeader}>الإجمالي</Text>
        </View>

        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.tableCell}>{i + 1}</Text>
            <Text style={styles.tableCell}>{item.name}</Text>
            <Text style={styles.tableCell}>{item.qty}</Text>
            <Text style={styles.tableCell}>{item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.tableCell}>{item.total.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>المجموع التقديري للمواد:</Text>
          <Text style={styles.totalValue}>{costResult?.totalWithNathrayat.toFixed(1) || 0} د.أ</Text>
        </View>

        <Text style={styles.footer}>شامخ ERP - نظام إدارة مشاريع القرميد | هذا العرض ساري لمدة 7 أيام</Text>
      </Page>
    </Document>
  );
}
