// @ts-nocheck
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "../../utils/pdfFonts";

const C = {
  dark: "#1e293b", accent: "#d97706", accentBg: "#fffbeb", accentBorder: "#fde68a",
  muted: "#64748b", text: "#1e293b", border: "#e2e8f0", stripe: "#f8fafc",
  white: "#ffffff", thBg: "#f1f5f9", thText: "#475569", red: "#dc2626",
};

const S = StyleSheet.create({
  page: { fontFamily: "Cairo", padding: 22, fontSize: 8, color: C.text },
  header: { textAlign: "center", marginBottom: 10 },
  title: { fontSize: 15, fontWeight: 900, color: C.dark },
  subtitle: { fontSize: 7, color: C.muted, marginTop: 2 },
  summaryBox: { backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 6, padding: 6, marginBottom: 10 },
  summaryTitle: { fontSize: 7, fontWeight: 900, color: "#92400e", marginBottom: 4 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap" },
  sumItem: { width: "33%", padding: 2 },
  sumLabel: { fontSize: 6, color: C.muted, fontWeight: 700 },
  sumValue: { fontSize: 8, fontWeight: 900, color: C.dark },
  section: { marginBottom: 10 },
  secHead: { backgroundColor: "#991b1b", padding: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  secHeadText: { color: C.white, fontWeight: 900, fontSize: 9 },
  secBody: { borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, overflow: "hidden" },
  thRow: { flexDirection: "row", backgroundColor: C.thBg },
  th: { padding: 4, fontWeight: 700, color: C.thText, fontSize: 7, textAlign: "right" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 4, paddingHorizontal: 6, alignItems: "center" },
  rowLast: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, alignItems: "center" },
  numBox: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 4 },
  numText: { color: C.white, fontSize: 7, fontWeight: 900 },
  pillSlate: { backgroundColor: "#f1f5f9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pillSlateText: { fontSize: 7, fontWeight: 700, color: "#475569" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", padding: 5, backgroundColor: C.accentBg },
  sumLab: { fontWeight: 700, fontSize: 7 },
  sumVal: { fontWeight: 700, fontSize: 7 },
  legBox: { backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 6, padding: 6, marginVertical: 4 },
  legText: { fontSize: 8, fontWeight: 900, color: C.dark, textAlign: "center" },
  grandBox: { backgroundColor: C.dark, borderRadius: 6, padding: 8, flexDirection: "row", justifyContent: "space-between" },
  grandLabel: { color: "#fbbf24", fontWeight: 900, fontSize: 9 },
  grandValue: { color: C.white, fontWeight: 900, fontSize: 9 },
  imageBox: { marginBottom: 10, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 3, textAlign: "center" },
  roofImg: { width: "100%", maxHeight: 300, objectFit: "contain" },
  skelHead: { backgroundColor: "#991b1b", padding: 5, borderTopLeftRadius: 6, borderTopRightRadius: 6, marginTop: 8 },
  skelHeadText: { color: C.white, fontWeight: 900, fontSize: 8 },
});

const DIRS = [
  { value: "right", label: "يمين" }, { value: "left", label: "يسار" },
  { value: "down", label: "تحت" }, { value: "up", label: "فوق" },
];

export default function IronFramePDF({ result, sides, vertices, input, companyName, roofPng }) {
  const r = result || {};
  const facadeSides = (sides || []).filter(s => s.hasFacade);
  const hasIron = r.ironFrame?.sections?.length > 0;
  const skeleton = r.roofSkeleton;
  const dateStr = new Date().toLocaleDateString("ar-JO");
  const hasImg = roofPng && typeof roofPng === "string" && roofPng.startsWith("data:");

  return (
    <Document>
      <Page size="A4" style={S.page} wrap>
        <View style={S.header}>
          <Text style={S.title}>طباعة إطار الحديد والهيكل</Text>
          <Text style={S.subtitle}>{companyName || "شموخ ERP"} — {dateStr}</Text>
        </View>

        {hasImg && (
          <View style={S.imageBox}>
            <Image src={roofPng} style={S.roofImg} />
          </View>
        )}

        <View style={S.summaryBox}>
          <Text style={S.summaryTitle}>ملخص الهيكل والحديد</Text>
          <View style={S.summaryGrid}>
            <View style={S.sumItem}><Text style={S.sumLabel}>المساحة</Text><Text style={S.sumValue}>{r.actualArea?.toFixed(1) || 0} م²</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>طول الواجهات</Text><Text style={S.sumValue}>{r.totalFacadeLength?.toFixed(1) || 0}م</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>ميل السطح</Text><Text style={S.sumValue}>{input?.slope || 20}%</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>حديد 4×8</Text><Text style={S.sumValue}>{r.iron4x8 || 0} تيوب</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>فريم 10×10</Text><Text style={S.sumValue}>{r.ironFrame?.totalPieces || 0} تيوب</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>الأرجل</Text><Text style={S.sumValue}>{r.iron10x10?.legs || 0} تيوب</Text></View>
          </View>
        </View>

        {skeleton && (skeleton.ridges.length > 0 || skeleton.hips.length > 0 || skeleton.valleys.length > 0 || skeleton.gables?.length > 0) && (
          <View style={S.section} wrap={false}>
            <View style={S.skelHead}>
              <Text style={S.skelHeadText}>الطرابيش والهيكل العظمي</Text>
            </View>
            <View style={S.secBody}>
              <View style={S.thRow}>
                <Text style={[S.th, { flex: 1 }]}>النوع</Text>
                <Text style={[S.th, { flex: 1 }]}>العدد</Text>
                <Text style={[S.th, { flex: 1 }]}>الطول الإجمالي</Text>
              </View>
              {[
                { key: "ridges", label: "حافة (ridge)", color: "#ea580c" },
                { key: "hips", label: "ورك (hip)", color: "#dc2626" },
                { key: "valleys", label: "وادي (valley)", color: "#2563eb" },
                { key: "gables", label: "جملون (gable)", color: "#9ca3af" },
              ].filter(({ key }) => (skeleton[key] || []).length > 0).map(({ key, label, color }, i, arr) => {
                const arr2 = skeleton[key] || [];
                const totalLen = arr2.reduce((s, seg) => s + seg.length, 0);
                const isLast = i === arr.length - 1;
                const bg = i % 2 === 1 ? { backgroundColor: C.stripe } : {};
                return (
                  <View key={key} style={[isLast ? S.rowLast : S.row, bg]}>
                    <Text style={[{ flex: 1, textAlign: "right", fontSize: 7 }]}>
                      <Text style={{ color }}>■ </Text>
                      <Text style={{ fontWeight: 700 }}>{label}</Text>
                    </Text>
                    <Text style={[{ flex: 1, textAlign: "right", fontWeight: 900, fontSize: 7 }]}>{arr2.length}</Text>
                    <Text style={[{ flex: 1, textAlign: "right", fontWeight: 900, fontSize: 7, color }]}>{totalLen.toFixed(1)}م</Text>
                  </View>
                );
              })}
              <View style={[S.summaryRow, { backgroundColor: "#fef2f2" }]}>
                <Text style={[S.sumLab, { color: "#991b1b" }]}>إجمالي الطرابيش: {r.tarabeesh?.toFixed(1) || 0}م</Text>
                <Text style={[S.sumVal, { color: "#dc2626" }]}>ميل: {input?.slope || 20}%</Text>
              </View>
            </View>
          </View>
        )}

        {hasIron && (
          <View style={S.section} wrap={false}>
            <View style={S.secHead}>
              <Text style={S.secHeadText}>فريم 10×10 — تفصيل لكل ضلع</Text>
            </View>
            <View style={S.secBody}>
              <View style={S.thRow}>
                <Text style={[S.th, { flex: 0.5 }]}>#</Text>
                <Text style={[S.th, { flex: 1 }]}>اتجاه</Text>
                <Text style={[S.th, { flex: 1 }]}>الطول</Text>
                <Text style={[S.th, { flex: 1.5 }]}>تيوب (6م)</Text>
                <Text style={[S.th, { flex: 1 }]}>هدر</Text>
              </View>
              {r.ironFrame.sections.map((sec, i) => {
                const edge = facadeSides[i];
                const dir = DIRS.find(d => d.value === edge?.direction)?.label || "";
                const isLast = i === r.ironFrame.sections.length - 1;
                const bg = i % 2 === 1 ? { backgroundColor: C.stripe } : {};
                return (
                  <View key={`f-${i}`} style={[isLast ? S.rowLast : S.row, bg]}>
                    <View style={[{ flex: 0.5, alignItems: "center" }]}>
                      <View style={[S.numBox, { backgroundColor: "#64748b" }]}>
                        <Text style={S.numText}>{i + 1}</Text>
                      </View>
                    </View>
                    <Text style={[{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 7 }]}>{dir}</Text>
                    <Text style={[{ flex: 1, textAlign: "right", fontWeight: 900, fontSize: 7 }]}>{sec.requiredLength}م</Text>
                    <View style={{ flex: 1.5, alignItems: "flex-end" }}>
                      <View style={S.pillSlate}><Text style={S.pillSlateText}>{sec.pieces} تيوب</Text></View>
                    </View>
                    <Text style={[{ flex: 1, textAlign: "right", fontSize: 7, color: sec.waste > 0 ? C.red : C.muted }]}>
                      {sec.waste > 0 ? `+${sec.waste}م` : "—"}
                    </Text>
                  </View>
                );
              })}
              <View style={S.summaryRow}>
                <Text style={S.sumLab}>التيوبات: {r.ironFrame?.totalPieces ?? 0}</Text>
                <Text style={S.sumVal}>{r.ironFrame.total}م</Text>
                <Text style={[S.sumVal, { color: r.ironFrame.waste > 0 ? C.red : C.text }]}>هدر: {r.ironFrame.waste}م ({r.ironFrame.wastePercent}%)</Text>
              </View>
            </View>
          </View>
        )}

        <View style={S.legBox}>
          <Text style={S.legText}>الأرجل: {input?.numLegs || 0} رجل × {input?.legHeight || 0}م → {r.iron10x10?.legs || 0} تيوب 10×10</Text>
        </View>

        <View style={S.grandBox}>
          <Text style={S.grandLabel}>الطرابيش: {r.tarabeesh?.toFixed(1) || 0}م</Text>
          <Text style={S.grandValue}>فريم: {r.ironFrame?.totalPieces || 0} تيوب · إجمالي: {r.totalIronAll || (r.iron4x8 + (r.iron10x10?.total || 0))} تيوب</Text>
        </View>
      </Page>
    </Document>
  );
}
