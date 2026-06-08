// @ts-nocheck
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "../../utils/pdfFonts";

const COLORS = {
  primary: "#1e293b",
  accent: "#d97706",
  accentLight: "#f59e0b",
  muted: "#94a3b8",
  text: "#334155",
  border: "#e2e8f0",
  bgEven: "#f8fafc",
  headerBg: "#1e293b",
  headerText: "#ffffff",
  totalBg: "#0f172a",
  totalText: "#f59e0b",
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
    textAlign: "center",
    marginBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.accent,
    paddingBottom: 10,
  },
  title: { fontSize: 20, fontWeight: 900, color: COLORS.primary },
  subtitle: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  projectName: { fontSize: 8, color: COLORS.accent, marginTop: 4, fontWeight: 700 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12, gap: 4 },
  infoItem: { width: "48%", backgroundColor: "#f8fafc", padding: 6, borderRadius: 4 },
  infoLabel: { fontSize: 7, color: COLORS.muted, fontWeight: 700 },
  infoValue: { fontSize: 9, color: COLORS.primary, fontWeight: 700 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 900,
    color: COLORS.muted,
    marginTop: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 3,
  },
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, overflow: "hidden" },
  thRow: { flexDirection: "row", backgroundColor: COLORS.headerBg },
  th: { padding: 6, fontWeight: 700, color: COLORS.headerText, fontSize: 7, textAlign: "center" },
  tdRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  td: { padding: 5, fontSize: 8, textAlign: "center" },
  totalBox: {
    backgroundColor: COLORS.totalBg,
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: { color: "white", fontSize: 10, fontWeight: 700 },
  totalValue: { color: COLORS.totalText, fontSize: 14, fontWeight: 900 },
  footer: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 7,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.footerBorder,
    paddingTop: 8,
  },
});

export default function QuotationPDF({ result, costResult, tile, prices, project, companyName = "", roofPng = null }) {
  const r = result;
  const borderItems = r.borders?.sections?.length
    ? r.borders.sections.flatMap((sec, i) => [
        ...Object.entries(sec.lengths).map(([len, count]) => ({
          name: `الضلع ${i+1} - شراشف ${len}م`,
          qty: `${count} شريحة`,
          unitPrice: prices.sharshef,
          total: (count * parseFloat(len) * prices.sharshef),
        })),
        ...((sec.waste || 0) > 0 ? [{
          name: `هدر الضلع ${i+1} (${sec.wastePercent}%)`,
          qty: `${sec.waste} م`,
          unitPrice: 0,
          total: 0,
        }] : []),
      ])
    : (r.borders ? Object.entries(r.borders.lengths || {}).map(([len, count]) => ({
        name: `شراشف ${len}م`,
        qty: `${count} شريحة`,
        unitPrice: prices.sharshef,
        total: (count * parseFloat(len) * prices.sharshef),
      })) : []);

  const items = [
    { name: "حديد 4×8", qty: `${r.iron4x8} تيوب`, unitPrice: prices.iron4x8, total: (r.iron4x8 * prices.iron4x8) },
    { name: "حديد 10×10", qty: `${r.iron10x10.total} تيوب`, unitPrice: prices.iron10x10, total: (r.iron10x10.total * prices.iron10x10) },
    { name: "القرميد", qty: `${r.totalTiles} حبة`, unitPrice: prices.tile, total: (r.totalTiles * prices.tile) },
    { name: "ديكور خشبي", qty: `${r.decor.bundles} ربطة`, unitPrice: prices.decor, total: (r.decor.bundles * r.decor.optimalLen * prices.decor) },
    { name: "بيش خشب", qty: `${r.beshQty.toFixed(1)} وحدة`, unitPrice: prices.besh, total: (r.beshQty * prices.besh) },
    ...borderItems,
  ].filter((i) => i.total > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>عرض سعر</Text>
          <Text style={styles.subtitle}>{companyName || "شموخ ERP"}</Text>
          <Text style={styles.projectName}>تحديد كميات وتكلفة أولية</Text>
        </View>

        <View style={styles.infoGrid}>
          {[
            ["العميل", project?.client?.name || "-"],
            ["الهاتف", project?.client?.phone || "-"],
            ["المساحة", `${r.actualArea.toFixed(2)} م² (ميل ${project?.roof?.slope || 0}%)`],
            ["التاريخ", new Date().toLocaleDateString("ar-JO")],
            ["القرميد", tile?.name || "غير محدد"],
            ["عدد الحبات", `${r.totalTiles} حبة`],
          ].map(([label, value], i) => (
            <View key={i} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        {roofPng && (
          <View>
            <Text style={styles.sectionTitle}>مخطط السقف</Text>
            <Image style={{ width: "100%", marginVertical: 8, borderRadius: 4 }} src={roofPng} />
          </View>
        )}

        <Text style={styles.sectionTitle}>تفاصيل المواد والتكلفة</Text>

        <View style={styles.table}>
          <View style={styles.thRow}>
            <Text style={[styles.th, { flex: 1 }]}>الإجمالي</Text>
            <Text style={[styles.th, { flex: 1 }]}>سعر الوحدة</Text>
            <Text style={[styles.th, { flex: 0.8 }]}>الكمية</Text>
            <Text style={[styles.th, { flex: 2 }]}>المادة</Text>
            <Text style={[styles.th, { flex: 0.4 }]}>#</Text>
          </View>

          {items.map((item, i) => (
            <View key={i} style={[styles.tdRow, { backgroundColor: i % 2 === 0 ? COLORS.bgEven : "white" }]}>
              <Text style={[styles.td, { flex: 1, fontWeight: 700 }]}>{item.total.toFixed(2)}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{item.unitPrice.toFixed(2)}</Text>
              <Text style={[styles.td, { flex: 0.8 }]}>{item.qty}</Text>
              <Text style={[styles.td, { flex: 2, fontWeight: 700 }]}>{item.name}</Text>
              <Text style={[styles.td, { flex: 0.4 }]}>{i + 1}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>المجموع التقديري للمواد:</Text>
          <Text style={styles.totalValue}>{costResult?.totalWithNathrayat.toFixed(1) || 0} د.أ</Text>
        </View>

        <Text style={styles.footer}>{companyName || "شموخ ERP"} | هذا العرض ساري لمدة 7 أيام</Text>
      </Page>
    </Document>
  );
}
