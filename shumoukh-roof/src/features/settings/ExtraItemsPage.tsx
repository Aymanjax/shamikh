// @ts-nocheck
import { useState, useEffect } from "react";
import { Package, Plus, X, Check, Save } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { useT } from "../../i18n";
import GlassButton from "../../components/ui/GlassButton";

const DEFAULT_ITEMS = [
  { name: "زيت حار", unit: "كغم" },
  { name: "فرنيش", unit: "كغم" },
  { name: "نفط", unit: "لتر" },
  { name: "روف جارد", unit: "كغم" },
  { name: "رول دهان", unit: "حبة" },
  { name: "فرش", unit: "حبة" },
  { name: "مسامير بولاد", unit: "باكيت" },
  { name: "مسامير فرد", unit: "باكيت" },
  { name: "مسامير 4سم", unit: "كغم" },
  { name: "اسلاك لحام", unit: "حبة" },
  { name: "فيبر قص حديد", unit: "حبة" },
  { name: "مبروم حديد", unit: "حبة" },
  { name: "بودرة", unit: "كيس" },
  { name: "اسمنت", unit: "كيس" },
  { name: "سيلكون", unit: "حبة" },
];

const ITEM_NAME_MAX_LENGTH = 100;

export default function ExtraItemsPage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Array<{ name: string; unit: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("حبة");
  const [maxItemsWarning, setMaxItemsWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setItems(DEFAULT_ITEMS); setLoading(false); return; }
    setLoading(true);
    getDoc(doc(db, "users", user.uid, "profile", "main"))
      .then((snap) => {
        if (snap.exists() && snap.data().extraItems) setItems(snap.data().extraItems);
        else setItems(DEFAULT_ITEMS);
      })
      .catch(() => setItems(DEFAULT_ITEMS))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, "users", user.uid, "profile", "main"), { extraItems: items }, { merge: true });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (items.length >= 100) {
      setMaxItemsWarning(true);
      return;
    }
    setItems((p) => [...p, { name: newName.trim().slice(0, ITEM_NAME_MAX_LENGTH), unit: newUnit }]);
    setNewName("");
    setMaxItemsWarning(false);
  };

  const handleRemove = (i: number) => {
    setItems((p) => p.filter((_, j) => j !== i));
    setMaxItemsWarning(false);
  };

  const handleEdit = (i: number, field: "name" | "unit", value: string) => {
    if (field === "name" && value.length > ITEM_NAME_MAX_LENGTH) return;
    setItems((p) => p.map((item, j) => j === i ? { ...item, [field]: value } : item));
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-earth-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-28 bg-earth-200 rounded animate-pulse" />
            <div className="h-3 w-36 bg-earth-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="earth-card p-5">
          <div className="h-11 w-full bg-earth-100 rounded-xl animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 w-full bg-earth-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-terracotta-500 flex items-center justify-center shadow-lg shadow-terracotta-500/30">
            <Package className="w-6 h-6 text-paper" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-ink-primary tracking-tight">{t("settings.extraItems.title")}</h1>
            <p className="text-sm text-ink-muted">{t("settings.extraItems.subtitle")}</p>
          </div>
        </div>
        <GlassButton variant="primary" size="sm" icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} onClick={handleSave} disabled={saving}>
          {saved ? t("settings.done") : t("common.save")}
        </GlassButton>
      </div>

      <div className="earth-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <input value={newName} onChange={(e) => setNewName(e.target.value.slice(0, ITEM_NAME_MAX_LENGTH))}
            placeholder={t("settings.extraItems.namePlaceholder")}
            maxLength={ITEM_NAME_MAX_LENGTH}
            className="flex-1 min-w-0 bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-medium min-h-[44px] break-words" />
          <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
            className="bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-ice-blue-500 transition font-medium min-h-[44px]">
            {["حبة", "كغم", "لتر", "باكيت", "كيس", "متر", "رول", "علبة"].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <button onClick={handleAdd} disabled={!newName.trim()}
            className="bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-40 text-earth-100 p-2.5 rounded-sm transition border-2 border-terracotta-500 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>

         <div className="divide-y-2 divide-earth-200">
          {maxItemsWarning && (
            <div className="text-[11px] text-red-500 font-bold py-2" role="alert">{t("settings.extraItems.maxItems")}</div>
          )}
          {items.map((item, i) => (
            <div key={i} className="py-3 flex items-center gap-3 min-h-[44px]">
              <span className="text-xs text-ink-muted w-6 font-bold shrink-0">{i + 1}</span>
              <input value={item.name} onChange={(e) => handleEdit(i, "name", e.target.value)}
                maxLength={ITEM_NAME_MAX_LENGTH}
                className="flex-1 min-w-0 bg-transparent border-0 border-b-2 border-dashed border-earth-200 py-1 px-1 text-sm outline-none focus:border-terracotta-400 transition font-medium break-words" />
              <select value={item.unit} onChange={(e) => handleEdit(i, "unit", e.target.value)}
                className="bg-white border-2 border-earth-200 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-terracotta-400 transition font-medium shrink-0 min-h-[32px]">
                {["حبة", "كغم", "لتر", "باكيت", "كيس", "متر", "رول", "علبة"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button onClick={() => handleRemove(i)} className="text-ink-muted hover:text-red-500 transition p-1 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-sm text-ink-muted text-center py-6 font-bold">{t("settings.extraItems.empty")}</p>
        )}
      </div>
    </div>
  );
}
