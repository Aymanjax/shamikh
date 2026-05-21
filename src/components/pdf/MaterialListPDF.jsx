import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Cairo",
  fonts: [
    { src: "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkZvQ9p1KQpJU1i.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkZvQ5p1KYpJU1i.woff2", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkZvQZx1KQpJU1i.woff2", fontWeight: 900 },
  ],
});

const styles = StyleSheet.create({
  page: { fontFamily: "Cairo", padding: 30, direction: "rtl", fontSize: 11 },
  header: { textAlign: "center", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#d97706", paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 900 },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 4 },
  badge: { fontSize: 8, color: "#d97706", marginTop: 6, fontWeight: 700 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 8 },
  rowEven: { backgroundColor: "#f8fafc" },
  label: { color: "#475569" },
  value: { fontWeight: 700 },
  sectionTitle: { fontSize: 10, fontWeight: 900, color: "#94a3b8", marginTop: 12, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 3 },
  totalBox: { backgroundColor: "#0f172a", color: "white", padding: 12, borderRadius: 8, marginTop: 12, flexDirection: "row", justifyContent: "space-between" },
  totalText: { fontSize: 14, fontWeight: 900, color: "#f59e0b" },
  footer: { textAlign: "center", color: "#94a3b8", fontSize: 8, marginTop: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 },
});

export default function MaterialListPDF({ result, tile, project, customFields = [] }) {
  const r = result;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>كشف المواد - {project?.client?.name || "ورشة قرميد"}</Text>
          <Text style={styles.subtitle}>صادر عن شامخ ERP</Text>
          <Text style={styles.badge}>تقرير تقديري للمواد المطلوبة</Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ fontSize: 9, color: "#64748b" }}>العميل: {project?.client?.name || "-"}</Text>
          <Text style={{ fontSize: 9, color: "#64748b" }}>التاريخ: {new Date().toLocaleDateString("ar-JO")}</Text>
        </View>

        <View style={{ backgroundColor: "#fef3c7", padding: 10, borderRadius: 6, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" }}>
          <Text>المساحة الفعلية (بعد الميل):</Text>
          <Text style={{ fontWeight: 900 }}>{r.actualArea.toFixed(2)} م²</Text>
        </View>

        <Text style={styles.sectionTitle}>هيكل الحديد</Text>
        <View style={[styles.row, styles.rowEven]}>
          <Text style={styles.label}>حديد 4×8:</Text>
          <Text style={styles.value}>{r.iron4x8} تيوب</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>حديد 10×10:</Text>
          <Text style={styles.value}>{r.iron10x10.total} تيوب</Text>
        </View>

        <Text style={styles.sectionTitle}>الأخشاب والتشطيب</Text>
        {r.decor.bundles > 0 && (
          <View style={[styles.row, styles.rowEven]}>
            <Text style={styles.label}>ديكور:</Text>
            <Text style={styles.value}>{r.decor.bundles} ربطة (لوح {r.decor.optimalLen}م)</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>بيش:</Text>
          <Text style={styles.value}>{r.beshQty} وحدة</Text>
        </View>
        <View style={[styles.row, styles.rowEven]}>
          <Text style={styles.label}>أسس خشب:</Text>
          <Text style={styles.value}>{r.woodBases} قطعة</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>شراشف:</Text>
          <Text style={styles.value}>{r.borders.total} م</Text>
        </View>

        <Text style={styles.sectionTitle}>الحماية والكسوة</Text>
        <View style={[styles.row, styles.rowEven]}>
          <Text style={styles.label}>مشمع:</Text>
          <Text style={styles.value}>{r.tarpaulin.text}</Text>
        </View>
        {r.insulation && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>زفتة:</Text>
              <Text style={styles.value}>{r.insulation.zaftaRolls} رول</Text>
            </View>
            <View style={[styles.row, styles.rowEven]}>
              <Text style={styles.label}>لاتي:</Text>
              <Text style={styles.value}>{r.insulation.latiSheets} لوح</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>مساطر زفتة:</Text>
              <Text style={styles.value}>{r.insulation.zaftaRulers} حبة</Text>
            </View>
          </>
        )}

        {r.tileStarts > 0 && (
          <View style={[styles.row, styles.rowEven]}>
            <Text style={styles.label}>بداية قرميد:</Text>
            <Text style={styles.value}>{r.tileStarts} حبة</Text>
          </View>
        )}

        {customFields.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>مواد إضافية</Text>
            {customFields.map((item, i) => (
              <View key={i} style={[styles.row, i % 2 === 0 ? styles.rowEven : {}]}>
                <Text style={styles.label}>{item.name}:</Text>
                <Text style={styles.value}>{item.value} {item.unit || ""}</Text>
              </View>
            ))}
          </>
        )}

        <View style={[styles.row, { backgroundColor: "#0f172a", color: "white", padding: 10, borderRadius: 6, marginTop: 10 }]}>
          <Text style={{ color: "white" }}>القرميد:</Text>
          <Text style={{ color: "#f59e0b", fontWeight: 900 }}>{r.totalTiles} حبة - {tile?.name || "غير محدد"}</Text>
        </View>

        <Text style={styles.footer}>تم الإنشاء بواسطة شامخ ERP - نظام إدارة مشاريع القرميد</Text>
      </Page>
    </Document>
  );
}
