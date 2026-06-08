// @ts-nocheck
import { Eye, EyeOff, FileText, Printer, Send, Layers } from "lucide-react";
import GlassButton from "../../../components/ui/GlassButton";

function groupLabel(key) {
  const map = {
    tiles: "القرميد",
    iron: "الحديد",
    wood: "الخشب",
    insulation: "العزل",
    extra: "مواد إضافية",
  };
  return map[key] || key;
}

const groupAccent = {
  tiles: { border: "#c2703e", bg: "rgba(194,112,62,0.06)", text: "#c2703e" },
  iron: { border: "#6b7c5e", bg: "rgba(107,124,94,0.06)", text: "#6b7c5e" },
  wood: { border: "#b8860b", bg: "rgba(184,134,11,0.06)", text: "#b8860b" },
  insulation: { border: "#4a90b8", bg: "rgba(74,144,184,0.06)", text: "#4a90b8" },
  extra: { border: "#8a7e6e", bg: "rgba(138,126,110,0.06)", text: "#8a7e6e" },
};

export default function ResultPanel({
  result, tile, input, customFields, hiddenItems, toggleHiddenItem,
  costResult, prices, showPrices, closed, area, sides, projectData,
  onPrintQuotation, onPrintDistribution, onPrintIronFrame, onWhatsAppSend,
  loadingSuppliers, supplierPrices,
}) {
  const grouped = [
    {
      key: "tiles",
      items: [
        { id: "tiles", label: tile?.name || "قرميد", value: result.totalTiles, unit: "حبة" },
        { id: "tileStarts", label: "بدايات القرميد", value: result.tileStarts || 0, unit: "حبة" },
        { id: "tarabeesh", label: "الطرابيش", value: result.actualTarabeesh != null ? result.actualTarabeesh : result.tarabeesh, unit: "م" },
      ],
    },
    {
      key: "iron",
      items: [
        { id: "iron4x8", label: "حديد 4×8", value: result.iron4x8, unit: "تيوب" },
        { id: "iron10x10", label: "حديد 10×10", value: result.iron10x10?.total || 0, unit: "تيوب" },
      ],
    },
    {
      key: "wood",
      items: [
        ...(input.withDecor ? [{ id: "decor", label: "الديكور", value: result.decor?.bundles || 0, unit: "ربطة" }] : []),
        { id: "besh", label: "البيش", value: result.beshQty, unit: "حبة" },
        { id: "borders", label: "الشراشف", value: result.borders?.total || 0, unit: "م" },
        { id: "woodBases", label: "أسس خشب", value: result.woodBases, unit: "حبة" },
        { id: "longAsas", label: "أسس طويل", value: result.longAsas || 0, unit: "حبة" },
        { id: "metalSheets", label: "شرحات صاج", value: result.metalSheets || 0, unit: "شريحة" },
      ],
    },
    {
      key: "insulation",
      items: [
        { id: "tarpaulin", label: "مشمع", value: result.tarpaulin?.rolls || 0, unit: "رول" },
        ...(input.enableInsulation ? [
          { id: "zafta", label: "زفتة", value: result.insulation?.zaftaRolls || 0, unit: "رول" },
          { id: "latiSheets", label: "الواح لاتي", value: result.insulation?.latiSheets || 0, unit: "لوح" },
        ] : []),
        { id: "silicone", label: "سلكون", value: result.metalSheets || 0, unit: "حبة" },
      ].filter(i => i.value > 0),
    },
    {
      key: "extra",
      items: customFields.filter(cf => cf.name).map((cf, i) => ({
        id: `extra-${i}`, label: cf.name, value: parseFloat(cf.value) || 0, unit: cf.unit || "",
      })),
    },
  ];

  return (
    <div className="space-y-4">
      {closed && grouped.map((group) => {
        const visibleItems = group.items.filter((item) => item.value > 0 && !hiddenItems.has(item.id));
        if (visibleItems.length === 0 && group.key !== "extra") return null;
        const accent = groupAccent[group.key] || groupAccent.extra;
        return (
          <div key={group.key} className="bg-white border border-earth-200 overflow-hidden rounded-sm"
            style={{ borderRightWidth: "3px", borderRightColor: accent.border }}
          >
            <div className="px-4 py-2.5" style={{ backgroundColor: accent.bg }}>
              <h4 className="text-[11px] font-black" style={{ color: accent.text }}>{groupLabel(group.key)}</h4>
            </div>
            <div className="divide-y divide-earth-100">
              {group.items
                .filter((item) => item.value > 0)
                .map((item) => (
                  <div key={item.id}
                    className={`px-4 py-2.5 flex items-center justify-between transition ${hiddenItems.has(item.id) ? "opacity-30" : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <button onClick={() => toggleHiddenItem(item.id)}
                        className="text-earth-400 hover:text-olive-600 transition cursor-pointer shrink-0">
                        {hiddenItems.has(item.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <span className="text-xs font-bold text-earth-900 truncate">{item.label}</span>
                    </div>
                    <span className="text-xs font-black font-mono text-earth-900 shrink-0 mr-2">
                      {item.value} <span className="text-[9px] text-earth-500 font-medium">{item.unit}</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}

      {closed && showPrices && costResult && (
        <div className="bg-white border border-earth-200 overflow-hidden rounded-sm"
          style={{ borderRightWidth: "3px", borderRightColor: "#6b7c5e" }}
        >
          <div className="px-4 py-2.5 bg-olive-50">
            <h4 className="text-[11px] font-black text-olive-700">التكلفة الإجمالية</h4>
          </div>
          <div className="divide-y divide-earth-100">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-black text-olive-600">المجموع</span>
              <span className="text-sm font-black font-mono text-olive-600">{costResult.total.toFixed(2)} د.أ</span>
            </div>
          </div>
        </div>
      )}

      {showPrices && supplierPrices.length > 0 && (
        <div className="bg-white border border-earth-200 overflow-hidden rounded-sm"
          style={{ borderRightWidth: "3px", borderRightColor: "#b8860b" }}
        >
          <div className="px-4 py-2.5 bg-amber-50">
            <h4 className="text-[11px] font-black text-amber-700">مقارنة أسعار الموردين</h4>
          </div>
          <div className="divide-y divide-earth-100 max-h-48 overflow-y-auto">
            {supplierPrices.map((s) => (
              <div key={s.id} className="px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-earth-900">{s.name}</span>
                <span className="text-[10px] font-mono text-olive-600 font-black">{s.estimatedTotal.toFixed(0)} د.أ</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {closed && (
        <div className="flex flex-col gap-1.5">
          <GlassButton variant="accent" size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={onPrintQuotation}
            className="justify-center text-[11px]">
            عرض سعر PDF
          </GlassButton>
          <GlassButton variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={onPrintDistribution}
            className="justify-center text-[11px]">
            طباعة التوزيعة
          </GlassButton>
          <GlassButton variant="secondary" size="sm" icon={<Layers className="w-3.5 h-3.5" />} onClick={onPrintIronFrame}
            className="justify-center text-[11px]">
            طباعة الحديد
          </GlassButton>
          <GlassButton variant="ghost" size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={onWhatsAppSend}
            className="justify-center text-[11px]">
            واتساب
          </GlassButton>
        </div>
      )}

      {!closed && (
        <div className="bg-white border border-earth-200 border-r-3 rounded-sm p-6 text-center" style={{ borderRightColor: "#c4b8a8" }}>
          <Layers className="w-8 h-8 mx-auto mb-3 text-earth-400 opacity-50" />
          <p className="text-xs text-earth-500 font-bold">ارسم المبنى لرؤية النتائج</p>
        </div>
      )}
    </div>
  );
}