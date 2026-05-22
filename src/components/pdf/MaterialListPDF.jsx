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
  groupBg: "#fffbeb",
  groupText: "#92400e",
  accentLine: "#d97706",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    padding: 25,
    fontSize: 9,
    color: COLORS.text,
  },
  header: {
    textAlign: "center",
    marginBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.accentLine,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 900,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 7,
    color: COLORS.muted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 8,
    color: COLORS.text,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  thRow: {
    flexDirection: "row",
    backgroundColor: COLORS.headerBg,
  },
  th: {
    padding: 6,
    fontWeight: 700,
    color: COLORS.headerText,
    fontSize: 8,
    textAlign: "center",
  },
  td: {
    padding: 5,
    fontSize: 8,
    textAlign: "center",
  },
  groupRow: {
    backgroundColor: COLORS.groupBg,
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  groupText: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.groupText,
    textAlign: "right",
  },
  footer: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 7,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
});

export default function MaterialListPDF({ result, tile, project, customFields = [], companyName = "" }) {
  const r = result;
  const dateStr = new Date().toLocaleDateString("ar-JO");

  const groupedRows = [];

  groupedRows.push({ type: "group", label: "القرميد" });
  groupedRows.push({ n: tile?.name || "قرميد", v: `${r.totalTiles} حبة` });

  groupedRows.push({ type: "group", label: "الحديد" });
  groupedRows.push({ n: "حديد 4×8", v: `${r.iron4x8} تيوب` });
  groupedRows.push({ n: "حديد 10×10 فريم", v: `${r.iron10x10.frame} تيوب` });
  groupedRows.push({ n: "حديد 10×10 أرجل", v: `${r.iron10x10.legs} تيوب` });
  groupedRows.push({ n: "إجمالي 10×10", v: `${r.iron10x10.total} تيوب`, bold: true });

  groupedRows.push({ type: "group", label: "الخشب" });
  if (r.decor?.bundles) groupedRows.push({ n: "ديكور", v: `${r.decor.bundles} ربطة (${r.decor.optimalLen}م)` });
  groupedRows.push({ n: "البيش", v: `${r.beshQty} وحدة` });
  groupedRows.push({ n: "أسس خشب", v: `${r.woodBases} قطعة` });
  if (r.borders.sections?.length) {
    r.borders.sections.forEach((sec, i) => {
      Object.entries(sec.lengths).forEach(([len, count]) => {
        groupedRows.push({ n: `الضلع ${i+1} - شراشف ${len}م`, v: `${count} شريحة` });
      });
      if ((sec.waste || 0) > 0) groupedRows.push({ n: `هدر الضلع ${i+1} (${sec.wastePercent}%)`, v: `${sec.waste} م` });
    });
  } else {
    Object.entries(r.borders.lengths || {}).forEach(([len, count]) => {
      groupedRows.push({ n: `شراشف ${len}م`, v: `${count} شريحة` });
    });
    if ((r.borders.waste || 0) > 0) groupedRows.push({ n: `هدر شراشف (${r.borders.wastePercent}%)`, v: `${r.borders.waste} م` });
  }

  groupedRows.push({ type: "group", label: "عزل" });
  groupedRows.push({ n: "مشمع", v: r.tarpaulin.text });
  if (r.insulation) {
    groupedRows.push({ n: "زفتة", v: `${r.insulation.zaftaRolls} رول` });
    groupedRows.push({ n: "لاتي", v: `${r.insulation.latiSheets} لوح` });
    groupedRows.push({ n: "مساطر زفتة", v: `${r.insulation.zaftaRulers} م` });
  }

  const extras = [];
  if (r.tileStarts > 0) extras.push({ n: "بداية قرميد", v: `${r.tileStarts} حبة` });
  if (r.tarabeesh > 0) extras.push({ n: "طرابيش", v: `${r.tarabeesh} حبة` });
  (customFields || []).forEach((cf) => extras.push({ n: cf.name, v: `${cf.value} ${cf.unit || ""}` }));
  if (extras.length > 0) {
    groupedRows.push({ type: "group", label: "مواد إضافية" });
    extras.forEach((ei) => groupedRows.push({ n: ei.n, v: ei.v }));
  }

  let dataIdx = 0;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.title}>كشف المواد حسب المقاسات المدخلة</Text>
          <Text style={styles.subtitle}>{companyName || "شموخ ERP"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text>العميل: {project?.client?.name || "-"}</Text>
          <Text>التاريخ: {dateStr}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.thRow}>
            <Text style={[styles.th, { flex: 0.5 }]}>#</Text>
            <Text style={[styles.th, { flex: 2.5, textAlign: "right" }]}>المادة</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>الكمية</Text>
          </View>

          {groupedRows.map((row, i) => {
            if (row.type === "group") {
              return (
                <View key={`g${i}`} style={styles.groupRow}>
                  <Text style={styles.groupText}>{row.label}</Text>
                </View>
              );
            }
            dataIdx++;
            return (
              <View key={i} style={{ flexDirection: "row", backgroundColor: dataIdx % 2 === 0 ? COLORS.bgEven : "white", borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <Text style={[styles.td, { flex: 0.5 }]}>{dataIdx}</Text>
                <Text style={[styles.td, { flex: 2.5, fontWeight: row.bold ? 900 : 700, textAlign: "right" }]}>{row.n}</Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{row.v}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.footer}>{companyName || "شموخ ERP"} - نظام إدارة مشاريع القرميد</Text>
      </Page>
    </Document>
  );
}
