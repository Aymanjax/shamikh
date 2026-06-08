// @ts-nocheck
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

const C = {
  dark: "#0f172a",
  accent: "#d97706",
  accentBg: "#fffbeb",
  muted: "#64748b",
  text: "#1e293b",
  border: "#e2e8f0",
  stripe: "#f8fafc",
  white: "#ffffff",
  success: "#059669",
  red: "#dc2626",
};

const S = StyleSheet.create({
  page: { fontFamily: "Cairo", padding: 30, fontSize: 9, color: C.text },
  brandBar: { height: 4, backgroundColor: C.accent, marginBottom: 0, borderRadius: 2 },
  header: { textAlign: "center", marginBottom: 12, borderBottomWidth: 2, borderBottomColor: C.accent, paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: 900, color: C.dark },
  subtitle: { fontSize: 7, color: C.muted, marginTop: 2 },

  /* Summary box */
  summaryBox: { flexDirection: "row", flexWrap: "wrap", backgroundColor: C.accentBg, borderWidth: 1, borderColor: "#fcd34d", borderRadius: 6, padding: 8, marginBottom: 12 },
  summaryItem: { width: "33%", padding: 3 },
  summaryLabel: { fontSize: 6, color: C.muted, fontWeight: 700 },
  summaryValue: { fontSize: 8, fontWeight: 900, color: C.dark },

  /* Section */
  section: { marginBottom: 10 },
  sectionHead: { backgroundColor: C.dark, padding: 6, borderRadius: 4 },
  sectionHeadText: { color: C.white, fontWeight: 900, fontSize: 9 },
  sectionBody: { borderWidth: 1, borderColor: C.border, borderRadius: 4, borderTopWidth: 0, overflow: "hidden" },

  /* Row */
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 5, paddingHorizontal: 8 },
  rowLast: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8 },
  rowTotal: { flexDirection: "row", backgroundColor: C.accentBg, paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.border },

  nameCol: { flex: 3, fontSize: 8, fontWeight: 700, textAlign: "right" },
  qtyCol: { flex: 1.2, fontSize: 8, fontWeight: 700, textAlign: "center" },
  totalName: { flex: 3, fontSize: 8, fontWeight: 900, color: C.accent, textAlign: "right" },
  totalQty: { flex: 1.2, fontSize: 8, fontWeight: 900, color: C.accent, textAlign: "center" },

  /* Grand totals */
  grandBox: { backgroundColor: C.dark, borderRadius: 6, padding: 10, flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  grandLabel: { color: "#fbbf24", fontWeight: 900, fontSize: 9 },
  grandValue: { color: C.white, fontWeight: 900, fontSize: 9 },

  footer: { textAlign: "center", color: C.muted, fontSize: 7, marginTop: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
});

export default function MaterialListPDF({ result, tile, project, customFields = [], companyName = "", hiddenItems = [] }) {
  const r = result;
  const dateStr = new Date().toLocaleDateString("ar-JO");
  const h = new Set(hiddenItems || []);

  const sections = [];

  /* ─────────── القرميد ─────────── */
  sections.push({ head: "🧱 القرميد", rows: [{ id: "tiles", name: tile?.name || "قرميد", qty: `${r.totalTiles} حبة` }] });

  /* ─────────── الحديد ─────────── */
  sections.push({
    head: "🔩 الحديد",
    rows: [
      { id: "iron4x8", name: "حديد 4×8", qty: `${r.iron4x8} تيوب` },
      { id: "iron10x10", name: "إجمالي 10×10", qty: `${r.iron10x10.total} تيوب`, total: true },
    ],
  });

  /* ─────────── الخشب ─────────── */
  const woodRows = [];
  if (r.decor?.bundles) woodRows.push({ id: "decor", name: "ديكور", qty: `${r.decor.bundles} ربطة (${r.decor.optimalLen}م)` });
  if (r.decorBrooz?.bundles) woodRows.push({ id: "decorBrooz", name: "ديكور البروز", qty: `${r.decorBrooz.bundles} ربطة (${r.decorBrooz.len}م)` });
  woodRows.push({ id: "besh", name: "البيش", qty: `${r.beshQty} وحدة` });
  woodRows.push({ id: "woodBases", name: "أسس خشب", qty: `${r.woodBases} قطعة` });
  if (r.borders?.sections?.length) {
    r.borders.sections.forEach((sec, i) => {
      Object.entries(sec.lengths || {}).forEach(([len, count]) => {
        woodRows.push({ id: `border_${len}`, name: `الضلع ${i + 1} - شراشف ${len}م`, qty: `${count} شريحة` });
      });
    });
  } else if (r.borders) {
    Object.entries(r.borders.lengths || {}).forEach(([len, count]) => {
      woodRows.push({ id: `border_${len}`, name: `شراشف ${len}م`, qty: `${count} شريحة` });
    });
  }
  sections.push({ head: "🪵 الخشب", rows: woodRows });

  /* ─────────── عزل ─────────── */
  const insRows = [{ id: "tarpaulin", name: "مشمع", qty: r.tarpaulin?.text || "0 رول" }];
  if ((r.metalSheets || 0) > 0) insRows.push({ id: "metalSheets", name: "شرحات صاج (2م)", qty: `${r.metalSheets} شريحة` });
  if ((r.metalSheets || 0) > 0) insRows.push({ id: "silicone", name: "سلكون", qty: `${r.metalSheets} حبة` });
  if (r.insulation) {
    insRows.push({ id: "zafta", name: "زفتة", qty: `${r.insulation.zaftaRolls} رول` });
    insRows.push({ id: "lati", name: "لاتي", qty: `${r.insulation.latiSheets} لوح` });
    insRows.push({ id: "zaftaRulers", name: "مساطر زفتة", qty: `${r.insulation.zaftaRulers} م` });
  }
  sections.push({ head: "💧 عزل", rows: insRows });

  /* ─────────── مواد إضافية ─────────── */
  const extras = [];
  (customFields || []).forEach((cf, ci) => { if (cf?.name) extras.push({ id: `custom_${ci}`, name: cf.name, qty: `${cf.value || 0} ${cf.unit || ""}` }); });
  if (extras.length) sections.push({ head: "📦 مواد إضافية", rows: extras });

  const filteredSections = sections.map((sec) => ({
    ...sec,
    rows: sec.rows.filter((row) => !h.has(row.id)),
  })).filter((sec) => sec.rows.length > 0);

  /* Grand totals */
  let totalTiles = r.totalTiles;
  let totalIron = r.iron4x8 + r.iron10x10.total;

  return (
    <Document>
      <Page size="A4" style={S.page} wrap>
        <View style={S.brandBar} />

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>كشف المواد حسب المقاسات المدخلة</Text>
          <Text style={S.subtitle}>{companyName || "شموخ ERP"}</Text>
        </View>

        {/* Project summary */}
        <View style={S.summaryBox}>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>العميل</Text>
            <Text style={S.summaryValue}>{project?.client?.name || "ورشة حالية"}</Text>
          </View>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>المساحة بعد الميل</Text>
            <Text style={S.summaryValue}>{r.actualArea?.toFixed(2) || 0} م²</Text>
          </View>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>نوع القرميد</Text>
            <Text style={[S.summaryValue, { fontSize: 7 }]}>{tile?.name || "-"}</Text>
          </View>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>عدد الأرجل</Text>
            <Text style={S.summaryValue}>{r.iron10x10?.legs && r.iron10x10?.legs > 0 ? `${r.iron10x10.legs} تيوب` : "-"}</Text>
          </View>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>التاريخ</Text>
            <Text style={S.summaryValue}>{dateStr}</Text>
          </View>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>عدد التيوبات 10×10</Text>
            <Text style={S.summaryValue}>{r.iron10x10?.total || 0} تيوب</Text>
          </View>
        </View>

        {/* Sections */}
        {filteredSections.map((sec, si) => (
          <View key={si} style={S.section} wrap={false}>
            <View style={S.sectionHead}>
              <Text style={S.sectionHeadText}>{sec.head}</Text>
            </View>
            <View style={S.sectionBody}>
              {sec.rows.map((row, ri) => {
                const isLast = ri === sec.rows.length - 1;
                const Row = row.total ? S.rowTotal : isLast ? S.rowLast : S.row;
                const Name = row.total ? S.totalName : S.nameCol;
                const Qty = row.total ? S.totalQty : S.qtyCol;
                const bg = !row.total && ri % 2 === 1 ? { backgroundColor: C.stripe } : {};
                return (
                  <View key={ri} style={[Row, bg]}>
                    <Text style={Name}>{row.name}</Text>
                    <Text style={Qty}>{row.qty}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Grand totals */}
        <View style={S.grandBox}>
          <Text style={S.grandLabel}>إجمالي القرميد: {totalTiles} حبة</Text>
          <Text style={S.grandValue}>إجمالي الحديد: {totalIron} تيوب</Text>
        </View>

        <Text style={S.footer}>{companyName || "شموخ ERP"} — نظام إدارة مشاريع القرميد</Text>
      </Page>
    </Document>
  );
}
