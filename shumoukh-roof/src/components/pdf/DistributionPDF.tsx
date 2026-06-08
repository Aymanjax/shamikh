// @ts-nocheck
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "../../utils/pdfFonts";

const C = {
  dark: "#1e293b",
  accent: "#d97706",
  accentBg: "#fffbeb",
  accentBorder: "#fde68a",
  muted: "#64748b",
  text: "#1e293b",
  border: "#e2e8f0",
  stripe: "#f8fafc",
  white: "#ffffff",
  thBg: "#f1f5f9",
  thText: "#475569",
  red: "#dc2626",
};

const S = StyleSheet.create({
  page: { fontFamily: "Cairo", padding: 22, fontSize: 8, color: C.text },

  header: { textAlign: "center", marginBottom: 10 },
  title: { fontSize: 15, fontWeight: 900, color: C.dark },
  subtitle: { fontSize: 7, color: C.muted, marginTop: 2 },

  imageLabel: { fontSize: 7, fontWeight: 900, color: C.muted, marginBottom: 4, textAlign: "center" },
  imageBox: { marginBottom: 10, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 3, textAlign: "center" },
  roofImg: { width: "100%", maxHeight: 300, objectFit: "contain" },

  summaryBox: { backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 6, padding: 6, marginBottom: 10 },
  summaryTitle: { fontSize: 7, fontWeight: 900, color: "#92400e", marginBottom: 4 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap" },
  sumItem: { width: "33%", padding: 2 },
  sumLabel: { fontSize: 6, color: C.muted, fontWeight: 700 },
  sumValue: { fontSize: 8, fontWeight: 900, color: C.dark },

  section: { marginBottom: 10 },
  secHead: { backgroundColor: C.dark, padding: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  secHeadText: { color: C.white, fontWeight: 900, fontSize: 9 },
  secBody: { borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, overflow: "hidden" },

  thRow: { flexDirection: "row", backgroundColor: C.thBg },
  th: { padding: 4, fontWeight: 700, color: C.thText, fontSize: 7, textAlign: "right" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 4, paddingHorizontal: 6, alignItems: "center" },
  rowLast: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, alignItems: "center" },

  numBox: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 4 },
  numText: { color: C.white, fontSize: 7, fontWeight: 900 },

  pill: { backgroundColor: C.accentBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pillText: { fontSize: 7, fontWeight: 700, color: "#92400e" },
  pillSlate: { backgroundColor: "#f1f5f9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pillSlateText: { fontSize: 7, fontWeight: 700, color: "#475569" },

  summaryRow: { flexDirection: "row", justifyContent: "space-between", padding: 5, backgroundColor: C.accentBg },
  sumLabel: { fontWeight: 700, fontSize: 7 },
  sumVal: { fontWeight: 700, fontSize: 7 },

  legBox: { backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 6, padding: 6, marginTop: 4, marginBottom: 6 },
  legText: { fontSize: 8, fontWeight: 900, color: C.dark, textAlign: "center" },

  grandBox: { backgroundColor: C.dark, borderRadius: 6, padding: 8, flexDirection: "row", justifyContent: "space-between" },
  grandLabel: { color: "#fbbf24", fontWeight: 900, fontSize: 9 },
  grandValue: { color: C.white, fontWeight: 900, fontSize: 9 },
});

export default function DistributionPDF({ result, facadeSides, input, roofImage, companyName = "" }) {
  const r = result || {};
  const sides = facadeSides || [];
  const dateStr = new Date().toLocaleDateString("ar-JO");

  const DIRS = [
    { value: "right", label: "يمين" },
    { value: "left", label: "يسار" },
    { value: "down", label: "تحت" },
    { value: "up", label: "فوق" },
  ];

  const hasImg = roofImage && typeof roofImage === "string" && roofImage.startsWith("data:");
  const hasBorders = r.borders?.sections?.length > 0;
  const hasBordersSimple = !hasBorders && Object.keys(r.borders?.lengths || {}).length > 0;
  const hasIron = r.ironFrame?.sections?.length > 0;

  return (
    <Document>
      <Page size="A4" style={S.page} wrap>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>توزيع الشراشف والحديد</Text>
          <Text style={S.subtitle}>{companyName || "شموخ ERP"} — {dateStr}</Text>
        </View>

        {/* Roof Image */}
        {hasImg ? (
          <>
            <Text style={S.imageLabel}>شكل المبنى</Text>
            <View style={S.imageBox}>
              <Image src={roofImage} style={S.roofImg} />
            </View>
          </>
        ) : null}

        {/* Summary */}
        <View style={S.summaryBox}>
          <Text style={S.summaryTitle}>📋 ملخص</Text>
          <View style={S.summaryGrid}>
            <View style={S.sumItem}><Text style={S.sumLabel}>المساحة</Text><Text style={S.sumValue}>{r.actualArea?.toFixed(1) || 0} م²</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>الأرجل</Text><Text style={S.sumValue}>{input?.numLegs || 0} رجل × {input?.legHeight || 0}م</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>طول الواجهات</Text><Text style={S.sumValue}>{r.totalFacadeLength?.toFixed(1) || 0}م</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>حديد الأرجل</Text><Text style={S.sumValue}>{r.iron10x10?.legs || 0} تيوب</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>فريم 10×10</Text><Text style={S.sumValue}>{r.ironFrame?.totalPieces || 0} تيوب</Text></View>
            <View style={S.sumItem}><Text style={S.sumLabel}>ميل السطح</Text><Text style={S.sumValue}>{r.slopeMultiplier ? `${((r.slopeMultiplier - 1) * 100).toFixed(0)}%` : "—"}</Text></View>
          </View>
        </View>

        {/* Sheet Distribution */}
        {(hasBorders || hasBordersSimple) ? (
          <View style={S.section} wrap={false}>
            <View style={S.secHead}>
              <Text style={S.secHeadText}>🪚 الشراشف — تفصيل لكل ضلع</Text>
            </View>
            <View style={S.secBody}>
              {hasBorders ? (
                <>
                  <View style={S.thRow}>
                    <Text style={[S.th, { flex: 0.5 }]}>#</Text>
                    <Text style={[S.th, { flex: 1 }]}>اتجاه</Text>
                    <Text style={[S.th, { flex: 1 }]}>الطول</Text>
                    <Text style={[S.th, { flex: 1.8 }]}>القطع</Text>
                    <Text style={[S.th, { flex: 0.7 }]}>هدر</Text>
                  </View>
                  {r.borders.sections.map((sec, i) => {
                    const edge = sides[i];
                    const dir = DIRS.find(d => d.value === edge?.direction)?.label || "";
                    const pieces = Object.entries(sec.lengths || {}).map(([l, c]) => `${l}م×${c}`).join(" + ");
                    const isLast = i === r.borders.sections.length - 1;
                    const bg = i % 2 === 1 ? { backgroundColor: C.stripe } : {};
                    return (
                      <View key={`b-${i}`} style={[isLast ? S.rowLast : S.row, bg]}>
                        <View style={[{ flex: 0.5, alignItems: "center" }]}>
                          <View style={[S.numBox, { backgroundColor: C.accent }]}>
                            <Text style={S.numText}>{i + 1}</Text>
                          </View>
                        </View>
                        <Text style={[{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 7 }]}>{dir}</Text>
                        <Text style={[{ flex: 1, textAlign: "right", fontWeight: 900, fontSize: 7 }]}>{sec.requiredLength}م</Text>
                        <View style={{ flex: 1.8, alignItems: "flex-end" }}>
                          <View style={S.pill}><Text style={S.pillText}>{pieces}</Text></View>
                        </View>
                        <Text style={[{ flex: 0.7, textAlign: "right", fontSize: 7, color: sec.waste > 0 ? C.red : C.muted }]}>
                          {sec.waste > 0 ? `+${sec.waste}م` : "—"}
                        </Text>
                      </View>
                    );
                  })}
                  <View style={S.summaryRow}>
                    <Text style={S.sumLabel}>الألواح: {r.borders.platesTotal}</Text>
                    <Text style={S.sumVal}>{r.borders.total}م</Text>
                    <Text style={[S.sumVal, { color: r.borders.waste > 0 ? C.red : C.text }]}>هدر: {r.borders.waste}م ({r.borders.wastePercent}%)</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={S.thRow}>
                    <Text style={[S.th, { flex: 1.5 }]}>القطع</Text>
                    <Text style={[S.th, { flex: 1 }]}>الكمية</Text>
                  </View>
                  {Object.entries(r.borders.lengths).map(([len, count], i) => {
                    const isLast = i === Object.keys(r.borders.lengths).length - 1;
                    const bg = i % 2 === 1 ? { backgroundColor: C.stripe } : {};
                    return (
                      <View key={`bl-${i}`} style={[isLast ? S.rowLast : S.row, bg]}>
                        <Text style={[{ flex: 1.5, textAlign: "right", fontWeight: 900, fontSize: 7 }]}>{len}م</Text>
                        <Text style={[{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 7 }]}>{count} شريحة</Text>
                      </View>
                    );
                  })}
                  <View style={S.summaryRow}>
                    <Text style={S.sumLabel}>الألواح: {r.borders.platesTotal}</Text>
                    <Text style={S.sumVal}>{r.borders.total}م</Text>
                    <Text style={[S.sumVal, { color: r.borders.waste > 0 ? C.red : C.text }]}>هدر: {r.borders.waste}م ({r.borders.wastePercent}%)</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        ) : null}

        {/* Iron Distribution */}
        {hasIron ? (
          <View style={S.section} wrap={false}>
            <View style={S.secHead}>
              <Text style={S.secHeadText}>🔩 فريم 10×10 — تفصيل لكل ضلع</Text>
            </View>
            <View style={S.secBody}>
              <View style={S.thRow}>
                <Text style={[S.th, { flex: 0.5 }]}>#</Text>
                <Text style={[S.th, { flex: 1 }]}>اتجاه</Text>
                <Text style={[S.th, { flex: 1 }]}>الطول</Text>
                <Text style={[S.th, { flex: 1.8 }]}>تيوب (6م)</Text>
                <Text style={[S.th, { flex: 0.7 }]}>هدر</Text>
              </View>
              {r.ironFrame.sections.map((sec, i) => {
                const edge = sides[i];
                const dir = DIRS.find(d => d.value === edge?.direction)?.label || "";
                const isLast = i === r.ironFrame.sections.length - 1;
                const bg = i % 2 === 1 ? { backgroundColor: C.stripe } : {};
                return (
                  <View key={`ir-${i}`} style={[isLast ? S.rowLast : S.row, bg]}>
                    <View style={[{ flex: 0.5, alignItems: "center" }]}>
                      <View style={[S.numBox, { backgroundColor: "#64748b" }]}>
                        <Text style={S.numText}>{i + 1}</Text>
                      </View>
                    </View>
                    <Text style={[{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 7 }]}>{dir}</Text>
                    <Text style={[{ flex: 1, textAlign: "right", fontWeight: 900, fontSize: 7 }]}>{sec.requiredLength}م</Text>
                    <View style={{ flex: 1.8, alignItems: "flex-end" }}>
                      <View style={S.pillSlate}><Text style={S.pillSlateText}>{sec.pieces} تيوب</Text></View>
                    </View>
                    <Text style={[{ flex: 0.7, textAlign: "right", fontSize: 7, color: sec.waste > 0 ? C.red : C.muted }]}>
                      {sec.waste > 0 ? `+${sec.waste}م` : "—"}
                    </Text>
                  </View>
                );
              })}
              <View style={S.summaryRow}>
                <Text style={S.sumLabel}>التيوبات: {r.ironFrame?.totalPieces ?? 0}</Text>
                <Text style={S.sumVal}>{r.ironFrame.total}م</Text>
                <Text style={[S.sumVal, { color: r.ironFrame.waste > 0 ? C.red : C.text }]}>هدر: {r.ironFrame.waste}م ({r.ironFrame.wastePercent}%)</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Legs */}
        <View style={S.legBox}>
          <Text style={S.legText}>🦵 الأرجل: {input?.numLegs || 0} رجل × {input?.legHeight || 0}م → {r.iron10x10?.legs || 0} تيوب 10×10</Text>
        </View>

        {/* Grand Totals */}
        <View style={S.grandBox}>
          <Text style={S.grandLabel}>إجمالي الشراشف: {r.borders?.platesTotal || 0} ألواح</Text>
          <Text style={S.grandValue}>إجمالي الحديد: {r.ironFrame?.totalPieces || 0} تيوب</Text>
        </View>
      </Page>
    </Document>
  );
}
